import { test, expect } from "@playwright/test";

/**
 * R16 — Firebase integration (lazy). Maps to TC-1606 and TC-1607 in
 * test-cases.md.
 *
 * TC-1606 proves the home page renders without Firebase (R29 superseded the
 * stricter "never loads" wording, because the header now shows the session).
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

test.describe("R16 — Firebase integration (lazy)", () => {
  test("TC-1606: the home page renders without waiting for Firebase", async ({
    page,
  }) => {
    const pageErrors: string[] = [];

    page.on("pageerror", (error) => pageErrors.push(error.message));

    // R29 moved the session into the header, so the SDK now loads after the
    // page is usable rather than never. The guarantee worth keeping is that the
    // page does not depend on it: with the SDK unreachable, the home page must
    // still render completely and behave as signed out.
    //
    // Only the SDK is blocked, never `src/lib/firebase.ts`. In a production
    // build the chunks are hashed, so the bundle split is proven separately by
    // the build check (TC-1608) that greps the entry chunk.
    await page.route(/node_modules\/\.vite\/deps\/firebase/, (route) =>
      route.abort(),
    );

    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator("header.site-header")).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();

    expect(pageErrors, "the page must not throw when Firebase is unavailable").toEqual([]);
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
