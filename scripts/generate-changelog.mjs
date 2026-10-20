/**
 * R17 — Change log generator.
 *
 * Builds changeLog.json from REAL git history (no hand-written data):
 * every commit, its changed files, plus curated per-commit metadata
 * (requirement IDs and verification results).
 *
 * Run: npm run changelog
 */

import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const git = (command) =>
  execSync(`git ${command}`, { encoding: "utf8" }).trim();

/** Curated metadata per commit — requirement IDs and verification results. */
const COMMIT_META = {
  "2b4b480": {
    requirements: ["R0"],
    verification: {
      testsPassed: 0,
      testsSkipped: 1,
      testsFailed: 0,
      build: "pass",
      lint: "pass",
    },
    notes:
      "Workflow foundation: AGENTS.md standing loop, requirements.md (R0–R15), test-cases.md, evidence.md format, ID-tagged checklist.md, Playwright config and template spec.",
  },
  d434294: {
    requirements: ["R0"],
    verification: {
      testsPassed: 0,
      testsSkipped: 1,
      testsFailed: 0,
      build: "pass",
      lint: "pass",
    },
    notes:
      "First evidence entry: Playwright runner executes (TC-004), initial commit present (TC-005).",
  },
  c6e604d: {
    requirements: ["R0", "R15", "R1"],
    verification: {
      testsPassed: 5,
      testsSkipped: 1,
      testsFailed: 0,
      build: "pass",
      lint: "pass",
    },
    notes:
      "App scaffold (Vite + React 19 + TS strict + React Router), design tokens, site header (R15), home hero with CTA button (R1 partial). TC-001–TC-004, TC-101, TC-1501–TC-1504 all pass.",
  },
  b75cd02: {
    requirements: ["R16"],
    verification: {
      testsPassed: 6,
      testsSkipped: 1,
      testsFailed: 0,
      build: "pass",
      lint: "pass",
    },
    notes:
      "Firebase SDK v13 integration: src/lib/firebase.ts (guarded init), .env.example, firebase.json, .firebaserc (project-006-e6ae1), Firebase chunk split. R14.1 budget FAILED (221 kB vs 150 kB) — flagged, not silently changed. TC-1607/1608 blocked on credentials.",
  },
};

const commits = git("log --pretty=format:%H%x1f%h%x1f%aI%x1f%s")
  .split("\n")
  .map((line) => {
    const parts = line.split("\u001f");
    const [hash, short, date, ...subjectParts] = parts;
    return { hash, short, date, subject: subjectParts.join(" ") };
  });

const entries = commits.map((commit) => {
  const files = git(`show --name-status --pretty=format: ${commit.hash}`)
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [status, ...pathParts] = line.split("\t");
      return { status, path: pathParts.join("\t") };
    });

  const meta = COMMIT_META[commit.short] ?? {
    requirements: [],
    verification: null,
    notes: "",
  };

  return {
    commit: commit.hash,
    short: commit.short,
    date: commit.date,
    subject: commit.subject,
    requirements: meta.requirements,
    verification: meta.verification,
    notes: meta.notes,
    files,
  };
});

const statusCounts = entries
  .flatMap((entry) => entry.files)
  .reduce((counts, file) => {
    counts[file.status] = (counts[file.status] ?? 0) + 1;
    return counts;
  }, {});

const latest = entries[0].verification;

const payload = {
  generatedAt: new Date().toISOString(),
  project: "signal-and-noise",
  firebaseProjectId: "project-006-e6ae1",
  targetCollection: "changeLog",
  summary: {
    commits: entries.length,
    fileChanges: statusCounts,
    latestVerification: latest,
    requirementsImplemented: ["R0", "R15"],
    requirementsPartial: ["R1"],
    requirementsBlockedOnCredentials: ["R16", "R17"],
    knownIssues: [
      "R14.1 performance budget exceeded: 221 kB gzipped JS (83.8 app + 137.2 Firebase) vs 150 kB budget — decision pending",
      "Firebase credentials incomplete: apiKey, messagingSenderId, appId, measurementId missing from .env",
    ],
  },
  entries: entries.reverse(), // oldest first, chronological
};

writeFileSync("changeLog.json", `${JSON.stringify(payload, null, 2)}\n`);
console.log(
  `changeLog.json written — ${entries.length} commits, ${JSON.stringify(statusCounts)}`,
);
