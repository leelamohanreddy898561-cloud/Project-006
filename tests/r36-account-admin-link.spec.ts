import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import {
  deleteTestAccount,
  deleteTestProfile,
  readProject,
  uniqueEmail,
} from "./helpers/auth-account";

/**
 * R36 — the Admin link in the account menu. Maps to TC-3601 … TC-3604.
 *
 * The absent cases are proved against the real app: signed out, and signed in
 * as a throwaway account the suite creates and deletes. The allow case needs an
 * account promoted in the Firebase console, so it stays manual (TC-3604) for
 * the same reason TC-3103 and TC-3504 do. TC-3603 proves the branch that only
 * an admin reaches is wired to the same role seam the /admin guard uses.
 */

const project = readProject();
const PASSWORD = "Pulse-Test-2026!";

test.describe("R36 — no Admin link for a signed-out visitor", () => {
  test("TC-3601: a signed-out visitor sees no Admin link on any header route", async ({
    page,
  }) => {
    for (const route of ["/", "/blog", "/signin"]) {
      await page.goto(route);

      const header = page.locator("header.site-header");

      await expect(
        header.getByRole("link", { name: "Admin", exact: true }),
        `${route} must not offer an admin shortcut to a signed-out visitor`,
      ).toHaveCount(0);

      // The signed-out controls are what belongs there instead.
      await expect(
        header.getByRole("button", { name: "Sign out" }),
      ).toHaveCount(0);
    }
  });
});

test.describe("R36 — a standard account never gets the link", () => {
  test.skip(!project, "Firebase is not configured in .env");

  test.describe.configure({ mode: "serial" });

  const email = uniqueEmail();
  let created = false;

  test.afterAll(async () => {
    if (created && project) {
      await deleteTestProfile(project, email, PASSWORD);
      await deleteTestAccount(project, email, PASSWORD);
    }
  });

  test("TC-3602: a signed-in student sees the account but no Admin link", async ({
    page,
  }) => {
    // A live signup plus a cold Firestore connection needs more than 30 s
    // when the suite runs several workers.
    test.setTimeout(90_000);

    await page.goto("/signup");

    const form = page.locator(".auth-form");
    await form.getByLabel("Email", { exact: true }).fill(email);
    await form.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    created = true;

    await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });

    const header = page.locator("header.site-header");

    // The account menu really rendered — the absence below is a decision, not
    // a header that never appeared.
    await expect(header.getByRole("button", { name: "Sign out" })).toBeVisible({
      timeout: 30_000,
    });

    // The profile exists and is a student: the same read the menu makes.
    await expect
      .poll(
        () =>
          page.evaluate(async () => {
            const hook = (
              window as unknown as {
                __getUserRole?: () => Promise<string | null>;
              }
            ).__getUserRole;

            return hook ? hook() : "missing-dev-hook";
          }),
        {
          message: "users/{uid} must exist with role student",
          timeout: 30_000,
        },
      )
      .toBe("student");

    await expect(
      header.getByRole("link", { name: "Admin", exact: true }),
      "a student must never see the admin shortcut",
    ).toHaveCount(0);

    // AC36.5 — the link would grant nothing anyway: the guard still holds.
    await page.goto("/admin/dashboard");
    await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: "Admin", level: 1 }),
    ).toHaveCount(0);
  });
});

test.describe("R36 — the link is wired to the guard's role seam", () => {
  test("TC-3603: the Admin link renders only for an admin role", () => {
    const menu = readFileSync(
      path.resolve("src/components/AccountMenu.tsx"),
      "utf8",
    );
    const roleHook = readFileSync(
      path.resolve("src/hooks/useUserRole.ts"),
      "utf8",
    );
    const app = readFileSync(path.resolve("src/App.tsx"), "utf8");

    // One seam: the role comes from useUserRole, and the decision is the same
    // isAdminRole the /admin guard uses.
    expect(menu).toContain("useUserRole(user)");
    expect(menu).toContain("isAdminRole(role)");
    expect(roleHook).toContain("ensureUserProfile");

    // The link, its destination, its accessible name and its class.
    const link = menu.match(/<Link\b[\s\S]*?<\/Link>/)?.[0] ?? "";
    expect(link).toContain('to="/admin/dashboard"');
    expect(link).toContain("Admin");
    expect(link).toContain('className="account__admin"');

    // Rendered only behind that decision — absent while the role loads, when
    // the read fails, and for every non-admin role (fail closed, AC36.2).
    expect(menu).toMatch(
      /\{showAdminLink\s*&&\s*\(\s*<Link\b[\s\S]*?<\/Link>\s*\)\}/,
    );
    expect(menu).toMatch(/const showAdminLink = isAdminRole\(role\);/);

    // AC36.5 — the shortcut still lands behind the R31 guard.
    expect(app).toMatch(
      /path="\/admin\/dashboard"[\s\S]{0,240}<RequireAdmin>/,
    );
  });
});
