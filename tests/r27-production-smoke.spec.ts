import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { REQUIRED_COVERAGE, SMOKE_SUITE, SMOKE_TAG } from "./helpers/smoke";

/**
 * R27 — the production smoke subset must not drift.
 *
 * These guards are static: they read the specs and the launcher, they do not
 * drive a browser. TC-2705 to TC-2708 are CLI checks recorded in evidence.md
 * because they assert on an actual run.
 */

const TESTS_DIR = path.resolve("tests");

interface DeclaredTest {
  tc: string;
  file: string;
  title: string;
}

function specFiles(): string[] {
  return readdirSync(TESTS_DIR)
    .filter((name) => name.endsWith(".spec.ts"))
    .map((name) => path.join(TESTS_DIR, name));
}

function declaredTests(): DeclaredTest[] {
  const found: DeclaredTest[] = [];

  for (const file of specFiles()) {
    const source = readFileSync(file, "utf8");

    for (const match of source.matchAll(/^\s*test\(\s*"([^"]+)"/gm)) {
      const title = match[1];
      const tc = title.match(/TC-\d+/)?.[0];
      if (tc) found.push({ tc, file: path.basename(file), title });
    }
  }

  return found;
}

function taggedTests(): DeclaredTest[] {
  return declaredTests().filter((entry) =>
    entry.title.includes(SMOKE_TAG),
  );
}

test.describe("R27 — production smoke subset", () => {
  test("TC-2701: tagged tests and the declared manifest agree", () => {
    const tagged = taggedTests();

    expect(
      tagged.map((entry) => entry.tc).sort(),
      "A test tagged @smoke but missing from SMOKE_SUITE, or the reverse",
    ).toEqual(SMOKE_SUITE.map((entry) => entry.tc).sort());

    for (const entry of SMOKE_SUITE) {
      const hit = tagged.find((candidate) => candidate.tc === entry.tc);

      expect(hit, `${entry.tc} must carry ${SMOKE_TAG}`).toBeDefined();
      expect(
        hit?.file,
        `${entry.tc} is declared in ${entry.spec} but tagged elsewhere`,
      ).toBe(entry.spec);
    }
  });

  test("TC-2702: every required route class is covered", () => {
    const covered = new Set(SMOKE_SUITE.flatMap((entry) => entry.covers));
    const missing = REQUIRED_COVERAGE.filter((area) => !covered.has(area));

    expect(
      missing,
      "Route classes the smoke subset would leave unproven in production",
    ).toEqual([]);
  });

  test("TC-2703: the subset is small but real", () => {
    const tagged = taggedTests();
    const all = declaredTests();

    expect(tagged.length).toBeGreaterThanOrEqual(6);
    expect(tagged.length).toBeLessThanOrEqual(12);
    expect(tagged.length).toBeLessThan(all.length);

    // No test may be declared twice on one TC id.
    expect(new Set(tagged.map((entry) => entry.tc)).size).toBe(tagged.length);
  });

  test("TC-2704: verify:prod selects the subset and forbids retries", () => {
    const scripts = JSON.parse(
      readFileSync(path.resolve("package.json"), "utf8"),
    ).scripts as Record<string, string>;

    expect(scripts["verify:prod"]).toBe("node scripts/verify-prod.mjs");

    const launcher = readFileSync(
      path.resolve("scripts/verify-prod.mjs"),
      "utf8",
    );

    expect(launcher, "must select the tagged subset").toContain('"@smoke"');
    expect(launcher, "must pass --grep").toContain('"--grep"');
    expect(launcher, "must never retry a failed smoke test").toContain(
      '"--retries=0"',
    );
    expect(
      launcher,
      "must refuse to run without a deployed target",
    ).toContain("PLAYWRIGHT_BASE_URL");
  });
});
