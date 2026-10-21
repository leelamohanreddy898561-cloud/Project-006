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

### 2026-10-21 — Change log export (R17)

**Scope:** A reviewable record of every change so far, generated from real git
history, plus the Firestore sync that publishes it.
**Test cases:** TC-1701, TC-1702 (auto), TC-1703 (manual — blocked)
**Commands run:**

    npm run changelog
    node --env-file=.env scripts/sync-changes.mjs
    node --check scripts/generate-changelog.mjs scripts/sync-changes.mjs
    git show --name-status b75cd02   # cross-check against changeLog.json

**Results:**

| Test case | AC | Result | Notes |
| --- | --- | --- | --- |
| TC-1701 | R17.1, R17.2 | pass | Valid JSON; 4 commits; file lists match `git show --name-status` exactly |
| TC-1702 | R17.4 | pass | Exits 1 with: "Missing required environment variables: VITE_FIREBASE_API_KEY, VITE_FIREBASE_APP_ID" |
| — | — | pass | Both scripts pass `node --check` |
| TC-1703 | R17.3 | blocked | Requires credentials + Firestore rules permitting writes |

**Artifacts:** `changeLog.json` (committed — reviewable without Firebase)
**Evaluation:** The change log is generated from real git data and is committed,
so it can be reviewed immediately. The Firestore write could not be executed:
credentials are still absent, so the sync script correctly refused to run. Once
`.env` is complete, `npm run sync:changes` publishes all entries to the
`changeLog` collection. Note: Firestore's default locked rules deny writes —
test-mode rules (or the Admin SDK with a service account) are required.
**Commit:** see git log (message references R17)

### 2026-10-21 — Firebase live: Firestore sync + Hosting deploy (R16, R17 complete)

**Scope:** Credentials completed by the project owner; change log synced to
Firestore; site deployed to Firebase Hosting and verified live.
**Test cases:** TC-1607, TC-1608, TC-1703, TC-1704
**Commands run:**

    node --env-file=.env scripts/sync-changes.mjs
    npm run verify:changes
    npm run build
    npx -y firebase-tools deploy --only hosting --project project-006-e6ae1
    Invoke-WebRequest https://project-006-e6ae1.web.app  (+ browser render check)

**Results:**

| Test case | AC | Result | Notes |
| --- | --- | --- | --- |
| TC-1607 | R16.8 | pass | Live site loads with **zero** Firebase console errors — credentials valid, app/auth/db/storage all initialize |
| TC-1608 | R16.8 | pass | Deployed to **https://project-006-e6ae1.web.app** — "Deploy complete!" |
| TC-1703 | R17.3 | pass | 4 documents written to the `changeLog` collection; read-back confirms all present |
| TC-1704 | R17.3 | pass | Re-run adds 0 new documents (duplicate guard added) |
| — | R16.5 | pass | SPA rewrite verified: `/blog/some-post` returns 200 |
| — | R14.1 | **still failing** | 221 kB gzipped JS (83.9 app + 137.2 Firebase) vs 150 kB budget — decision still pending |

**Artifacts:** `evidence/screenshots/r16-live-deployed.png` (live site, header +
hero rendering correctly); Firestore document IDs:
`omFfkKsrHiB8YC1D7TGd`, `P6cDIm3vwabZsxG4P9lA`, `n7edXawH7Gm90gepwblS`,
`E7ycS6yambCm7vteq6NK`
**Evaluation:** R16 and R17 are now complete and verified end-to-end: real
credentials initialize Firebase on the live site, the change log is stored in
Firestore, and the site is publicly deployed. The sync script was made
idempotent (skips commits already present) after the first successful run.
The only outstanding acceptance criterion is **R14.1**, which still fails and
awaits a scope decision from the project owner.
**Commit:** see git log (message references R16/R17)

### 2026-10-21 — Published to GitHub

**Scope:** Full project history pushed to the user's GitHub repository.
**Test cases:** n/a (repository operation — verified directly)
**Commands run:**

    git remote add origin https://github.com/leelamohanreddy898561-cloud/Project-006.git
    git ls-remote origin                       # remote had an existing "Initial commit" (placeholder README)
    git pull origin main --allow-unrelated-histories --no-edit
    git push -u origin main

