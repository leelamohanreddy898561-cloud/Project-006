import type { Page } from "@playwright/test";

/**
 * R37 — keep the browser suite hermetic.
 *
 * The app reads saved posts from the live Firestore project. A test that
 * asserted "six cards" (R2, R19) would change its answer the day a post is
 * saved, and the suite would fail for a reason that is not a regression. Every
 * spec that renders the home page, the archive or an article therefore blocks
 * the Firestore host: the reader reports its error state, the repository
 * articles render, and the assertions stay about the code.
 *
 * R37's own browser case does not need the network: it injects a saved document
 * through the dev-only fixture in `src/lib/blogs.ts`.
 */
export async function blockFirestore(page: Page): Promise<void> {
  await page.route("**://firestore.googleapis.com/**", (route) =>
    route.abort("failed"),
  );
}
