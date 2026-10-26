import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

/**
 * R32 — the admin dashboard. Maps to TC-3201 … TC-3204.
 *
 * TC-3201 proves the new route family is behind the R31 guard and is really
 * registered: a signed-out visitor is redirected from every dashboard route,
 * while an unknown /admin/... path is served the 404 page — so the redirects
 * are the guard at work, not a missing route.
 *
 * TC-3202 proves the wiring statically, in the style of TC-2415: the routes are
 * declared and guarded, and the sidebar declares exactly the three requested
 * sections, each pointing at a route that exists.
 *
 * The admin-session walkthrough is TC-3203 and stays manual, for the reason
 * TC-3103 does: it needs an account promoted in the Firebase console.
 */

const DASHBOARD_ROUTES = [
  "/admin/dashboard",
  "/admin/dashboard/blogs",
  "/admin/dashboard/blogs/new",
  "/admin/dashboard/users",
];

const SIDEBAR_SECTIONS = [
  { label: "All Blogs", to: "/admin/dashboard/blogs" },
  { label: "Add New Blog", to: "/admin/dashboard/blogs/new" },
  { label: "Manage Users", to: "/admin/dashboard/users" },
];

test.describe("R32 — the dashboard is behind the R31 guard", () => {
  test("TC-3201: a signed-out visitor is redirected from every dashboard route", async ({
    page,
  }) => {
    for (const route of DASHBOARD_ROUTES) {
      await page.goto(route);

      await expect(page, `${route} must not be reachable signed out`).toHaveURL(
        /\/signin$/,
      );
      await expect(
        page.getByRole("heading", { level: 1 }),
        `${route} must not render admin content`,
      ).not.toHaveText(/Admin|Dashboard|All blogs|Manage users/i);
      await expect(
        page.getByRole("navigation", { name: "Admin sections" }),
        `${route} must not render the sidebar`,
      ).toHaveCount(0);
    }

    // The contrast that makes the redirects meaningful: an /admin path that is
    // not a dashboard route is served the 404 page instead of being redirected.
    await page.goto("/admin/not-a-dashboard-route");

    await expect(page).toHaveURL(/\/admin\/not-a-dashboard-route$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Page not found",
    );
  });
});

test.describe("R32 — the dashboard is wired to the sidebar", () => {
  test("TC-3202: every route is registered and guarded, and the sidebar declares three sections", () => {
    const app = readFileSync(path.resolve("src/App.tsx"), "utf8");
    const shell = readFileSync(
      path.resolve("src/pages/AdminDashboard.tsx"),
      "utf8",
    );

    // Every dashboard route exists, and each one sits inside the guarded
    // /admin/dashboard element rather than beside it.
    const guarded = app.slice(
      app.indexOf('path="/admin/dashboard"'),
      app.indexOf('path="/privacy"'),
    );

    expect(guarded, "the dashboard route must be declared").toContain(
      'path="/admin/dashboard"',
    );
    expect(guarded, "the guard must wrap the dashboard shell").toContain(
      "<RequireAdmin>",
    );
    expect(guarded, "the shell must be the guarded element").toContain(
      "<AdminDashboard />",
    );

    for (const route of ["blogs", "blogs/new", "users"]) {
      expect(guarded, `${route} must be a dashboard child route`).toContain(
        `path="${route}"`,
      );
    }

    // An unknown section gets a panel, not a blank one.
    expect(guarded, "an unknown section needs a panel").toContain(
      "<AdminSectionMissing />",
    );

    // Exactly the three requested sections, each with a label and a link.
    for (const section of SIDEBAR_SECTIONS) {
      expect(shell, `the sidebar must offer ${section.label}`).toContain(
        `label: "${section.label}"`,
      );
      expect(shell, `${section.label} must link to its route`).toContain(
        `path: "${section.to}"`,
      );
    }

    const declared = [...shell.matchAll(/label: "([^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(
      declared,
      "the sidebar must carry exactly the three requested sections",
    ).toEqual(SIDEBAR_SECTIONS.map((section) => section.label));

    // Each destination is a route the app really serves.
    for (const section of SIDEBAR_SECTIONS) {
      expect(app, `${section.to} must be a registered route`).toContain(
        `path="${section.to.replace("/admin/dashboard/", "")}"`,
      );
    }

    // The current section is marked accessibly, not only visually.
    expect(shell, "the current section needs aria-current").toContain(
      'aria-current={current ? "page" : undefined}',
    );
  });
});
