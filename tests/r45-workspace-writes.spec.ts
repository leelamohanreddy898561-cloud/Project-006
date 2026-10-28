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
 * R45 — workspace-scoped writes and the demo tenants.
 *
 * The signed-out case runs for real. The write case creates a throwaway account
 * through the same public Auth endpoint the sign-up page uses, gives it a
 * workspace through the deployed Firestore rules, then writes a post from
 * `/w/<slug>/admin/new` in a browser and reads it back on the public tenant
 * site. That is the only proof that a tenant write lands in the tenant.
 *
 * The account, its workspace and its post are deleted afterwards. The static
 * case reads the seam, the pages, the rules, the function and the seed script,
 * so a future edit that reintroduces a hidden default fails the normal run.
 */

const project = readProject();
const PASSWORD = "Pulse-Tenant-2026!";

const read = (relative: string) =>
  readFileSync(path.resolve(relative), "utf8");

test.describe("R45 — the tenant admin is behind a session", () => {
  test("TC-4502a: a signed-out visitor cannot reach the site admin or its composer", async ({
    page,
  }) => {
    await page.goto("/w/alpha-labs/admin");
    await expect(page).toHaveURL(/\/signin$/);
    await expect(page.getByText("Workspace admin")).toHaveCount(0);

    await page.goto("/w/alpha-labs/admin/new");
    await expect(page).toHaveURL(/\/signin$/);
    await expect(
      page.getByRole("heading", { name: "Add new blog" }),
    ).toHaveCount(0);
  });
});

