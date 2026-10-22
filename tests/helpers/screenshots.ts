import path from "node:path";

/**
 * R25 — the one place that decides where screenshot captures land.
 *
 * Default target is the git-ignored Playwright output directory, so running the
 * suite can never change a committed file. Before R25, three specs wrote
 * straight into `evidence/screenshots/`, which silently dirtied the working
 * tree on every run.
 *
 * `npm run evidence:screenshots` sets EVIDENCE_SCREENSHOTS=1, which points the
 * very same captures at `evidence/screenshots/` — the committed proof images
 * that `evidence.md` links to. Refreshing them is therefore always deliberate,
 * and never a side effect of testing.
 */

export const isEvidenceRefresh = process.env.EVIDENCE_SCREENSHOTS === "1";

export const SCREENSHOT_DIR = isEvidenceRefresh
  ? path.resolve("evidence", "screenshots")
  : path.resolve("test-results", "screenshots");

/** Absolute path for a capture. Paths must always come from here (R25.4). */
export function screenshotPath(fileName: string): string {
  return path.join(SCREENSHOT_DIR, fileName);
}
