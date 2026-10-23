import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { REQUIRED_COVERAGE, SMOKE_SUITE, SMOKE_TAG } from "./helpers/smoke";
import {
  isEvidenceRefresh,
  SCREENSHOT_DIR,
  screenshotPath,
} from "./helpers/screenshots";

/**
 * R30 — every document and workflow guard, in one place.
 *
 * R25, R26, R27 and R28 each shipped their own guard spec: sixteen tests that
 * read our own paperwork back. They are consolidated here as six tests, with
 * every distinct assertion preserved — the count dropped, the coverage did not.
 * TC-3007 and TC-3008 are CLI checks recorded in evidence.md because they
 * assert on a real run.
 *
 * The consolidation is what makes the lean loop (Section 2) affordable: one
 * file to run when a document changes, instead of four.
 */

const AGENTS = readFileSync(path.resolve("AGENTS.md"), "utf8");
const REQUIREMENTS = readFileSync(path.resolve("requirements.md"), "utf8");
const EVIDENCE = readFileSync(path.resolve("evidence.md"), "utf8");

const TESTS_DIR = path.resolve("tests");

/** Assembled at runtime so this file does not trip its own guard. */
const EVIDENCE_DIR = ["evidence", "screenshots"].join("/");

/** The four guard specs R30 retired, and the one that replaced them. */
const RETIRED_GUARDS = [
  "r25-evidence-artifacts.spec.ts",
  "r26-agents-state.spec.ts",
  "r27-production-smoke.spec.ts",
  "r28-branch-workflow.spec.ts",
];

const CONSOLIDATED_GUARD = "workflow-guards.spec.ts";

function specFiles(): string[] {
  return readdirSync(TESTS_DIR)
    .filter((name) => name.endsWith(".spec.ts"))
    .map((name) => path.join(TESTS_DIR, name));
}

function between(start: string, end: string): string {
  const from = AGENTS.indexOf(start);
  if (from === -1) return "";

  const to = AGENTS.indexOf(end, from + start.length);
  return to === -1 ? AGENTS.slice(from) : AGENTS.slice(from, to);
}

const workflow = between("## 2. The workflow", "## 3.");
const gate = between("## 3. The approval gate", "## 5.");
const fileMap = between("## 5. File map", "## 6.");

function section9(): string {
  const start = AGENTS.indexOf("## 9.");
  return start === -1 ? "" : AGENTS.slice(start);
}

interface DeclaredTest {
  tc: string;
  file: string;
  title: string;
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
  return declaredTests().filter((entry) => entry.title.includes(SMOKE_TAG));
}

test.describe("R30 — the lean loop is written down", () => {
  test("TC-3001: Section 2 states the lean loop", () => {
    // The two verification tiers.
    expect(workflow, "Section 2 must define the fast loop").toMatch(
      /5\.\s+\*\*Verify while working/,
    );
    expect(workflow, "Section 2 must define the gate").toMatch(
      /6\.\s+\*\*Verify before review/,
    );
    expect(workflow).toMatch(/npm run build/);
    expect(workflow).toMatch(/npm run lint/);

    // Exactly one full run before review — the heart of the lean loop.
    expect(workflow, "the gate must be one full run").toMatch(
      /\*\*one\*\*\s+full run/i,
    );
    expect(workflow).toContain("npx playwright test --reporter=dot");

    // A fix re-proves only what it touched, unless it touched shared code.
    expect(workflow, "a fix re-runs the affected spec only").toMatch(
      /re-run\s+only the affected spec/i,
    );
    expect(workflow, "shared code is the stated exception").toMatch(
      /shared code/i,
    );

    // The test-case cap and the cite-don't-duplicate rule.
    expect(workflow, "new test cases are capped").toMatch(
      /four new test cases per/i,
    );
    expect(workflow, "existing checks are cited, not rewritten").toMatch(
      /cite its TC instead of writing a duplicate/i,
    );

    // Short evidence, and the rule that outranks all of it.
    expect(workflow, "evidence entries stay short").toMatch(
      /Ten lines,\s+not\s+sixty/i,
    );
    expect(workflow, "nothing is claimed without running it").toMatch(
      /Never claim a test passed\s+without running it/i,
    );
  });
});

