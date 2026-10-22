import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

/**
 * R26 — `AGENTS.md` Section 9 must describe what is actually published.
 *
 * These are documentation guards: they read the repository files and fail when
 * the current-state section drifts from `requirements.md` or `evidence.md`.
 * That drift is what let R20–R24 ship while Section 9 still claimed R19 was the
 * latest.
 */

const AGENTS = readFileSync(path.resolve("AGENTS.md"), "utf8");
const REQUIREMENTS = readFileSync(path.resolve("requirements.md"), "utf8");
const EVIDENCE = readFileSync(path.resolve("evidence.md"), "utf8");

function section9(): string {
  const start = AGENTS.indexOf("## 9.");
  return start === -1 ? "" : AGENTS.slice(start);
}

test.describe("R26 — AGENTS.md current state", () => {
  test("TC-2601: Section 9 names the most recent published requirement", () => {
    const section = section9();

    // Everything the section claims is published, excluding anything still
    // marked as awaiting approval.
    const publishedPart = section.split(/awaiting owner approval/i)[0];
    const numbers = [...publishedPart.matchAll(/\bR(\d+)\b/g)].map((match) =>
      Number(match[1]),
    );
    expect(numbers.length).toBeGreaterThan(0);

    const highest = Math.max(...numbers);
    const claim = section.match(
      /\bR(\d+)\b is the most recent requirement published/i,
    );

    expect(claim, "Section 9 must say which requirement is the latest").not.toBeNull();
    expect(
      Number(claim?.[1]),
      `Section 9 claims R${claim?.[1]} is latest, but R${highest} is listed as published`,
    ).toBe(highest);
  });

  test("TC-2602: superseded requirements are kept and labelled", () => {
    const section = section9();

    expect(section).toContain("R15");
    expect(section).toMatch(/superseded by R18/i);
  });

  test("TC-2603: every requirement is accounted for in Section 9", () => {
    const section = section9();

    const ids = [...REQUIREMENTS.matchAll(/^### (R\d+)\b/gm)].map(
      (match) => match[1],
    );

    // "R2–R13" is the declared not-yet-built range.
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
  });

  test("TC-2604: the bundle figure matches the latest evidence", () => {
    const pattern = /(\d+\.\d+) kB JS \/ (\d+\.\d+) kB CSS/g;

    const agents = [...AGENTS.matchAll(pattern)].at(-1);
    const evidence = [...EVIDENCE.matchAll(pattern)].at(-1);

    expect(agents, "AGENTS.md must quote a bundle figure").toBeDefined();
    expect(evidence, "evidence.md must record a bundle figure").toBeDefined();

    const agentsJs = Number(agents?.[1]);
    const agentsCss = Number(agents?.[2]);
    const evidenceJs = Number(evidence?.[1]);
    const evidenceCss = Number(evidence?.[2]);

    expect(
      Math.abs(agentsJs - evidenceJs),
      `AGENTS.md JS ${agentsJs} vs evidence ${evidenceJs}`,
    ).toBeLessThanOrEqual(1);

    expect(
      Math.abs(agentsCss - evidenceCss),
      `AGENTS.md CSS ${agentsCss} vs evidence ${evidenceCss}`,
    ).toBeLessThanOrEqual(1);
  });
});