**Results:**

| Check | Result | Notes |
| --- | --- | --- |
| Remote state before push | pass | Remote had one commit (`0affa55`, placeholder README) — unrelated history |
| Strategy | pass | **Merged** rather than force-pushed, preserving the remote's existing commit and README.md |
| Push | pass | `0affa55..e776b1c  main -> main` |
| Remote verification | pass | Remote HEAD = `e776b1c`; 40 files present |
| Secret scan (pre-push) | pass | `git grep "AIza"` on tracked files: clean |
| Secret scan (post-push) | pass | `git grep "AIza" origin/main`: clean |
| `.env` exclusion | pass | Only `.env.example` in the remote tree; `.env` confirmed git-ignored |

**Artifacts:** https://github.com/leelamohanreddy898561-cloud/Project-006
**Evaluation:** The repository is live on GitHub with the complete history
(7 commits + merge). No credentials were exposed — the Firebase API key exists
only in the local, git-ignored `.env`. The remote's placeholder README was
preserved via an unrelated-histories merge instead of a destructive force-push.
**Commit:** subsequent evidence commit, pushed in the same operation

### 2026-10-21 — Lazy Firebase init: R14.1 budget fixed (R16 revised, R14.1 green)

**Scope:** Enforce the new "never push with a failing criterion" rule and fix
the R14.1 bundle budget by making Firebase initialize on demand.
**Test cases:** TC-1404, TC-1405, TC-1606, TC-1607, TC-1601, TC-1602
**Commands run:**

    npm run build          # tsc --noEmit && vite build
    npm run lint
    npx playwright test
    Select-String dist/assets/index-*.js -Pattern "firebase"   # SDK absent from main chunk

**Results:**

| Test case | AC | Result | Notes |
| --- | --- | --- | --- |
| TC-1405 / TC-1401 | R14.1 | **pass** | Initial JS **83.32 kB gzipped** (was 221 kB) — under the 150 kB budget |
| TC-1402 | R14.2 | pass | CSS 1.38 kB gzipped |
| TC-1404 / TC-1606 | R16.4 | pass | Zero Firebase assets requested on the home page (verified via network monitoring) |
| TC-1607 | R16.9 | pass | `getFirebase()` initializes against `project-006-e6ae1` with real credentials |
| TC-1601 | R16.8 | pass | Build passes, strict TypeScript |
| TC-1602 | R16.8 | pass | oxlint, zero warnings |
| — | regression | pass | All 4 header tests and the home CTA test still pass (7 passed, 1 skipped total) |

**What changed:** `src/lib/firebase.ts` rewritten as a lazy `getFirebase()`
loader using dynamic `import()`; the eager import removed from `main.tsx`
(replaced with a side-effect import of the ~1 kB loader, which production
tree-shakes away entirely since nothing calls it yet); `manualChunks` removed
from `vite.config.ts`; `vite.config.ts` no longer needs chunk surgery. A
dev-only `window.__getFirebase` hook enables TC-1607 and is stripped from
production builds.

**One honest note on the first attempt:** removing the import from `main.tsx`
entirely tree-shook the loader out of the production bundle *and* removed the
dev hook, which would have made TC-1607 unverifiable. The side-effect import
was restored — it costs nothing in production because Rollup drops the unused
exports.

**Evaluation:** R14.1 now passes with a 67 kB margin. R16's acceptance criteria
were revised (AC16.3–AC16.5) to describe on-demand initialization, and the
change is recorded in the decision log — the budget itself was **not** raised.
All tests green before commit and push, per the new AGENTS.md rule.
**Commit:** see git log (message references R14.1/R16)

### 2026-10-21 — Glassmorphism header (R18, supersedes R15)

**Scope:** New AI Pulse glassmorphism header with glowing logo, gradient-hover
navigation, search icon, theme toggle (delivering R9), and Sign In / Sign Up
controls. R15 marked superseded; Categories renamed Topics, AI Updates
relabelled Blogs; placeholder routes added so no header link dead-ends.
**Test cases:** TC-1801–TC-1812, TC-101 (regression)
**Commands run:**

    npm run build
    npm run lint
    npx playwright test

**Results:**

