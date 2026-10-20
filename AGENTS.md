# AGENTS.md — Standing workflow for this project

This file is read automatically by OpenCode at the start of every session.
Follow it for **every requirement** — no reminders needed.

---

## The loop (every requirement, every time)

1. **Specify** — add the requirement to `requirements.md` with an ID (`R0`, `R1`, …)
   and testable acceptance criteria. Even the smallest change gets an ID.
2. **Plan tests** — add test cases to `test-cases.md` (`TC-1`, `TC-2`, …) mapped to
   the requirement ID, with concrete steps and expected results.
3. **Checklist** — add the work items to `checklist.md`, tagged with the requirement ID.
4. **Implement** — write the code.
5. **Execute tests** — run them with Playwright (`npx playwright test`) or the browser
   tools for visual/DOM checks. **Never claim a test passed without running it.**
6. **Evidence** — append an entry to `evidence.md`: date, requirement ID, exact
   commands run, pass/fail per test case, and links to the Playwright report and
   screenshots.
7. **Evaluate** — if anything fails, fix it and re-run from step 5. Do not mark a
   requirement done with failing tests.
8. **Commit** — only when green, with a message referencing the requirement ID
   (e.g. `feat: R2 search and filters on AI Updates page`). Push only after the
   green result is recorded in `evidence.md`.

## Non-negotiables

- **Never commit or push with a failing acceptance criterion.** Before any commit,
  run the verification for every requirement the change touches and record the
  green result in `evidence.md` first. If something cannot be made green, **stop
  and ask the project owner** — do not push "flagged but broken" code.
- No requirement is "done" without a matching entry in `evidence.md`.
- Never edit or delete a past evidence entry — append a new dated one.
- Every test case is either executable or explicitly labelled `manual`.
- Keep files consolidated by ID (see file map). Do **not** create one
  `requirements.md` per requirement.
- **Bundle budgets are hard limits.** If a change pushes a budget over, fix the
  change (lazy-load, split, drop) — do not raise the budget without the project
  owner's explicit approval.

## File map

| File | Purpose |
| --- | --- |
| `requirements.md` | Numbered requirements (`R#`) with acceptance criteria |
| `checklist.md` | Work items, each tagged with a requirement ID |
| `test-cases.md` | Test cases (`TC#`) mapped to requirement IDs |
| `evidence.md` | Dated proof of work: commands, results, artifacts |
| `AGENTS.md` | This workflow |
| `tests/*.spec.ts` | Playwright specs, one file per requirement area |
| `playwright.config.ts` | Playwright configuration |
| `scripts/generate-changelog.mjs` | Builds `changeLog.json` from git history |
| `scripts/sync-changes.mjs` | Writes `changeLog.json` to Firestore |
| `changeLog.json` | Committed record of all changes (reviewable without Firebase) |

## Testing

- Runner: **Playwright** (`@playwright/test`).
- Run everything: `npx playwright test`
- Run one area: `npx playwright test tests/<file>.spec.ts`
- View the HTML report: `npx playwright show-report`
- Reports are written to `playwright-report/` and `test-results/` (git-ignored).
- The browser tools may be used for quick visual spot checks; record what was
  checked in `evidence.md` just like a test run.

## Definition of done (per requirement)

- [ ] All acceptance criteria in `requirements.md` met
- [ ] All mapped test cases in `test-cases.md` executed
- [ ] `evidence.md` entry appended with results
- [ ] `checklist.md` items checked
- [ ] Changes committed
