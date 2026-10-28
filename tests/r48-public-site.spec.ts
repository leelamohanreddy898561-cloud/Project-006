import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  deleteTestAccount,
  deleteTestDocument,
  deleteTestProfile,
  listTestDocuments,
  readProject,
  signUpTestAccount,
  uniqueEmail,
  writeTestDocument,
  type TestSession,
} from "./helpers/auth-account";

/**
 * R48 — a public site stays public; admin is site-scoped.
 *
 * TC-4801 signs a real throwaway owner in and reads the header on its own public
 * site and on another tenant's public site: the identity stays, every admin
 * destination is gone, and the direct admin URL still works. TC-4803 reads the
 * wiring back so a future edit that reintroduces the global shortcut fails the
 * normal run. The enforced boundary is executed by TC-4802 in the emulator.
 */

const project = readProject();
const PASSWORD = "Pulse-Public-2026!";

const read = (relative: string) =>
  readFileSync(path.resolve(relative), "utf8");

/** The body of one `match <path> { … }` block, nested blocks included. */
function blockBody(source: string, header: string): string {
  const start = source.indexOf(header);

  if (start === -1) return "";

  const open = source.indexOf("{", start + header.length);
  let depth = 0;

  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }

  return "";
}

/** A tenant's public header: the account stays, every header admin link goes. */
async function expectPublicHeader(page: import("@playwright/test").Page) {
  const header = page.locator("header.site-header");

  await expect(header.getByRole("button", { name: "Sign out" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(
    header.getByRole("link", { name: "Admin", exact: true }),
  ).toHaveCount(0);
  await expect(
    header.getByRole("link", { name: "My site", exact: true }),
  ).toHaveCount(0);
  await expect(
    header.getByRole("link", { name: "My sites", exact: true }),
  ).toHaveCount(0);
}

/** R48.1 — a visitor with no role on this site sees no write control at all. */
async function expectNoAdminControls(page: import("@playwright/test").Page) {
  await expect(page.getByRole("link", { name: "Add new blog" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^Edit|^Delete/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("complementary", { name: "Site administration" }),
  ).toHaveCount(0);
}

/** R48.7 — the site's own owner gets exactly one visible way into its admin. */
async function expectSiteAdminBar(
  page: import("@playwright/test").Page,
  slug: string,
) {
  const bar = page.getByRole("complementary", {
    name: "Site administration",
  });

  await expect(bar).toBeVisible({ timeout: 30_000 });
  await expect(bar.getByText("Owner", { exact: true })).toBeVisible();
  await expect(bar.getByRole("link", { name: "Site admin" })).toHaveAttribute(
    "href",
    `/w/${slug}/admin`,
  );
  await expect(
    bar.getByRole("link", { name: "Add new blog" }),
  ).toHaveAttribute("href", `/w/${slug}/admin/new`);
}

test.describe("R48 — a signed-in visitor still reads a public site", () => {
  test.skip(!project, "Firebase is not configured in .env");

  test.describe.configure({ mode: "serial" });

  const email = uniqueEmail().replace("r29-test", "r48-test");
  const slug = `r48-suite-${Date.now().toString(36)}`;
  const siteName = "R48 Public Site";

  let session: TestSession | null = null;
  let created = false;

  test.afterAll(async () => {
    if (!project || !session) return;

    const posts = await listTestDocuments(
      project,
      session.idToken,
      `workspaces/${slug}/blogs`,
    );

    for (const post of posts) {
      await deleteTestDocument(
        project,
        session.idToken,
        `workspaces/${slug}/blogs/${post}`,
      );
    }

    await deleteTestDocument(project, session.idToken, `workspaces/${slug}`);

    if (created) {
      await deleteTestProfile(project, email, PASSWORD);
      await deleteTestAccount(project, email, PASSWORD);
    }
  });

  test("TC-4801: the owner keeps one way into its own admin, and no way into another", async ({
    page,
  }) => {
    test.setTimeout(150_000);

    session = await signUpTestAccount(project!, email, PASSWORD);
    expect(session, "the throwaway tenant account").not.toBeNull();
    created = true;

    const written = await writeTestDocument(
      project!,
      session!.idToken,
      `workspaces/${slug}`,
      {
        name: { stringValue: siteName },
        slug: { stringValue: slug },
        ownerUid: { stringValue: session!.localId },
        branding: {
          mapValue: {
            fields: {
              title: { stringValue: siteName },
              tagline: { stringValue: "Written by the suite." },
            },
          },
        },
        createdAt: { timestampValue: new Date().toISOString() },
      },
    );

    expect(written, "the account creates the workspace it owns").toBe(true);

    // A single-site owner lands on their own site (R46).
    await page.goto("/signin");

    const form = page.locator(".auth-form");
    await form.getByLabel("Email", { exact: true }).fill(email);
    await form.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL(new RegExp(`/w/${slug}$`), {
      timeout: 45_000,
    });
    await expect(
      page.getByRole("heading", { level: 1, name: siteName }),
    ).toBeVisible({ timeout: 30_000 });

    // R48.1 — the header stays public even for the owner.
    await expectPublicHeader(page);
    // R48.7 — but the owner keeps one visible way into its own admin.
    await expectSiteAdminBar(page, slug);

    // The archive is public too, and the owner bar follows the site.
    await page.goto(`/w/${slug}/blog`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 30_000,
    });
    await expectPublicHeader(page);
    await expectSiteAdminBar(page, slug);

    // Another tenant's public site is still a public site. `pine-and-pixel` is
    // a seeded demo tenant the throwaway account does not own: no owner bar,
    // even though this account owns a different site.
    await page.goto("/w/pine-and-pixel");
    await expect(
      page.getByRole("heading", { level: 1, name: "Pine & Pixel" }),
    ).toBeVisible({ timeout: 30_000 });
    await expectPublicHeader(page);
    await expectNoAdminControls(page);

    // The owner bar opens the admin rather than only advertising it.
    await page.goto(`/w/${slug}`);
    await expectSiteAdminBar(page, slug);
    await page
      .getByRole("complementary", { name: "Site administration" })
      .getByRole("link", { name: "Site admin" })
      .click();
    await expect(page).toHaveURL(new RegExp(`/w/${slug}/admin$`), {
      timeout: 30_000,
    });
    await expect(page.getByText("Workspace admin")).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByRole("link", { name: "All posts" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Add new blog" }),
    ).toBeVisible();
  });
});

test.describe("R48 — the public header and the site gate stay site-scoped", () => {
  test("TC-4803: no global shortcut in the menu, the gate, the rules or the function", () => {
    const header = read("src/components/Header.tsx");
    const menu = read("src/components/AccountMenu.tsx");
    const admin = read("src/pages/WorkspaceAdmin.tsx");
    const layout = read("src/pages/WorkspaceLayout.tsx");
    const bar = read("src/components/SiteAdminBar.tsx");
    const roleHook = read("src/hooks/useWorkspaceRole.ts");
    const rules = read("firestore.rules");
    const functions = read("functions/index.js");
    const seam = read("src/lib/blogs.ts");

    // The header knows it is inside a tenant and passes that to the menu.
    expect(header).toContain('publicSite={sitePrefix !== ""}');

    // The menu suppresses both destinations, and does not even read the role or
    // the owned-site list on a public page.
    expect(menu).toContain("publicSite?: boolean");
    expect(menu).toContain("useUserRole(publicSite ? null : user)");
    expect(menu).toContain("useMyWorkspaces(publicSite ? null : user.uid)");
    expect(menu).toContain("!publicSite && isAdminRole(role)");
    expect(menu).toContain("{!publicSite && (");

    // R48.7 — the one admin affordance a public page may carry is the owner
    // bar, and it reads the workspace role, not the global role.
    expect(layout).toContain("<SiteAdminBar key={workspace.id} />");
    expect(bar).toContain("useWorkspaceRole(");
    expect(bar).toContain("canEditWorkspace(role)");
    expect(bar).toContain("${site.basePath}/admin");
    expect(bar).toContain("${site.basePath}/admin/new");
    expect(bar).toContain("Site admin");
    expect(bar).toContain("Add new blog");
    expect(bar).not.toContain("isAdminRole");
    expect(bar).not.toContain("fetchUserRole");
    expect(roleHook).toContain("fetchWorkspaceRole(");

    // The gate settles the site's own role and nothing else.
    expect(admin).toContain("fetchWorkspaceRole(");
    expect(admin).not.toContain("fetchUserRole");
    expect(admin).not.toContain("isAdminRole");
    expect(admin).not.toContain("Platform admin");

    // No workspace rule consults the global role; the legacy flat collection
    // keeps its R37 admin write because it is not tenant data.
    const workspace = blockBody(rules, "match /workspaces/{workspaceId}");
    expect(workspace, "the workspaces block must exist").not.toBe("");
    expect(workspace).not.toContain("isAdmin()");
    expect(workspace).toContain("allow write: if canEditWorkspace(workspaceId);");
    expect(rules).toContain("allow write: if isAdmin();");

    // The function checks the workspace role; the platform fallback is gone,
    // and the legacy `blog-images/` path keeps its R35 check.
    expect(functions).not.toContain("const platformAdmin");
    expect(functions).not.toContain(
      "if (coverPath && (await isGlobalAdmin(uid)))",
    );
    expect(functions).toContain("if (!CAN_EDIT.has(role))");
    expect(functions).toContain("workspaceRole(uid, workspacePath[1])");
    expect(functions).toContain("isGlobalAdmin(uid)");

    // The visitor-facing message no longer promises a platform admin.
    expect(seam).not.toContain("or the platform admin can upload");
  });
});
