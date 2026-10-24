import { expect, test } from "@playwright/test";
import {
  deleteTestAccount,
  deleteTestProfile,
  readProject,
  uniqueEmail,
} from "./helpers/auth-account";

/**
 * R31 — user roles and the protected /admin route. Maps to TC-3101 … TC-3103.
 *
 * The signed-out redirect is automatic. The standard-user path signs up a real
 * account, proves the Firestore profile was written with role "student", and
 * proves /admin sends that account home. The admin-allow path needs an account
 * promoted in the Firebase console, so it stays a manual case (TC-3103).
 */

const project = readProject();
const PASSWORD = "Pulse-Test-2026!";

test.describe("R31 — protected admin route", () => {
  test("TC-3101: a signed-out visitor is sent to sign in @smoke", async ({
    page,
  }) => {
    await page.goto("/admin");

    await expect(page).toHaveURL(/\/signin$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Welcome back",
    );
    await expect(
      page.getByRole("heading", { name: "Admin", level: 1 }),
    ).toHaveCount(0);
  });
});

test.describe("R31 — roles, end to end", () => {
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

  test("TC-3102: a new account is stored as a student and /admin sends it home", async ({
    page,
  }) => {
    // A live signup plus a cold Firestore connection is slower than the 30 s
    // default, especially when the suite runs several workers.
    test.setTimeout(90_000);

    await page.goto("/signup");

    const form = page.locator(".auth-form");
    await form.getByLabel("Email", { exact: true }).fill(email);
    await form.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    created = true;

    await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });

    // R31.1 — the profile really exists in Firestore, with the default role.
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

    // R31.4 — a standard user never reaches admin content.
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });
    await expect(
      page.getByRole("heading", { name: "Admin", level: 1 }),
    ).toHaveCount(0);
    await expect(page.getByText("Restricted area")).toHaveCount(0);

    // Still signed in: the redirect is a role decision, not a sign-out.
    await expect(
      page.locator("header.site-header").getByRole("button", { name: "Sign out" }),
    ).toBeVisible();
  });
});
