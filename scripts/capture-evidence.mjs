#!/usr/bin/env node
/**
 * R25.3 — deliberately refresh the committed evidence screenshots.
 *
 * Runs the Playwright suite with EVIDENCE_SCREENSHOTS=1, which repoints the
 * captures from `test-results/screenshots/` to `evidence/screenshots/`.
 *
 * This is the ONLY way those committed images change. A normal `npm test` never
 * touches them, so the working tree stays clean after every run.
 *
 *   npm run evidence:screenshots                    # whole suite
 *   npm run evidence:screenshots -- tests/r1-home.spec.ts
 *
 * Review the diff and commit it separately — the images are evidence, not build
 * output.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";

const cli = path.resolve("node_modules", "playwright", "cli.js");
const forwarded = process.argv.slice(2);

const result = spawnSync(process.execPath, [cli, "test", ...forwarded], {
  stdio: "inherit",
  env: { ...process.env, EVIDENCE_SCREENSHOTS: "1" },
});

process.exit(result.status ?? 1);
