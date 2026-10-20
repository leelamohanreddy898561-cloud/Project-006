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

### 2026-10-21 — Firebase integration (R16)

**Scope:** Firebase SDK installed; config module, env template, Hosting config,
and deploy target for project `project-006-e6ae1`. Content stays in markdown.
**Test cases:** TC-1601 … TC-1606 (auto), TC-1607, TC-1608 (manual — blocked)
**Commands run:**

    npm install firebase            # plus approving esbuild, protobufjs, @firebase/util install scripts
    npm run build
    npm run lint
    npx playwright test
    git check-ignore .env
    Get-Content firebase.json / .firebaserc | ConvertFrom-Json   # JSON validity
    browser console capture on http://127.0.0.1:5173/

**Results:**

| Test case | AC | Result | Notes |
| --- | --- | --- | --- |
| TC-1601 | R16.1, R16.7 | pass | `tsc --noEmit && vite build` — 0 errors; `firebase.ts` type-checks strict |
| TC-1602 | R16.7 | pass | oxlint — 0 warnings |
| TC-1603 | R16.2 | pass | `.env.example` exists and lists all 7 `VITE_FIREBASE_*` vars; `.env` is git-ignored |
| TC-1604 | R16.5 | pass | `firebase.json` valid: `public: dist`, rewrite `**` → `/index.html` |
| TC-1605 | R16.6 | pass | `.firebaserc` valid: `projects.default = project-006-e6ae1` |
| TC-1606 | R16.4, R16.7 | pass | Page renders, no uncaught errors; console shows the clear "not configured" message |
| TC-1401 | R14.1 | **fail** | Total initial JS is **221 kB gzipped** (83.8 app + 137.2 Firebase) vs the 150 kB budget — see evaluation |
| TC-1607 | R16.8 | blocked | Requires `apiKey`, `messagingSenderId`, `appId`, `measurementId` from the console |
| TC-1608 | R16.8 | blocked | Hosting deploy requires credentials + `firebase-tools` login |

**Artifacts:** `evidence/screenshots/r16-firebase-integrated.png`
**Evaluation:** The integration is complete and does not break the site when
credentials are absent — the guard logs an actionable error and the home page
still renders. **One acceptance criterion fails: R14.1.** Importing all five
Firebase products at startup costs ~137 kB gzipped; the 150 kB budget was
written before Firebase existed. Options: (a) revise AC14.1 to ~250 kB,
(b) lazy-initialize Firebase only when a feature needs it (restores ~85 kB),
(c) drop unused products. This is a scope decision for the project owner — the
budget was **not** changed unilaterally.

**Still required from the project owner** (paste into `.env`, then restart):
`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_MESSAGING_SENDER_ID`,
`VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`. The `authDomain` and
`storageBucket` currently in `.env` are derived from Firebase's standard naming
for `project-006-e6ae1` and should be confirmed in the console.

