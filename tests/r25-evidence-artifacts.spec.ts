import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import {
  isEvidenceRefresh,
  SCREENSHOT_DIR,
  screenshotPath,
} from "./helpers/screenshots";

/**
 * R25 — a test run must never change a committed file.
 *
 * These guards are static: they read the specs and the config, they do not drive
 * a browser. TC-2501, TC-2506, TC-2507 and TC-2508 are CLI checks recorded in
 * evidence.md because they assert on git state after a whole run.
 */

const TESTS_DIR = path.resolve("tests");

/** Assembled at runtime so this file does not trip its own guard. */
const EVIDENCE_DIR = ["evidence", "screenshots"].join("/");

function specFiles(): string[] {
  return readdirSync(TESTS_DIR)
    .filter((name) => name.endsWith(".spec.ts"))
    .map((name) => path.join(TESTS_DIR, name));
}

function normalise(value: string): string {
  return value.replace(/\\/g, "/");
}

test.describe("R25 — test runs must not mutate committed evidence", () => {
  test("TC-2502: captures resolve into the ignored output directory", () => {
    test.skip(
      isEvidenceRefresh,
      "Running under npm run evidence:screenshots, where evidence/ is the target.",
    );

    expect(normalise(SCREENSHOT_DIR)).toMatch(/\/test-results\/screenshots$/);
    expect(normalise(SCREENSHOT_DIR)).not.toContain("/evidence/");
    expect(normalise(screenshotPath("r1-hero.png"))).toMatch(
      /\/test-results\/screenshots\/r1-hero\.png$/,
    );
  });

  test("TC-2503: every capture goes through screenshotPath()", () => {
    const offenders: string[] = [];

    for (const file of specFiles()) {
      const source = readFileSync(file, "utf8");
      const calls = [
        ...source.matchAll(/page\.screenshot\(\s*\{([\s\S]{0,240}?)\}\s*\)/g),
      ].map((match) => match[1]);

      for (const body of calls) {
        if (!body.includes("screenshotPath(")) {
          offenders.push(`${path.basename(file)}: ${body.trim()}`);
        }
      }
    }

    expect(
      offenders,
      "Captures must use screenshotPath() from tests/helpers/screenshots.ts",
    ).toEqual([]);
  });

  test("TC-2504: no spec names a tracked evidence path", () => {
    for (const file of specFiles()) {
      const source = readFileSync(file, "utf8");

      expect(
        source,
        `${path.basename(file)} must not write into the tracked evidence folder`,
      ).not.toContain(EVIDENCE_DIR);

      // A quoted `evidence/...` path is just as bad as the full one.
      expect(source).not.toMatch(/["']evidence\//);
    }
  });

  test("TC-2505: gitignore keeps evidence tracked and output ignored", () => {
    const ignore = readFileSync(path.resolve(".gitignore"), "utf8");

    const rules = ignore
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("#"));

    const evidenceRules = rules.filter((rule) =>
      /^!?\/?evidence/.test(rule.replace(/^\//, "")),
    );

    expect(
      evidenceRules,
      "The evidence folder must stay committed — it holds the proof images",
    ).toEqual([]);

    expect(ignore, "test-results/ must stay ignored").toMatch(
      /^test-results\/$/m,
    );
  });
});
