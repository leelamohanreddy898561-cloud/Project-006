import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  deleteTestAccount,
  deleteTestProfile,
  readProject,
  uniqueEmail,
} from "./helpers/auth-account";

/**
 * R35 — uploads go through an admin-gated Cloud Function.
 *
 * Why: the project's Storage bucket does not apply Storage Security Rules (a
 * fault I could not repair from the CLI), so the browser SDK cannot write to it
 * whatever `storage.rules` says. The Admin SDK is not subject to those rules, so
 * the upload moved to a callable function, and the admin check moved with it —
 * read server-side from the same `users/{uid}.role` the /admin guard uses.
 *
 * TC-3501 proves the gate from the outside: a real signed-in account that is
 * not an admin is refused, and one with role "student" is refused too. That is
 * the direction the suite can reach without a console-promoted account.
 * TC-3502 pins the wiring so the client cannot quietly go back to the Storage
 * SDK, and the function cannot lose the size/type/path guards.
 */

const project = readProject();
const PASSWORD = "Pulse-Test-2026!";

/** A 1x1 PNG, base64 — enough for the function's decode path. */
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function endpoint(): string {
  return `https://us-central1-${project?.projectId}.cloudfunctions.net/uploadBlogImage`;
}

test.describe("R35 — the upload endpoint refuses everyone but an admin", () => {
  test.skip(!project, "Firebase is not configured in .env");

  test("TC-3501: a signed-in non-admin is refused (AC35.2)", async () => {
    test.setTimeout(120_000);

    const target = project;
    test.skip(!target, "Firebase is not configured in .env");
    if (!target) return;

    const email = uniqueEmail();
    const signUp = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${target.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: PASSWORD, returnSecureToken: true }),
      },
    );
    const creds = (await signUp.json()) as { idToken?: string; localId?: string };

    expect(creds.idToken, "the probe account must exist").toBeTruthy();

    try {
      const call = () =>
        fetch(endpoint(), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${creds.idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: { dataUrl: PNG, fileName: "probe.png" } }),
        });

      // No profile document at all: not an admin.
      const anonymousProfile = await call();
      expect(anonymousProfile.status).toBe(403);
      expect((await anonymousProfile.json())?.error?.status).toBe("PERMISSION_DENIED");

      // A real profile, but the default "student" role: still not an admin.
      const seed = await fetch(
        `https://firestore.googleapis.com/v1/projects/${target.projectId}/databases/(default)/documents/users/${creds.localId}?key=${project?.apiKey}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${creds.idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fields: {
              email: { stringValue: email },
              role: { stringValue: "student" },
            },
          }),
        },
      );

      expect(seed.status, "R31 rules let an account write its own profile").toBe(200);

      const studentProfile = await call();
      expect(studentProfile.status).toBe(403);
      expect((await studentProfile.json())?.error?.status).toBe("PERMISSION_DENIED");
    } finally {
      await deleteTestProfile(target, email, PASSWORD);
      await deleteTestAccount(target, email, PASSWORD);
    }
  });
});

test.describe("R35 — the upload wiring is pinned", () => {
  test("TC-3502: the client uses the function, the function guards the write (AC35.1, AC35.3–AC35.5)", () => {
    const seam = readFileSync(path.resolve("src/lib/blogs.ts"), "utf8");
    const fn = readFileSync(path.resolve("functions/index.js"), "utf8");
    const config = JSON.parse(readFileSync(path.resolve("firebase.json"), "utf8"));

    // The client calls the function and no longer touches the Storage SDK.
    expect(seam).toContain('httpsCallable(getFunctions(app), "uploadBlogImage")');
    expect(seam, "the browser SDK must not write Storage directly").not.toContain(
      'import("firebase/storage")',
    );
    expect(seam).toContain('httpsCallable(getFunctions(app), "deleteBlogImage")');

    // The function is the only place that decides who may upload. R41 added a
    // workspace-aware path; the legacy (no workspace) path is still the R35
    // global-admin check, and both run server-side.
    expect(fn).toContain("admin.firestore().doc(`users/${uid}`)");
    expect(fn).toContain('profile.data().role === "admin"');
    expect(fn, "a workspace upload needs that workspace's owner or an editor").toContain(
      'CAN_EDIT.has(role)',
    );
    expect(fn, "the cap must match the form").toContain("5 * 1024 * 1024");
    expect(fn).toContain("image\\/");
    expect(fn, "the folder must be namespaced by the caller").toContain(
      "`blog-images/${uid}`",
    );
    expect(fn, "an image a post does not reference is removable").toContain(
      "deleteBlogImage",
    );

    // The deployment carries the function.
    expect(config.functions?.source).toBe("functions");
  });
});
