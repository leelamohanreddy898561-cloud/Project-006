/**
 * R27 — verify the deployed site with the smoke subset.
 *
 *   $env:PLAYWRIGHT_BASE_URL="https://project-006-e6ae1.web.app"
 *   npm run verify:prod
 *
 * Why this exists: the full suite is 88 tests. Against the live host every test
 * re-downloads the bundle, so a slow connection turns one release into several
 * minutes of re-proving what the local run already proved. This runs the small
 * `@smoke` subset instead — the tests that prove the deployed artifact serves
 * every route class and its main client-side flows.
 *
 * Two deliberate choices:
 *
 *   - No PLAYWRIGHT_BASE_URL means no run. Falling back to localhost would
 *     "pass" while proving nothing about production.
 *   - `--retries=0` is forced, even on CI. A retried pass is not a pass here;
 *     if the deployed site does not answer, the run must say so.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const baseURL = process.env.PLAYWRIGHT_BASE_URL;

if (!baseURL) {
  console.error(
    [
      "",
      "verify:prod — PLAYWRIGHT_BASE_URL is not set, so there is nothing to verify.",
      "",
      "This command only checks a deployed site. Set the target first:",
      "",
      '  PowerShell:  $env:PLAYWRIGHT_BASE_URL="https://project-006-e6ae1.web.app"',
      "  bash:        PLAYWRIGHT_BASE_URL=https://project-006-e6ae1.web.app npm run verify:prod",
      "",
      "For the full test suite locally, use `npm test`.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cli = path.join(root, "node_modules", "playwright", "cli.js");

console.log(`\nverify:prod — smoke subset against ${baseURL}\n`);

const started = Date.now();
const run = spawnSync(
  process.execPath,
  [
    cli,
    "test",
    "--grep",
    "@smoke",
    "--workers=2",
    "--timeout=120000",
    "--retries=0",
  ],
  { cwd: root, stdio: "inherit" },
);

const seconds = ((Date.now() - started) / 1000).toFixed(1);

if (run.status !== 0) {
  console.error(
    `\nverify:prod — FAILED after ${seconds}s (exit ${run.status ?? "unknown"}).`,
  );
  console.error(
    "A smoke failure means the deployed site does not serve what the full local\n" +
      "suite just proved. Do not publish on top of it.\n",
  );
  process.exit(run.status ?? 1);
}

console.log(`\nverify:prod — smoke subset passed in ${seconds}s.\n`);