test.describe("R30 — AGENTS.md current state still tells the truth", () => {
  test("TC-3002: Section 9 agrees with requirements.md and evidence.md", () => {
    const section = section9();

    // Everything the section claims is published, excluding anything still
    // marked as awaiting approval.
    const publishedPart = section.split(/awaiting owner approval/i)[0];
    const publishedIds = new Set(
      [...publishedPart.matchAll(/\bR(\d+)\b/g)].map((match) => `R${match[1]}`),
    );
    expect(publishedIds.size).toBeGreaterThan(0);

    const claim = section.match(
      /\bR(\d+)\b is the most recent requirement published/i,
    );

    expect(claim, "Section 9 must say which requirement is the latest").not.toBeNull();
    const claimed = `R${claim?.[1]}`;

    expect(
      publishedIds.has(claimed),
      `Section 9 claims ${claimed} is the latest, but does not list it as published`,
    ).toBe(true);

    // Requirement numbers are not publication order — R2 shipped after R30 — so
    // the claim is checked against the newest publish entry in evidence.md,
    // not against the highest number in the list.
    const publishEntries = [...EVIDENCE.matchAll(/^### .*$/gm)]
      .map((match) => match[0])
      .filter((line) => /published/i.test(line));
    const newestPublish = publishEntries.at(-1) ?? "";

    expect(newestPublish, "evidence.md must record a publish entry").not.toBe("");
    expect(
      newestPublish,
      `The newest publish entry in evidence.md does not name ${claimed}`,
    ).toMatch(new RegExp(`\\b${claimed}\\b`));

    // Superseded requirements are kept and labelled, not deleted.
    expect(section).toContain("R15");
    expect(section).toMatch(/superseded by R18/i);

    // Every requirement is either published, awaiting approval, or inside the
    // declared not-yet-built range.
    const ids = [...REQUIREMENTS.matchAll(/^### (R\d+)\b/gm)].map(
      (match) => match[1],
    );

    const range = section.match(/R(\d+)–R(\d+)/);
    const from = range ? Number(range[1]) : Number.NaN;
    const to = range ? Number(range[2]) : Number.NaN;

    const named = new Set(
      [...section.matchAll(/\bR(\d+)\b/g)].map((match) => `R${match[1]}`),
    );

    const missing = ids.filter((id) => {
      if (named.has(id)) return false;
      const number = Number(id.slice(1));
      return !(number >= from && number <= to);
    });

    expect(
      missing,
      "Requirements in requirements.md that AGENTS.md Section 9 never mentions",
    ).toEqual([]);

    // The bundle figure quoted in AGENTS.md matches the latest evidence.
    const pattern = /(\d+\.\d+) kB JS \/ (\d+\.\d+) kB CSS/g;

    const agents = [...AGENTS.matchAll(pattern)].at(-1);
    const evidence = [...EVIDENCE.matchAll(pattern)].at(-1);

    expect(agents, "AGENTS.md must quote a bundle figure").toBeDefined();
    expect(evidence, "evidence.md must record a bundle figure").toBeDefined();

    expect(
      Math.abs(Number(agents?.[1]) - Number(evidence?.[1])),
      `AGENTS.md JS ${agents?.[1]} vs evidence ${evidence?.[1]}`,
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs(Number(agents?.[2]) - Number(evidence?.[2])),
      `AGENTS.md CSS ${agents?.[2]} vs evidence ${evidence?.[2]}`,
    ).toBeLessThanOrEqual(1);
  });
});

test.describe("R30 — the production smoke subset still cannot drift", () => {
  test("TC-3003: tags, manifest, coverage and launcher agree", () => {
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

    const covered = new Set(SMOKE_SUITE.flatMap((entry) => entry.covers));
    const missing = REQUIRED_COVERAGE.filter((area) => !covered.has(area));

    expect(
      missing,
      "Route classes the smoke subset would leave unproven in production",
    ).toEqual([]);

    expect(tagged.length).toBeGreaterThanOrEqual(6);
    expect(tagged.length).toBeLessThanOrEqual(12);
    expect(tagged.length).toBeLessThan(declaredTests().length);

    // No test may be declared twice on one TC id.
    expect(new Set(tagged.map((entry) => entry.tc)).size).toBe(tagged.length);

    const scripts = JSON.parse(
      readFileSync(path.resolve("package.json"), "utf8"),
    ).scripts as Record<string, string>;

    expect(scripts["verify:prod"]).toBe("node scripts/verify-prod.mjs");

    const launcher = readFileSync(path.resolve("scripts/verify-prod.mjs"), "utf8");

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

test.describe("R30 — a test run still never mutates committed evidence", () => {
  function normalise(value: string): string {
    return value.replace(/\\/g, "/");
  }

  test("TC-3004: captures, specs and .gitignore keep the proof clean", () => {
    test.skip(
      isEvidenceRefresh,
      "Running under npm run evidence:screenshots, where the proof folder is the target.",
    );

    expect(normalise(SCREENSHOT_DIR)).toMatch(/\/test-results\/screenshots$/);
    expect(normalise(SCREENSHOT_DIR)).not.toContain(`/${EVIDENCE_DIR}`);
    expect(normalise(screenshotPath("r1-hero.png"))).toMatch(
      /\/test-results\/screenshots\/r1-hero\.png$/,
    );

    for (const file of specFiles()) {
      const source = readFileSync(file, "utf8");

      expect(
        source,
        `${path.basename(file)} must not write into the tracked proof folder`,
      ).not.toContain(EVIDENCE_DIR);

      // A quoted `evidence/...` path is just as bad as the full one.
      expect(source).not.toMatch(/["']evidence\//);

      const calls = [
        ...source.matchAll(/page\.screenshot\(\s*\{([\s\S]{0,240}?)\}\s*\)/g),
      ].map((match) => match[1]);

      for (const body of calls) {
        expect(
          body.includes("screenshotPath("),
          `${path.basename(file)} must capture through screenshotPath()`,
        ).toBe(true);
      }
    }

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
      "The proof folder must stay committed — it holds the proof images",
    ).toEqual([]);

    expect(ignore, "test-results/ must stay ignored").toMatch(
      /^test-results\/$/m,
    );
  });
});

test.describe("R30 — the branch and approval rules are unchanged", () => {
  test("TC-3005: one branch per requirement, fast-forward publish, gated merge", () => {
    // The branch rule and its naming pattern.
    expect(workflow, "Section 2 must define a branch step").toMatch(
      /0\.\s+\*\*Branch\*\*/,
    );
    expect(workflow).toMatch(/one requirement per branch/i);
    expect(workflow, "the branch naming pattern must be stated").toContain(
      "<type>/r<N>-<slug>",
    );

    for (const type of ["feature", "fix", "chore", "docs"]) {
      expect(workflow, `branch type ${type} must be named`).toContain(type);
    }

    expect(workflow, "main must not be edited directly").toMatch(
      /main`?\s+is never edited directly/i,
    );
    expect(workflow).toMatch(/only ever receives work that has been approved/i);

    // Publishing fast-forwards main instead of committing to it.
    expect(workflow, "the branch is pushed, not main").toMatch(
      /git push`? the branch/i,
    );
    expect(workflow, "main moves last").toMatch(/moved at the very end/i);
    expect(workflow, "the merge must be fast-forward only").toContain(
      "git merge --ff-only",
    );

    // A diverged branch is rebased and re-verified.
    expect(workflow).toMatch(/not a fast-forward/i);
    expect(workflow, "rebasing is the required remedy").toMatch(/rebase/i);
    expect(workflow, "force-push must be forbidden").toMatch(
      /never\s+force-push/i,
    );
    expect(workflow, "merge commits must be forbidden").toMatch(
      /never add a merge commit/i,
    );

    // Pushing a branch is explicitly not publishing, and the gate is intact.
    expect(gate).toMatch(/pushing the work branch is not publishing/i);
    expect(gate, "publish must mean a main merge").toMatch(
      /merging the branch into `main`/i,
    );
    expect(gate, "merge, deploy and sync stay gated").toMatch(
      /merging,\s+deploying and syncing stay gated/i,
    );
    expect(gate, "the gate has no exceptions").toMatch(
      /Automated tests passing is\s+necessary but never sufficient/i,
    );
  });
});

test.describe("R30 — the guards themselves are consolidated", () => {
  test("TC-3006: one spec carries them, and the file map says so", () => {
    const present = new Set(specFiles().map((file) => path.basename(file)));

    for (const retired of RETIRED_GUARDS) {
      expect(
        present.has(retired),
        `${retired} must be retired — its assertions live in ${CONSOLIDATED_GUARD}`,
      ).toBe(false);
    }

    expect(
      present.has(CONSOLIDATED_GUARD),
      `${CONSOLIDATED_GUARD} must exist`,
    ).toBe(true);

    const source = readFileSync(
      path.join(TESTS_DIR, CONSOLIDATED_GUARD),
      "utf8",
    );
    const declared = [...source.matchAll(/^\s*test\(\s*"/gm)].length;

    expect(
      declared,
      "the consolidated spec must carry the guards, not just exist",
    ).toBeGreaterThanOrEqual(6);

    // The file map names the consolidated spec and none of the retired four.
    expect(fileMap).toContain(`tests/${CONSOLIDATED_GUARD}`);

    for (const retired of RETIRED_GUARDS) {
      expect(
        fileMap,
        `Section 5 must not name the retired ${retired}`,
      ).not.toContain(retired);
    }
  });
});