| Test case | AC | Result | Notes |
| --- | --- | --- | --- |
| TC-1801 | R18.1 | pass | `backdrop-filter` contains blur; background alpha 0.65 (light) / 0.6 (dark); border present |
| TC-1802 | R18.2 | pass | Logo + "AI Pulse" brand visible, links to `/`; glow animation running |
| TC-1803 | R18.3 | pass | Home→`/`, Topics→`/topics`, Blogs→`/blog`, About→`/about`; gradient `:hover` rule verified in the stylesheet |
| TC-1804 | R18.4 | pass | Search icon → `/blog` |
| TC-1805 | R18.5 | pass | Toggle flips `data-theme` and body background; persists after reload |
| TC-1806 | R18.6 | pass | With `colorScheme: dark` and no stored theme, the page renders dark |
| TC-1807 | R18.4 | pass | Sign In → `/signin`, Sign Up → `/signup` |
| TC-1808 | R18.8 | pass | `/`, `/topics`, `/blog`, `/about`, `/signin`, `/signup`, and an unknown route all render a real heading |
| TC-1809 | R18.7 | pass | Nav contrast ≥ 4.5:1 in both themes (light ≈ 7.6:1, dark ≈ 7.3:1) |
| TC-1810 | R18.9 | pass | Exactly one active nav link, matching the route |
| TC-1811 | R18.11 | pass | Under `prefers-reduced-motion: reduce`, the logo animation is `none` |
| TC-101 | R18.10 | pass | Home hero regression — eyebrow, h1, lead, CTA all correct under the new brand |
| TC-1606/1607 | — | pass | Firebase regression — still lazy, still initializes on demand |

**Two failures were found and fixed during evaluation (not hidden):**
1. **Contrast measured mid-transition (2.48:1)** — the nav link's 200ms colour
   transition meant the text colour was still the old theme's when measured.
   Fixed by adding a global `prefers-reduced-motion` block that neutralises
   transitions/animations (an accessibility improvement in its own right) and
   polling until the colour settles.
2. **TC-1806 asserted the wrong thing** — the app legitimately persists the
   system-derived theme on first visit, so "localStorage is empty" was never
   true. The assertion was corrected to check the applied theme.

**Artifacts:** `evidence/screenshots/r18-header-light.png`,
`evidence/screenshots/r18-header-dark.png`
**Evaluation:** 14 passed, 1 skipped (template spec). Build and lint clean.
Bundle: 84.38 kB JS / 2.08 kB CSS gzipped — still inside the R14.1/R14.2
budgets. R18 is complete pending the owner's visual review; R9 (theme toggle)
is delivered by this work.
**Commit:** local only — **awaiting owner approval before push/deploy**

### 2026-10-21 — R18 published after owner approval

**Scope:** Owner visually reviewed the glassmorphism header locally and gave
the OK. All three publish actions then ran.
**Test cases:** n/a (publish operation — verified directly)
**Commands run:**

    git push origin main
    npm run changelog && npm run sync:changes && npm run verify:changes
    npm run build && npx firebase-tools deploy --only hosting --project project-006-e6ae1

**Results:**

| Check | Result | Notes |
| --- | --- | --- |
| Secret scan (pre-push) | pass | Real API key absent from all tracked files and from the remote tree; `.env` not on GitHub |
| GitHub push | pass | `59ab09e..2f7cb8c` then `2f7cb8c..7aac76f` |
| Firestore sync | pass | 3 new documents (15 total), read-back verified |
| Hosting deploy | pass | "Deploy complete!" |
| Live site verification | pass | Brand "AI Pulse", nav Home/Topics/Blogs/About, search, theme toggle, Sign In/Sign Up, glass blur, and logo glow all confirmed on the deployed URL; single JS chunk (84.4 kB gzipped) |

**Artifacts:** `evidence/screenshots/r18-live-deployed.png`
**Evaluation:** R18 is published end-to-end. One note on the secret scan: it
initially flagged `evidence.md`, which turned out to be a false positive — the
file contains the literal text `git grep "AIza"` from documenting earlier
scans, not the key itself. Verified before and after the push.
**Commit:** `7aac76f` (change log regeneration; this entry follows it)

