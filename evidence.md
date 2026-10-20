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

### 2026-10-21 — Site header and home page button (R15, R1 partial, R0 complete)

**Scope:** Application scaffold (R0), site header (R15), home page hero and
call-to-action button (R1 partial). Deliberately nothing else.
**Test cases:** TC-001, TC-002, TC-003, TC-004, TC-101, TC-1501, TC-1502, TC-1503, TC-1504
**Commands run:**

    npm install            # after approving esbuild's install script (npm 11 allowScripts)
    npm run build
    npm run lint
    npx playwright test

**Results:**

| Test case | AC | Result | Notes |
| --- | --- | --- | --- |
| TC-001 | R0.1 | pass | `npm run dev` served by Playwright's `webServer` on 127.0.0.1:5173 |
| TC-002 | R0.2 | pass | `tsc --noEmit && vite build` — 0 errors, strict mode |
| TC-003 | R0.3 | pass | oxlint — 0 warnings |
| TC-004 | R0.4 | pass | 5 passed, 1 skipped (template spec) |
| TC-101 | R1.1 | pass | Hero eyebrow, h1, lead, and CTA (`href="/blog"`) all present |
| TC-1501 | R15.1 | pass | Header visible; brand links to `/` |
| TC-1502 | R15.2 | pass | Nav links: `/`, `/blog`, `/categories`, `/about` |
| TC-1503 | R15.3 | pass | Exactly one active nav link ("Home" on `/`) |
| TC-1504 | R15.4 | pass | Exactly one `<header>` landmark |

**Artifacts:** `evidence/screenshots/r1-home-hero.png` (captured by TC-101)
**Evaluation:** All executed test cases passed on the first run; no fixes were
needed. Bundle sizes also already satisfy the R14 budgets (83.3 kB JS / 1.4 kB
CSS gzipped). R15 and R0 are complete; R1 remains partial (featured, latest,
and category sections not yet built).
**Commit:** see git log (message references R15/R1)

