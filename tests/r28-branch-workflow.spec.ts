import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

/**
 * R28 — `main` must only ever hold approved, published states.
 *
 * These guards read `AGENTS.md` and fail if the branch rule is softened,
 * reworded away, or dropped. TC-2805 to TC-2807 are CLI checks recorded in
 * evidence.md because they assert on real git state.
 */

const AGENTS = readFileSync(path.resolve("AGENTS.md"), "utf8");

function between(start: string, end: string): string {
  const from = AGENTS.indexOf(start);
  if (from === -1) return "";

  const to = AGENTS.indexOf(end, from + start.length);
  return to === -1 ? AGENTS.slice(from) : AGENTS.slice(from, to);
}

const workflow = between("## 2. The workflow", "## 3.");
const gate = between("## 3. The approval gate", "## 5.");

test.describe("R28 — one branch per requirement", () => {
  test("TC-2801: the branch rule and its naming pattern are documented", () => {
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
  });

  test("TC-2802: publishing fast-forwards main instead of committing to it", () => {
    expect(workflow, "the branch is pushed, not main").toMatch(
      /git push`? the branch/i,
    );
    expect(workflow, "main moves last").toMatch(/moved at the very end/i);
    expect(workflow, "the merge must be fast-forward only").toContain(
      "git merge --ff-only",
    );
  });

  test("TC-2803: a diverged branch is rebased and re-verified", () => {
    expect(workflow).toMatch(/not a fast-forward/i);
    expect(workflow, "rebasing is the required remedy").toMatch(/rebase/i);
    expect(workflow, "force-push must be forbidden").toMatch(
      /never\s+force-push/i,
    );
    expect(workflow, "merge commits must be forbidden").toMatch(
      /never add a merge commit/i,
    );
  });

  test("TC-2804: pushing a branch is explicitly not publishing", () => {
    expect(gate).toMatch(/pushing the work branch is not publishing/i);
    expect(gate, "publish must mean a main merge").toMatch(
      /merging the branch into `main`/i,
    );
    expect(gate, "merge, deploy and sync stay gated").toMatch(
      /merging,\s+deploying and syncing stay gated/i,
    );
  });
});