test.describe("R45 — a site owner writes only to its own workspace", () => {
  test.skip(!project, "Firebase is not configured in .env");

  test.describe.configure({ mode: "serial" });

  const email = uniqueEmail().replace("r29-test", "r45-test");
  const slug = `r45-suite-${Date.now().toString(36)}`;
  const siteName = "R45 Test Site";

  let session: TestSession | null = null;
  let created = false;

  test.afterAll(async () => {
    if (!project || !session) return;

    // Posts first: deleting the workspace would leave them unreachable (their
    // rule resolves the workspace document).
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

  test("TC-4502b: the owner writes a post into its workspace and the tenant site shows it", async ({
    page,
  }) => {
    test.setTimeout(150_000);

    session = await signUpTestAccount(project!, email, PASSWORD);
    expect(session, "the throwaway tenant account").not.toBeNull();
    created = true;

    // The account creates the workspace it owns, exactly as onboarding will.
    const workspaceWritten = await writeTestDocument(
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

    expect(
      workspaceWritten,
      "an account may create a workspace it owns",
    ).toBe(true);

    // Sign in through the real page, not a REST shortcut.
    await page.goto("/signin");

    const form = page.locator(".auth-form");
    await form.getByLabel("Email", { exact: true }).fill(email);
    await form.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page).toHaveURL(/\/$/, { timeout: 30_000 });

    // The site's admin opens because this account owns the workspace.
    await page.goto(`/w/${slug}/admin`);

    await expect(
      page.getByRole("heading", { level: 1, name: siteName }),
      "the gate resolves this workspace",
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Owner", { exact: true })).toBeVisible();

    await page.getByRole("link", { name: "Write a post" }).click();
    await expect(page).toHaveURL(new RegExp(`/w/${slug}/admin/new$`));

    await page.getByLabel("Blog title").fill("A tenant post");
    await page
      .getByLabel("Content")
      .fill("Written from the tenant admin, into this workspace only.");
    await page.getByRole("button", { name: "Save post" }).click();

    await expect(
      page.getByText(/Saved to blogs as/),
      "the composer confirms the document it wrote",
    ).toBeVisible({ timeout: 30_000 });

    // The public tenant site reads that workspace and shows the new post.
    await page.goto(`/w/${slug}`);

    await expect(
      page.getByRole("heading", { level: 1, name: siteName }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(
      page.getByRole("heading", { level: 3, name: "A tenant post" }),
      "the tenant home reads the post it just wrote",
    ).toBeVisible({ timeout: 30_000 });

    // The default site never shows it: the write named this workspace.
    await page.goto("/blog");
    await expect(
      page.getByRole("heading", { level: 3, name: "A tenant post" }),
    ).toHaveCount(0);

    // Cross-tenant denial in the UI: this account does not own the default
    // workspace, and it is not the platform admin.
    await page.goto("/w/signal-and-noise/admin");
    await expect(
      page.getByRole("heading", { name: "You do not have access" }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("link", { name: "Write a post" })).toHaveCount(
      0,
    );
  });
});

test.describe("R45 — every write names its workspace", () => {
  test("TC-4503: the seam, the pages, the rules and the function agree", () => {
    const seam = read("src/lib/blogs.ts");
    const composer = read("src/pages/AddBlog.tsx");
    const panel = read("src/components/admin/ManageBlogs.tsx");
    const admin = read("src/pages/WorkspaceAdmin.tsx");
    const app = read("src/App.tsx");
    const rules = read("firestore.rules");
    const functions = read("functions/index.js");
    const seed = read("scripts/seed-demo-tenants.mjs");
    const gitignore = read(".gitignore");

    // No write can fall back to the default site: each one takes an id.
    for (const fn of [
      "listSavedBlogs",
      "uploadBlogImage",
      "createBlogPost",
      "saveBlogPost",
      "updateBlogPost",
      "deleteBlogPost",
    ]) {
      expect(seam, `${fn} must take a workspaceId`).toMatch(
        new RegExp(
          `export async function ${fn}\\([\\s\\S]{0,120}workspaceId: string`,
        ),
      );
    }

    expect(seam).toContain("removeBlogImage(path: string, workspaceId: string)");
    expect(seam).not.toContain("workspaceBlogsPath(SITE_WORKSPACE_ID)");
    expect(seam).toContain("workspaceBlogsPath(workspaceId)");

    // The tenant composer passes the workspace the gate resolved.
    expect(composer).toContain("export interface AddBlogProps");
    expect(composer).toContain("workspaceId?: string");
    expect(composer).toMatch(/saveBlogPost\(\s*workspaceId,/);
    expect(admin).toContain("workspaceId={workspace.id}");
    expect(admin).toContain("<AddBlog");
    expect(admin).toContain("<ManageBlogs");

    // The panel passes the same id to its two writes.
    expect(panel).toMatch(/updateBlogPost\(\s*workspaceId,/);
    expect(panel).toContain("deleteBlogPost(workspaceId, record)");
    expect(panel).toContain("includeRepository = true");

    // The route family shares one gate.
    expect(app).toContain('path="/w/:siteSlug/admin"');
    expect(app).toContain("<WorkspaceAdminGate />");
    expect(app).toContain('<Route path="new" element={<WorkspaceAdminComposer />} />');

    // Rules: the platform admin may write any tenant, but not rewrite ownership
    // or smuggle a billing field into the public document.
    expect(rules).toContain(
      "allow write: if canEditWorkspace(workspaceId) || isAdmin();",
    );
    expect(rules).toContain(
      "allow update: if (isWorkspaceOwner(workspaceId) || isAdmin())",
    );
    expect(rules).toContain(
      "request.resource.data.ownerUid == resource.data.ownerUid",
    );
    expect(rules).toContain("hasNoBillingFields()");

    // The image function applies the same override.
    expect(functions).toContain(
      "const platformAdmin = CAN_EDIT.has(role) ? false : await isGlobalAdmin(uid);",
    );
    expect(functions).toContain("if (coverPath && (await isGlobalAdmin(uid)))");
    expect(functions).toContain("workspaceRole(uid, workspacePath[1])");

    // The demo seed is idempotent and keeps its passwords out of git.
    expect(seed).toContain("EMAIL_EXISTS");
    expect(seed).toContain("const CREDENTIALS_FILE = \".demo-tenants.json\";");
    expect(seed).toContain("writeFileSync(");
    expect(seed).not.toMatch(/password\s*=\s*["'][^"']+["']/i);
    expect(gitignore).toContain(".demo-tenants.json");
  });
});
