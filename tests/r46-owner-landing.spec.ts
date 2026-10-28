import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { landingPath, DASHBOARD_PATH, PLATFORM_HOME } from "../src/lib/landing";
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
 * R46 — a single-site owner lands on their own site.
 *
 * The decision is a pure function (`landingPath`), so its four cases are
 * checked here without a browser (TC-4603). The two live cases sign in a real
 * throwaway account through `/signin`: one workspace must open that site, two
 * must open the launcher (TC-4601, TC-4602). The account and its workspaces are
 * deleted afterwards.
 */

const project = readProject();
const PASSWORD = "Pulse-Landing-2026!";

const read = (relative: string) =>
  readFileSync(path.resolve(relative), "utf8");

test.describe("R46 — the landing decision", () => {
  test("TC-4603: one site is the site, several are the launcher", () => {
    expect(landingPath({ ownedSites: [{ slug: "orbit-analytics" }], isPlatformAdmin: false })).toBe(
      "/w/orbit-analytics",
    );
    expect(
      landingPath({
        ownedSites: [{ slug: "orbit-analytics" }, { slug: "pine-and-pixel" }],
        isPlatformAdmin: false,
      }),
    ).toBe(DASHBOARD_PATH);
    expect(
      landingPath({ ownedSites: [], isPlatformAdmin: false }),
      "a reader who owns nothing keeps the platform home",
    ).toBe(PLATFORM_HOME);
    expect(
      landingPath({
        ownedSites: [{ slug: "orbit-analytics" }],
        isPlatformAdmin: true,
      }),
      "the platform operator keeps the platform home, even with one site",
    ).toBe(PLATFORM_HOME);
    expect(
      landingPath({ ownedSites: [{ slug: "  " }], isPlatformAdmin: false }),
      "a site without a slug cannot be opened",
    ).toBe(PLATFORM_HOME);

    // The wiring: both sign-in paths route through the resolver, no success
    // path guesses a site, and the header links the single site.
    const authPage = read("src/pages/AuthPage.tsx");
    const menu = read("src/components/AccountMenu.tsx");
    const resolver = read("src/lib/sign-in-landing.ts");
    const landing = read("src/lib/landing.ts");

    expect(authPage).toContain(
      'import { resolveSignInLanding } from "../lib/sign-in-landing";',
    );
    expect(
      (authPage.match(/resolveSignInLanding\(outcome\.user\)/g) ?? []).length,
      "email and Google both resolve their landing",
    ).toBe(2);
    expect(authPage).toContain("setLanding(true)");

    expect(resolver).toContain("if (!owned.ok) return PLATFORM_HOME;");
    expect(resolver).toContain("} catch {\n    return PLATFORM_HOME;");
    expect(landing).toContain("if (isPlatformAdmin) return PLATFORM_HOME;");
    expect(landing).toContain("ownedSites.length === 1");
    expect(landing).toContain("if (ownedSites.length > 1) return DASHBOARD_PATH;");

    expect(menu).toContain("siteAdminPath(onlySite.slug)");
    expect(menu).toContain('"My site"');
    expect(menu).toContain('"My sites"');
    expect(menu).toContain('!showAdminLink && mine.status === "ready"');
    // R48 — those links exist on platform routes only.
    expect(menu).toContain("publicSite?: boolean");
    expect(menu).toContain("!publicSite && isAdminRole(role)");
    expect(menu).toContain("{!publicSite && (");
  });
});

test.describe("R46 — a real owner signs in", () => {
  test.skip(!project, "Firebase is not configured in .env");

  test.describe.configure({ mode: "serial" });

  const email = uniqueEmail().replace("r29-test", "r46-test");
  const firstSlug = `r46-one-${Date.now().toString(36)}`;
  const secondSlug = `r46-two-${Date.now().toString(36)}`;
  const siteName = "R46 One Site";

  let session: TestSession | null = null;
  let created = false;

  const writeWorkspace = (slug: string, name: string) =>
    writeTestDocument(project!, session!.idToken, `workspaces/${slug}`, {
      name: { stringValue: name },
      slug: { stringValue: slug },
      ownerUid: { stringValue: session!.localId },
      branding: {
        mapValue: {
          fields: {
            title: { stringValue: name },
            tagline: { stringValue: "Written by the suite." },
          },
        },
      },
      createdAt: { timestampValue: new Date().toISOString() },
    });

  test.afterAll(async () => {
    if (!project || !session) return;

    for (const slug of [firstSlug, secondSlug]) {
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
    }

    if (created) {
      await deleteTestProfile(project, email, PASSWORD);
      await deleteTestAccount(project, email, PASSWORD);
    }
  });

  test("TC-4601: one owned site opens on sign-in, and the header links its admin", async ({
    page,
  }) => {
    test.setTimeout(150_000);

    session = await signUpTestAccount(project!, email, PASSWORD);
    expect(session, "the throwaway owner").not.toBeNull();
    created = true;

    expect(await writeWorkspace(firstSlug, siteName)).toBe(true);

    await page.goto("/signin");

    const form = page.locator(".auth-form");
    await form.getByLabel("Email", { exact: true }).fill(email);
    await form.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(
      page,
      "the owner opens on its own site, not the platform home",
    ).toHaveURL(new RegExp(`/w/${firstSlug}$`), { timeout: 45_000 });

    await expect(
      page.getByRole("heading", { level: 1, name: siteName }),
    ).toBeVisible({ timeout: 30_000 });

    // R48 — the header stays public even to its owner, but R48.7 gives the
    // owner one visible way into its own admin from the public site.
    const header = page.locator("header.site-header");
    await expect(
      header.getByRole("link", { name: "Admin", exact: true }),
    ).toHaveCount(0);
    await expect(
      header.getByRole("link", { name: "My site", exact: true }),
    ).toHaveCount(0);
    await expect(
      header.getByRole("link", { name: "My sites", exact: true }),
    ).toHaveCount(0);

    const bar = page.getByRole("complementary", {
      name: "Site administration",
    });
    await expect(bar).toBeVisible({ timeout: 30_000 });
    await expect(bar.getByRole("link", { name: "Site admin" })).toHaveAttribute(
      "href",
      `/w/${firstSlug}/admin`,
    );
    await expect(
      bar.getByRole("link", { name: "Add new blog" }),
    ).toHaveAttribute("href", `/w/${firstSlug}/admin/new`);

    // The deliberate admin address still works for the owner.
    await page.goto(`/w/${firstSlug}/admin`);
    await expect(page).toHaveURL(new RegExp(`/w/${firstSlug}/admin$`));
    await expect(
      page.getByRole("heading", { level: 1, name: siteName }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Workspace admin")).toBeVisible();
  });

  test("TC-4602: a second site returns the account to the launcher", async ({
    page,
  }) => {
    test.setTimeout(150_000);

    expect(session, "TC-4601 ran first").not.toBeNull();
    expect(await writeWorkspace(secondSlug, "R46 Two Sites")).toBe(true);

    // A fresh context: sign in again with the account that now owns two sites.
    await page.goto("/signin");

    const form = page.locator(".auth-form");
    await form.getByLabel("Email", { exact: true }).fill(email);
    await form.getByLabel("Password", { exact: true }).fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(
      page,
      "two sites need the launcher",
    ).toHaveURL(/\/dashboard$/, { timeout: 45_000 });

    await expect(page.getByRole("heading", { name: "My sites" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("link", { name: "My sites" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    await expect(page.locator(".site-card")).toHaveCount(2, {
      timeout: 30_000,
    });
  });
});
