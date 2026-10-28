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
 * R44 — the launcher and the workspace-scoped admin.
 *
 * The signed-out cases run for real. A signed-in case uses a throwaway account
 * the suite creates and deletes, which owns no workspace - that is the empty
 * state the product must not fake. The owner/editor path needs a workspace owned
 * by the signed-in account, so the wiring is proved statically (TC-4403) rather
 * than by promoting an account in the console.
 */

const project = readProject();
const PASSWORD = "Pulse-Test-2026!";

const read = (relative: string) =>
  readFileSync(path.resolve(relative), "utf8");

test.describe("R44 — access to the launcher and to a workspace admin", () => {
  test("TC-4401: a signed-out visitor is sent to sign in, from both pages", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/signin$/);
    await expect(
      page.getByRole("heading", { name: "My sites" }),
    ).toHaveCount(0);

    await page.goto("/w/alpha-labs/admin");
    await expect(page).toHaveURL(/\/signin$/);
    await expect(page.getByText("Workspace admin")).toHaveCount(0);
  });
});

test.describe("R44 — an account with no site sees no site", () => {
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

  test("TC-4402: the launcher is reachable and says there is nothing yet", async ({
    page,
  }) => {
    test.setTimeout(90_000);

    await page.goto("/signup");

    const form = page.locator(".auth-form");
    await form.getByLabel("Email", { exact: true }).fill(email);
    await form.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Create account" }).click();
    created = true;

    await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });

    const header = page.locator("header.site-header");
    const sites = header.getByRole("link", { name: "My sites" });
    await expect(sites).toBeVisible({ timeout: 30_000 });

    await sites.click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(
      page.getByRole("heading", { level: 1, name: "My sites" }),
    ).toBeVisible();

    await expect(page.getByText("No sites yet")).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator(".site-card")).toHaveCount(0);
  });
});

test.describe("R44 — the gate is the workspace role, not the global one", () => {
  test("TC-4403: the launcher lists owned sites and the admin gate reads membership", () => {
    const dashboard = read("src/pages/Dashboard.tsx");
    const admin = read("src/pages/WorkspaceAdmin.tsx");
    const hook = read("src/hooks/useMyWorkspaces.ts");
    const seam = read("src/lib/workspaces.ts");
    const app = read("src/App.tsx");

    // The launcher asks for the account's own workspaces only, and links to the
    // site and to that site's admin.
    expect(hook).toContain('where("ownerUid", "==", uid)');
    expect(dashboard).toContain("/w/${workspace.slug}/admin");
    expect(dashboard).toContain("No sites yet");

    // Both routes are registered.
    expect(app).toContain('path="/dashboard"');
    expect(app).toContain('path="/w/:siteSlug/admin"');

    // The workspace admin decides access by the workspace role.
    expect(admin).toContain("fetchWorkspaceRole(");
    expect(admin).not.toContain("isAdminRole");

    // The owner is settled before the member document is read, because the
    // members rule refuses that read for an owner who has no member document.
    const ownerCheck = seam.indexOf("workspace.data().ownerUid === uid");
    const memberRead = seam.indexOf("memberPath(workspaceId, uid)");

    expect(ownerCheck).toBeGreaterThan(-1);
    expect(memberRead).toBeGreaterThan(-1);
    expect(ownerCheck).toBeLessThan(memberRead);

    // A denied member read means "not a member", not "could not check".
    expect(seam).toContain('=== "permission-denied"');
  });
});
