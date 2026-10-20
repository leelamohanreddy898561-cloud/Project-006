# Evidence — Proof of Work

Every verification run is appended here as a new dated entry, newest first.
Never edit or delete past entries — append a new one after a re-run.

## Entry format

```md
## YYYY-MM-DD — <short title> (R#)

**Test cases:** TC-xxx, TC-xxx
**Commands run:**

    npm run build
    npx playwright test

**Results:**

| Test case | Result | Notes |
| --- | --- | --- |
| TC-001 | pass | dev server started in 415 ms |
| TC-002 | fail | TS6133 unused import in Header.tsx |

**Artifacts:** playwright-report/index.html, evidence/screenshots/<file>.png
**Evaluation:** <what passed, what failed, what was done about it>
**Commit:** <short SHA>
```

Artifacts (screenshots, downloaded reports) are stored under `evidence/`.

---

## Runs

### 2026-10-21 — Workflow foundation (partial R0)

**Scope:** Toolchain setup only — no application code yet.
**Test cases:** TC-004, TC-005
**Commands run:**

    npm install -D @playwright/test
    npx playwright install chromium
    npx playwright test
    git log --oneline

**Results:**

| Test case | AC | Result | Notes |
| --- | --- | --- | --- |
| TC-004 | R0.4 | pass | `npx playwright test` ran, 1 skipped (template spec), HTML report written to `playwright-report/` |
| TC-005 | R0.5 | pass | Initial commit `2b4b480` contains AGENTS.md, requirements.md, checklist.md, test-cases.md, evidence.md, playwright config |

**Artifacts:** `playwright-report/index.html` (git-ignored, regenerated per run)
**Evaluation:** The Playwright toolchain and repository are working. R0.1–R0.3
(dev server, build, lint) cannot be verified until the application scaffold
exists — they will be executed with the R0 implementation.
**Commit:** 2b4b480

