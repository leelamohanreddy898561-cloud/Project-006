import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import {
  accountExists,
  deleteTestAccount,
  readProject,
  uniqueEmail,
} from "./helpers/auth-account";

/**
 * R29 — Google and email/password authentication, live.
 *
 * Google's pop-up needs a real Google account and a human consent screen, so
 * that flow is a `manual` test case (TC-2906) recorded in evidence.md. Email
 * and password are covered end to end here, against the real project, using an
 * account that is deleted in `afterAll`.
 */

const project = readProject();
const PASSWORD = "Pulse-Test-2026!";

test.describe("R29 — live authentication", () => {
  test("TC-2901: a signed-out visitor sees Sign In and Sign Up", async ({
    page,
  }) => {
    await page.goto("/");

    const header = page.locator("header.site-header");

    await expect(header.getByRole("link", { name: "Sign In" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Sign Up" })).toBeVisible();
    await expect(header.getByRole("button", { name: "Sign out" })).toHaveCount(
      0,
    );
  });

  test("TC-2902: only the auth seam may import firebase/auth", () => {
    const root = path.resolve("src");
    const allowed = new Set(["src/lib/auth.ts", "src/lib/firebase.ts"]);
    const offenders: string[] = [];

    const walk = (directory: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const full = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          walk(full);
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
          const relative = path
            .relative(path.resolve("."), full)
            .replace(/\\/g, "/");

          if (allowed.has(relative)) continue;

          const source = readFileSync(full, "utf8");

          if (/"firebase\/auth"/.test(source) || /'firebase\/auth'/.test(source)) {
            offenders.push(relative);
          }
        }
      }
    };

    walk(root);

    expect(
      offenders,
      "firebase/auth may only be imported by the seam (R24.15, R29.7)",
    ).toEqual([]);
  });
});

test.describe("R29 — email and password, end to end", () => {
  test.skip(!project, "Firebase is not configured in .env");

  test.describe.configure({ mode: "serial" });

  const email = uniqueEmail();
  let created = false;

  test.afterAll(async () => {
    if (created && project) {
      await deleteTestAccount(project, email, PASSWORD);
    }
  });

  test("TC-2903: signing up creates a real session that survives a reload", async ({
    page,
  }) => {
    await page.goto("/signup");

    // Scoped to the form: the footer newsletter is also labelled "Email".
    const form = page.locator(".auth-form");

    await form.getByLabel("Email", { exact: true }).fill(email);
    await form.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();

    created = true;

    // The page leaves for home, and the header shows the real session.
    const header = page.locator("header.site-header");

    await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
    await expect(
      header.getByRole("button", { name: "Sign out" }),
      "the header must show the signed-in account",
    ).toBeVisible({ timeout: 30_000 });
    await expect(header.getByRole("link", { name: "Sign In" })).toHaveCount(0);

    // R29.3 — the session is persisted, not just in memory.
    await page.reload();
    await expect(header.getByRole("button", { name: "Sign out" })).toBeVisible({
      timeout: 30_000,
    });
  });

  test("TC-2904: signing in and out works, and sign-out is not undone by a reload", async ({
    page,
  }) => {
    // A fresh context per test, so this signs in with the account TC-2903 made.
    await page.goto("/signin");

    const form = page.locator(".auth-form");
    await form.getByLabel("Email", { exact: true }).fill(email);
    await form.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });

    const header = page.locator("header.site-header");

    await expect(header.getByRole("button", { name: "Sign out" })).toBeVisible({
      timeout: 30_000,
    });

    await header.getByRole("button", { name: "Sign out" }).click();

    await expect(header.getByRole("link", { name: "Sign In" })).toBeVisible({
      timeout: 30_000,
    });

    // The session must be gone, not merely hidden.
    await page.reload();
    await expect(header.getByRole("link", { name: "Sign In" })).toBeVisible();
    await expect(header.getByRole("button", { name: "Sign out" })).toHaveCount(
      0,
    );
  });

  test("TC-2905: the temporary account does not survive the run", async () => {
    expect(project, "this project must be configured").not.toBeNull();

    const removed = await deleteTestAccount(project!, email, PASSWORD);

    expect(removed, "cleanup must delete the account the test created").toBe(
      true,
    );
    expect(
      await accountExists(project!, email, PASSWORD),
      "the test account must no longer exist",
    ).toBe(false);

    created = false; // the afterAll safety net has nothing left to do
  });
});
