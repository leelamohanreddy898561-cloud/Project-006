import { test, expect } from "@playwright/test";

/**
 * R16 — Firebase integration (lazy). Maps to TC-1606 and TC-1607 in
 * test-cases.md.
 *
 * TC-1606 proves no Firebase code loads on the home page (R14.1 budget).
 * TC-1607 proves the loader initializes against the real project, using the
 * dev-only `window.__getFirebase` hook.
 */

declare global {
  interface Window {
    __getFirebase?: () => Promise<{
      app: { options: { projectId?: string } };
      auth: unknown;
      db: unknown;
      storage: unknown;
      analytics: unknown;
    }>;
  }
}

function firebaseRequestPaths(urls: string[]): string[] {
  return urls
    .map((url) => {
      try {
        return new URL(url).pathname;
      } catch {
        return url;
      }
    })
    // Ignore our own source module; only the SDK assets matter.
    .filter((path) => /firebase/i.test(path) && !path.startsWith("/src/"));
}

test.describe("R16 — Firebase integration (lazy)", () => {
  test("TC-1606: home page renders and loads no Firebase code", async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    const requested: string[] = [];

    page.on("pageerror", (error) => pageErrors.push(error.message));
    page.on("request", (request) => requested.push(request.url()));

    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("header.site-header")).toBeVisible();

    expect(pageErrors).toEqual([]);
    expect(
      firebaseRequestPaths(requested),
      "Firebase must not load on the home page",
    ).toEqual([]);
  });

  test("TC-1607: getFirebase() initializes on demand with real credentials", async ({
    page,
  }) => {
    // The verification hook is dev-only by design and is stripped from
    // production builds, so this case only runs against the dev server.
    test.skip(
      Boolean(process.env.PLAYWRIGHT_BASE_URL),
      "dev-only hook is not present in production builds",
    );

    await page.goto("/");

    const hook = await page.evaluate(() => typeof window.__getFirebase);
    expect(hook, "dev hook window.__getFirebase must exist").toBe("function");

    const result = await page.evaluate(async () => {
      const firebase = await window.__getFirebase!();
      return {
        projectId: firebase.app.options.projectId,
        hasAuth: Boolean(firebase.auth),
        hasDb: Boolean(firebase.db),
        hasStorage: Boolean(firebase.storage),
      };
    });

    expect(result.projectId).toBe("project-006-e6ae1");
    expect(result.hasAuth).toBe(true);
    expect(result.hasDb).toBe(true);
    expect(result.hasStorage).toBe(true);
  });
});
