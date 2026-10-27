import { expect, test } from "@playwright/test";

/**
 * R43 — a workspace is a public site at /w/<slug>.
 *
 * The suite proves it with dev-only fixtures (the same pattern as R37's
 * `__savedBlogsFixture`): two workspaces with one post each, a third with no
 * posts, and the default workspace. `import.meta.env.DEV` is false in a
 * production build, so the fixtures cannot ship.
 */

const WORKSPACES = [
  {
    id: "ws-alpha",
    name: "Alpha Co",
    slug: "alpha",
    ownerUid: "owner-alpha",
    branding: { title: "Alpha Co", tagline: "Notes from Alpha's team." },
  },
  {
    id: "ws-beta",
    name: "Beta Ltd",
    slug: "beta",
    ownerUid: "owner-beta",
    branding: { title: "Beta Ltd", tagline: "" },
  },
  {
    id: "ws-gamma",
    name: "Gamma Works",
    slug: "gamma",
    ownerUid: "owner-gamma",
    branding: { title: "Gamma Works", tagline: "Coming soon." },
  },
  {
    id: "signal-and-noise",
    name: "Signal & Noise",
    slug: "signal-and-noise",
    ownerUid: "owner-default",
    branding: { title: "Signal & Noise", tagline: "" },
  },
];

function record(id: string, title: string, slug: string) {
  return {
    id,
    title,
    slug,
    category: "News",
    excerpt: `${title} excerpt`,
    content: `## ${title}\n\nBody of ${title}.`,
    tags: ["news"],
    createdAt: "2026-10-20",
  };
}

const FIXTURES = {
  "ws-alpha": [record("a1", "Alpha's only post", "alpha-only")],
  "ws-beta": [record("b1", "Beta's only post", "beta-only")],
  "ws-gamma": [],
  "signal-and-noise": [],
};

async function seed(page: import("@playwright/test").Page) {
  await page.addInitScript(
    (payload) => {
      const target = window as unknown as {
        __workspaceDocs?: unknown;
        __workspaceFixtures?: unknown;
      };

      target.__workspaceDocs = payload.workspaces;
      target.__workspaceFixtures = payload.fixtures;
    },
    { workspaces: WORKSPACES, fixtures: FIXTURES },
  );
}

test.describe("R43 — workspace-scoped public site", () => {
  test("TC-4301: a tenant site renders its own name and only its own posts", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/w/alpha");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Alpha Co");
    await expect(page.locator(".blog-card__title")).toHaveText([
      "Alpha's only post",
    ]);
    await expect(
      page.locator(".site-hero__meta [role='status']"),
    ).toHaveText("1 post");

    // Nothing from the other tenant, and none of the default site's articles.
    await expect(page.getByText("Beta's only post")).toHaveCount(0);
    await expect(
      page.getByText("Mixture-of-Experts: Why the Biggest Models"),
    ).toHaveCount(0);

    await page.goto("/w/beta/blog");
    await expect(page.locator(".blog-card__title")).toHaveText([
      "Beta's only post",
    ]);
    await expect(page.getByText("Alpha's only post")).toHaveCount(0);
  });

  test("TC-4302: every link inside a tenant site stays on that site", async ({
    page,
  }) => {
    await seed(page);
    await page.goto("/w/alpha");

    // Header: brand, Home and Blogs all point at the tenant.
    await expect(page.locator("a.site-header__brand")).toHaveAttribute(
      "href",
      "/w/alpha",
    );

    const nav = page.locator("nav[aria-label='Main navigation'] a");
    await expect(nav).toHaveText(["Home", "Blogs"]);
    await expect(nav.nth(1)).toHaveAttribute("href", "/w/alpha/blog");

    // The card's cover, title, category and tag stay inside the workspace.
    const card = page.locator(".blog-card").first();
    await expect(card.locator(".blog-card__title a")).toHaveAttribute(
      "href",
      "/w/alpha/blog/alpha-only",
    );
    await expect(card.locator(".badge")).toHaveAttribute(
      "href",
      "/w/alpha/blog?topic=news",
    );

    // Opening it renders the article on the tenant, with a tenant breadcrumb.
    await card.locator(".blog-card__title a").click();
    await expect(page).toHaveURL(/\/w\/alpha\/blog\/alpha-only$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Alpha's only post",
    );

    const crumbs = page.locator(".post-page__crumbs a");
    await expect(crumbs).toHaveText(["Home", "Blogs"]);
    await expect(crumbs.nth(0)).toHaveAttribute("href", "/w/alpha");
    await expect(crumbs.nth(1)).toHaveAttribute("href", "/w/alpha/blog");
  });

  test("TC-4303: an unknown site, an empty site and the default site each say the truth", async ({
    page,
  }) => {
    await seed(page);

    await page.goto("/w/does-not-exist");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Site not found",
    );
    await expect(page.locator(".blog-card")).toHaveCount(0);

    await page.goto("/w/gamma");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Gamma Works",
    );
    await expect(page.getByText("No posts yet")).toBeVisible();
    await expect(page.locator(".blog-card")).toHaveCount(0);

    // The default workspace keeps the repository archive, so /w/signal-and-noise
    // and / show the same catalogue.
    await page.goto("/w/signal-and-noise");
    await expect(page.locator(".blog-card")).toHaveCount(6);
  });
});
