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

### 2026-10-21 — Hero section: network effect and floating topic card (R1.1–R1.6)

**Scope:** New home page hero — "Explore the Future of AI" headline with a
"Start Reading" button, an animated AI network canvas behind the content, and a
floating popular-topic card on the right.
**Test cases:** TC-101–TC-106, plus TC-1808 regression
**Commands run:**

    npm run build
    npm run lint
    npx playwright test

**Results:**

| Test case | AC | Result | Notes |
| --- | --- | --- | --- |
| TC-101 | R1.1 | pass | Headline, description, and "Start Reading" → `/blog` |
| TC-102 | R1.2 | pass | Canvas has non-zero size and its pixel fingerprint changes across 400ms (verified animating, not just present) |
| TC-103 | R1.3 | pass | Card visible with a float animation; topic text rotates after the interval |
| TC-104 | R1.4 | pass | Under `prefers-reduced-motion`: canvas fingerprint unchanged; card animation duration ≈ 0 |
| TC-105 | R1.5 | pass | At 360×800 the card renders below the text; zero horizontal overflow |
| TC-106 | R1.6 | pass | Hero description contrast ≥ 4.5:1 in both themes |
| TC-1808 | — | pass | Header route test updated for the new hero headline and re-run green |

**What was built:** `NetworkBackground` (canvas particle network, ~60 nodes,
slow drift, accent colour read from CSS so it follows the theme, static frame
under reduced motion), `TopicCard` (glass card, float animation, rotates
through four topics every 4.5s, rotation stops under reduced motion), and a
two-column hero that stacks on mobile with a radial scrim protecting text
contrast over the network.

**One test fixed during evaluation:** TC-1808 asserted the old hero headline
("Making sense of AI"); updated to the new copy and re-run — legitimate, since
the requirement changed.

**Artifacts:** `evidence/screenshots/r1-hero.png`
**Evaluation:** 19 passed, 1 skipped. Build and lint clean. Bundle 85.5 kB JS /
2.6 kB CSS gzipped — inside the R14.1/R14.2 budgets. Note: the topic card's
post counts are placeholders until the content model (R13) lands.
**Commit:** local only — **awaiting owner approval before push/deploy**

### 2026-10-21 — R1 hero published + production verification (owner approved)

**Scope:** Owner approved the hero section. Published to GitHub, synced to
Firestore, deployed to Hosting. Also closed a verification gap: the deployed
artifact is now tested directly.
**Test cases:** full suite, run twice — once against the dev server, once
against the live site
**Commands run:**

    git push origin main
    npm run changelog && npm run sync:changes && npm run verify:changes
    npm run build && npx firebase-tools deploy --only hosting --project project-006-e6ae1
    $env:PLAYWRIGHT_BASE_URL="https://project-006-e6ae1.web.app"; npx playwright test

**Results:**

| Check | Result | Notes |
| --- | --- | --- |
| Secret scan | pass | Real API key absent from tracked files |
| GitHub push | pass | `07964b7..5aa5de8`, then `5aa5de8..26484e5` |
| Firestore sync | pass | 3 new documents (18 total), read-back verified |
| Hosting deploy | pass | "Deploy complete!" |
| Suite vs **dev server** | pass | 19 passed, 1 skipped |
| Suite vs **live production** | pass | 18 passed, 2 skipped |

**A verification gap found and closed.** Checking the live site through the
browser tools reported a blank canvas (0 non-zero pixel samples, no change).
Investigation showed the cause was environmental, not a defect: the browser tab
reports `visibilityState: "hidden"`, and `requestAnimationFrame` is suspended
in hidden tabs, so the network never drew. **Rather than assume, the deployed
artifact was tested with Playwright** — whose browser runs rAF normally. All six
hero cases passed against production, including TC-102 (canvas animating) and
TC-103 (card floating and rotating).

**New capability:** `playwright.config.ts` now honours `PLAYWRIGHT_BASE_URL`.
Setting it runs the whole suite against any deployed URL and skips starting a
local server — so the shipped build, not just the dev server, can be verified.

**One test made explicitly dev-only:** TC-1607 relies on `window.__getFirebase`,
which is stripped from production builds by design (that is what keeps Firebase
out of the bundle). It now skips with that reason when a remote base URL is set,
instead of failing misleadingly.

**Artifacts:** `evidence/screenshots/r1-hero.png`
**Evaluation:** R1 hero is published and verified in both environments. Bundle
85.5 kB JS / 2.6 kB CSS gzipped. The topic card's post counts remain
placeholders until R13 (content model).
**Commit:** see git log (message references R1)

### 2026-10-21 — Home main content layout: article grid + sidebar (R19)

**Scope:** Two-column main content area below the hero — article grid (≈70%)
with rich blog cards, and a discovery sidebar (≈30%) with trending topics,
search, and quick filters. Supersedes R1.7–R1.9.
**Test cases:** TC-1901–TC-1912, plus the full regression suite
**Commands run:**

    npm run build
    npm run lint
    npx playwright test

**Results:**

| Test case | AC | Result | Notes |
| --- | --- | --- | --- |
| TC-1901 | R19.1 | pass | Sidebar sits right of the article column; measured ratio ≈0.70 |
| TC-1902 | R19.2 | pass | 6 cards, two columns at 1440px, newest-first ordering confirmed |
| TC-1903 | R19.4 | pass | Image (verified actually loaded via `naturalWidth`), badge, title, "N min read", author avatar + name, bookmark button |
| TC-1904 | R19.5 | pass | Hover changes the card `transform` and scales the image |
| TC-1905 | R19.6 | pass | Under reduced motion the card transform stays `none`/identity |
| TC-1906 | R19.9 | pass | Sidebar has trending topics (5), a searchbox, and a quick-filter group |
| TC-1907 | R19.10 | pass | Search "prompt" narrows the grid to 1 article; count updates to "1 article" |
| TC-1908 | R19.11 | pass | "Featured" filter shows exactly 2 posts and is marked active |
| TC-1909 | R19.7 | pass | Bookmark `aria-pressed` false → true, gains `is-active` |
| TC-1910 | R19.12 | pass | Nonsense search shows the empty state, not a blank column |
| TC-1911 | R19.3 | pass | At 360px the sidebar renders below the articles; zero overflow |
| TC-1912 | R19.8 | pass | Title and excerpt contrast ≥ 4.5:1 in both themes |
| — | R19.13 | pass | 31 passed, 1 skipped; build and lint clean; 87.9 kB JS gzipped |

**Deliberate placeholder decisions (flagged for the owner):**
1. **Seed data.** Posts live in `src/data/posts.ts` mirroring the final `Post`
   shape. The content model (R13) will load the same fields from markdown
   frontmatter — only that one file changes, not the components.
2. **Cover art.** Locally authored abstract SVGs in `public/covers/` rather than
   external photo URLs: they always load, carry no licensing questions, cost a
   few kB each, and need no network. Real artwork or Firebase Storage can
   replace them later.
3. **Bookmark** is a local UI toggle — persisting it needs an account (Firebase
   Auth), which is not built yet.
4. **Card links** point to `/blog/:slug` and `/topics/:slug`, which are still
   placeholder pages until R3 and R4 land.

**Artifacts:** none new (no screenshots captured this run)
**Evaluation:** R19 complete and green. Search and quick filters operate on the
home grid; R2 will add the dedicated `/blog` list page with URL-driven filters.
**Commit:** `2e1546a` (local at time of this entry)

---

### 2026-10-21 — R19 published to GitHub, Firestore, and Firebase Hosting

**Gate:** owner replied **"ok"** after reviewing http://127.0.0.1:5173/
**Commands run:**

    git push origin main
    npm run changelog
    npm run sync:changes
    npm run verify:changes
    npm run build
    npx firebase-tools deploy --only hosting --project project-006-e6ae1 --non-interactive
    set PLAYWRIGHT_BASE_URL=https://project-006-e6ae1.web.app && npx playwright test
    git push origin main

**Results:**

| Step | Result | Notes |
| --- | --- | --- |
| Secret scan (`git grep` for the Firebase API key) | clean | Key exists only in git-ignored `.env` |
| Push to GitHub | pass | `0c083f8..2e1546a`, exit 0 |
| Change log regeneration | pass | 22 commits, 91 modified / 70 added / 1 deleted |
| Firestore sync | pass | 2 new, 20 already present — no duplicates |
| Firestore read-back (`verify:changes`) | pass | Every `changeLog.json` entry present in Firestore |
| Build | pass | 87.9 kB JS gzipped / 3.4 kB CSS gzipped (budgets 150 / 25 kB) |
| Hosting deploy | pass | 10 files, version finalized, release complete |
| **Production suite** | **30 passed, 2 skipped** | Against the live URL via `PLAYWRIGHT_BASE_URL` |
| Changelog commit + push | pass | `2e1546a..cc67920`, `origin/main` in sync (0 ahead) |

**Production run detail** — every R19 test case passed against the deployed
site, not just locally: TC-1901 (column ratio), TC-1902 (grid + order),
TC-1903 (card parts + image actually loaded), TC-1904 (hover lift + zoom),
TC-1905 (no lift under reduced motion), TC-1906 (sidebar sections),
TC-1907 (search filters), TC-1908 (quick filter), TC-1909 (bookmark),
TC-1910 (empty state), TC-1911 (360px single column, no overflow),
TC-1912 (AA contrast both themes).
The 2 skips are TC-1607 and the dev-only r16 hook, which are excluded
against remote URLs by design.

**Artifacts:**
- GitHub: https://github.com/leelamohanreddy898561-cloud/Project-006 (commit `cc67920`)
- Live: https://project-006-e6ae1.web.app
- Firestore `changeLog`: 22 documents verified

**Evaluation:** R19 fully published. The approval gate was observed — the
deploy and both pushes happened only after the owner's "ok".

**Commit:** pending this evidence entry (next commit, pushed immediately after)

---

### 2026-10-21 — Footer + newsletter subscription (R20)

**Scope:** A newsletter subscription box above a four-column footer (brand,
Quick Links, AI Categories, Social) with a copyright/legal bottom bar. Rendered
site-wide below `<main>`.
**Test cases:** TC-2001–TC-2012, plus the full regression suite
**Commands run:**

    npm run build
    npm run lint
    npx playwright test

**Results:**

| Test case | AC | Result | Notes |
| --- | --- | --- | --- |
| TC-2001 | R20.1 | pass | Newsletter box sits entirely above the `<footer>`; email field + Subscribe present |
| TC-2002 | R20.2 | pass | `not-an-email` → `is-error`, `aria-invalid="true"`, no success |
| TC-2003 | R20.3 | pass | Valid email → `is-success`, `role="status"`, `aria-live="polite"`, field cleared |
| TC-2004 | R20.4 | pass | `<label for>` association resolves by role+name; `aria-describedby` points at the message |
| TC-2005 | R20.5 | pass | Exactly 4 `.site-footer__col` columns; brand + 3 headings present |
| TC-2006 | R20.6 | pass | Home/Blogs/Topics/About navigate via the router — SPA marker survived every click |
| TC-2007 | R20.7 | pass | Every AI category links to `/topics/<slug>` |
| TC-2008 | R20.8 | pass | X, GitHub, LinkedIn each `target="_blank"` with `rel` containing `noopener` |
| TC-2009 | R20.9 | pass | Bottom bar shows the current year and "All rights reserved" |
| TC-2010 | R20.10 | pass | Privacy Policy → `/privacy` renders a heading (not a dead `#`) |
| TC-2011 | R20.11 | pass | At 360px columns stack (same x, second below first), zero overflow |
| TC-2012 | R20.12 | pass | Intro and copyright text contrast ≥ 4.5:1 in both themes |
| — | R20.13 | pass | 43 passed, 1 skipped; build and lint clean; 90.2 kB JS / 4.0 kB CSS gzipped |

**One failure found and fixed during the run:** TC-2005 initially failed because
the header and footer both expose a link named "AI Pulse — home", so the
un-scoped query matched twice. The assertion was scoped to the footer — the two
links are intentional (same destination, two placements), so the test changed,
not the UI.

**Deliberate placeholder decisions (flagged for the owner):**
1. **No data is stored.** A valid email only produces a client-side confirmation.
   There is no mailing list, and subscriber emails must not go into the current
   wide-open Firestore rules.
2. **X and LinkedIn URLs are placeholders** (`x.com/aipulse`,
   `linkedin.com/company/aipulse`). GitHub points at the real repository. All
   three live in `src/data/site.ts` for a one-line change.
3. **AI Categories are derived from the post data** (`getCategories()`), so the
   footer never links to a topic with no posts.
4. **`/privacy` and `/terms` are placeholder pages** using the existing
   `Placeholder` component — real legal copy is the owner's call.

**Artifacts:** `test-results/` (git-ignored) holds the transient failure
screenshot from the first TC-2005 run; the re-run is green.
**Evaluation:** R20 complete and green.

**Commit:** `ab0f67e` (local at the time of that entry)

---

### 2026-10-21 — R20 published to GitHub, Firestore, and Firebase Hosting

**Gate:** owner replied **"ok push to github and sync firestore"**
**Commands run:**

    git push origin main
    npm run changelog
    npm run sync:changes
    npm run verify:changes
    npm run build
    npx firebase-tools deploy --only hosting --project project-006-e6ae1 --non-interactive
    set PLAYWRIGHT_BASE_URL=https://project-006-e6ae1.web.app && npx playwright test
    git push origin main

**Results:**

| Step | Result | Notes |
| --- | --- | --- |
| Secret scan | clean | Firebase key only in git-ignored `.env` |
| Push to GitHub | pass | `c4ebdb5..ab0f67e` (R20 code) |
| Change log regeneration | pass | 26 commits, 112 modified / 76 added / 1 deleted |
| Firestore sync | pass | 2 new, 24 already present — no duplicates |
| Firestore read-back | pass | Every `changeLog.json` entry present |
| Build | pass | 90.2 kB JS / 4.0 kB CSS gzipped (budgets 150 / 25 kB) |
| Hosting deploy | pass | 10 files, release complete |
| **Production suite** | **42 passed, 2 skipped** | All R20 cases green against the live URL |
| Changelog commit + push | pass | `ab0f67e..8e1e7a0` |

**Firebase Storage — explicitly checked, nothing to sync.** `firebase.json`
declares only a `hosting` block, there is no `storage` configuration, and no
`storage.rules` file exists in the repository. The cover images are static SVG
files in `public/covers/` that Vite copies into `dist/` and Firebase Hosting
serves directly — they are build output, not uploaded objects. Firebase Storage
therefore holds no project data and no sync step applies. Setting up a bucket
(and writing rules) would be a new requirement, not part of this publish.

**Artifacts:**
- GitHub: commit `8e1e7a0`
- Live: https://project-006-e6ae1.web.app
- Firestore `changeLog`: 26 documents verified

**Evaluation:** R20 published. Approval gate observed — deploy and pushes
happened only after the owner's "ok".

---

### 2026-10-22 — Repository and workflow hygiene (R21)

**Scope:** The six cleanup items from the repository audit: untrack the Firebase
CLI cache, drop the placeholder spec, collapse publishing to one change-log
cycle, pin `firebase-tools`, distinguish the two brand links, and document the
files that are kept on purpose.
**Test cases:** TC-2101–TC-2107, plus the full regression suite
**Commands run:**

    git rm -r --cached .firebase
    git rm tests/example.spec.ts
    npm install --save-dev firebase-tools
    npm run build
    npm run lint
    npx playwright test
    git ls-files
    npm ls firebase-tools --depth=0
    npx --no-install firebase --version

**Results:**

| Test case | AC | Result | Evidence |
| --- | --- | --- | --- |
| TC-2101 | R21.1 | pass | `git ls-files` has no `.firebase/` entries; `.gitignore` contains `.firebase/`; the file stays on disk (`git status` reports it as ignored `!!`) |
| TC-2102 | R21.2 | pass | `tests/example.spec.ts` deleted; the "Writing a spec" convention now lives in `test-cases.md` |
| TC-2103 | R21.3 | pass | **44 passed, 0 skipped** locally (was 43 passed / 1 skipped) |
| TC-2104 | R21.4 | pass (manual) | `AGENTS.md` step 11 now specifies one cycle: push → deploy → verify → evidence → **one** changelog → sync → verify → commit → push, with the self-reference reason written down |
| TC-2105 | R21.5 | pass | `firebase-tools@15.34.1` in devDependencies (exact, no caret); `npx --no-install firebase --version` → `15.34.1` |
| TC-2106 | R21.6 | pass | Header link name "AI Pulse — home"; footer link name "AI Pulse". The old name now matches exactly once instead of twice |
| TC-2107 | R21.8 | pass | Build and lint clean; 44 passed / 0 skipped; 90.2 kB JS / 4.0 kB CSS gzipped (budgets 150 / 25 kB) |

**Changes in detail:**

1. **`.firebase/` untracked + ignored.** It was the CLI's local deploy cache
   (978 B of local paths, timestamps, and hashes). Removing it from the index
   keeps it on disk for the CLI while stopping machine-specific churn from
   reaching the repository.
2. **`tests/example.spec.ts` deleted.** It was a permanently `test.skip()`d
   template — the sole source of the "1 skipped" in every run. Its guidance
   moved into `test-cases.md` under "Writing a spec".
3. **Publishing now uses one change-log cycle.** Previously each release ran
   regenerate → sync → commit → push twice (four commits per release). Because
   the final changelog commit can never contain itself, the second cycle bought
   nothing: the repository still ends one commit ahead of Firestore. The order
   is now push → deploy → verify → evidence → **one** changelog cycle.
4. **`firebase-tools` pinned** at `15.34.1` as an exact devDependency, with a
   new `npm run deploy` script. Deploys no longer depend on `npx -y` resolving
   whatever version is current that day.
5. **Brand links distinguished.** The footer link no longer overrides its
   accessible name; it now reads "AI Pulse" from its own text, while the header
   keeps "AI Pulse — home". Two same-named links became two properly distinct
   ones.
6. **Kept on purpose, now documented.** `evidence/screenshots/*.png` and
   `changeLog.json` stay committed; `AGENTS.md` records why, and lists what is
   never committed.

**Trade-off recorded honestly:** pinning `firebase-tools` takes `node_modules`
to about **456 MB** (git-ignored, so the repository is unaffected, but a fresh
`npm install` is heavier and slower). The alternative — `npx --yes
firebase-tools@15.34.1` in the deploy script — gives the same version pinning
without the disk cost, at the price of a cache lookup per deploy. Swapping is a
one-line change if the owner prefers the lighter option.

**Artifacts:** tracked file count 75 → 73 before adding the new spec (net 74).
**Evaluation:** R21 complete and green. `npm run deploy` is wired but **not
executed** — deploying is a publish action and awaits approval.
**Commit:** `32501d6` (local at the time of that entry)

---

### 2026-10-22 — R21 published; first run of the single-cycle sequence

**Gate:** owner replied **"ok"**
**Commands run** — the new `AGENTS.md` step 11 order, executed top to bottom:

    git push origin main
    npm run build
    npm run deploy
    set PLAYWRIGHT_BASE_URL=https://project-006-e6ae1.web.app && npx playwright test
    git push origin main          # evidence commit
    npm run changelog
    npm run sync:changes
    npm run verify:changes

**Results:**

| Step | Result | Notes |
| --- | --- | --- |
| Secret scan | clean | Firebase key only in git-ignored `.env` |
| Push code commit | pass | `193a696..32501d6` |
| Build | pass | 90.2 kB JS / 4.0 kB CSS gzipped (budgets 150 / 25 kB) |
| Deploy via `npm run deploy` | pass | Pinned `firebase-tools@15.34.1`, 10 files, release complete — **no `npx -y` resolution** |
| Production suite | **43 passed, 1 skipped** | The one skip is the dev-only r16 hook, excluded against remote URLs by design |
| Evidence commit + push | pass | step 3 of the new sequence |
| Single change-log cycle | pass | one regenerate → sync → verify → commit → push |

**Process change verified in practice.** This release used **one** change-log
cycle instead of two. Previously each publish produced four commits (feat →
chore → docs → chore); this one produces three (feat → docs → chore), with one
sync instead of two. The end state is unchanged and expected: the final
changelog commit cannot contain itself, so the repository remains exactly one
commit ahead of Firestore — which was equally true under the old double cycle,
where the extra commit bought no coverage.

**Artifacts:**
- GitHub: `32501d6` (R21 code) → evidence commit → changelog commit
- Live: https://project-006-e6ae1.web.app
- Firestore `changeLog`: synced and read-back verified

**Evaluation:** R21 published. Approval gate observed; the six cleanup items are
live, and the single-cycle publish path is proven rather than merely documented.

---

### 2026-10-22 — Deploy tooling footprint (R22)

**Scope:** Keep the Firebase CLI version pin while removing it from project
dependencies, so `npm install` no longer fetches it or its dependency tree.
**Test cases:** TC-2201–TC-2205, plus the full regression suite
**Commands run:**

    npm uninstall firebase-tools
    npx --yes firebase-tools@15.34.1 --version        (cold, then warm)
    npm run build
    npm run lint
    npx playwright test
    npm ls firebase-tools --depth=0

**Results:**

| Test case | AC | Result | Evidence |
| --- | --- | --- | --- |
| TC-2201 | R22.2 | pass | `npm ls firebase-tools --depth=0` reports it absent; also gone from `package-lock.json` |
| TC-2202 | R22.3 | pass | `npx --yes firebase-tools@15.34.1 --version` → `15.34.1` (cold 161.5 s to download, warm 6.7 s) |
| TC-2203 | R22.1, R22.4 | pass | Script reads `npx --yes firebase-tools@15.34.1 deploy --only hosting --project project-006-e6ae1 --non-interactive` — pin, target, and flag all preserved |
| TC-2204 | R22.5 | pass | `node_modules` **456 MB → 260 MB** (−196 MB, −43%) |
| TC-2205 | R22.5 | pass | Build and lint clean; **44 passed, 0 skipped**; 90.2 kB JS / 3.95 kB CSS gzipped |

**Where the size actually went — stated honestly.** The 196 MB did not vanish; it
moved off the project and into the machine-level npx cache
(`%LOCALAPPDATA%\npm-cache\_npx`, now 201 MB, shared by every project on this
machine). The real gains are per project: a fresh clone plus `npm install` no
longer pulls ~190 MB, `node_modules` is 43% smaller, and the version stays
exactly pinned. The costs are that the **first** deploy on a cold machine takes
about 2.5 extra minutes, and a warm resolution costs ~6.7 s instead of nothing.

**Side finding, not fixed (outside this task's scope):** `tests/r1-home.spec.ts`
and `tests/r18-header.spec.ts` write screenshots into the tracked
`evidence/screenshots/` directory, so every test run leaves three modified
binaries in the working tree. They were regenerated during this run and
**reverted** so this commit contains only R22 changes. Worth deciding later:
either treat those as build artifacts and redirect them to `test-results/`, or
refresh them deliberately in a dedicated evidence commit.

**Artifacts:** none new.
**Evaluation:** R22 complete and green. No deploy was run — `npm run deploy` is
wired and verified to resolve, but deploying is a publish action.
**Commit:** `4ad3631` (local at the time of that entry)

---

### 2026-10-22 — R22 published; npx-pinned deploy proven end to end

**Gate:** owner replied **"ok"**
**Commands run** — one change-log cycle, per `AGENTS.md` step 11:

    git push origin main
    npm run build
    npm run deploy
    set PLAYWRIGHT_BASE_URL=https://project-006-e6ae1.web.app && npx playwright test
    git push origin main          # evidence commit
    npm run changelog
    npm run sync:changes
    npm run verify:changes

**Results:**

| Step | Result | Notes |
| --- | --- | --- |
| Secret scan | clean | Key only in git-ignored `.env` |
| Push code commit | pass | `039d0af..4ad3631` |
| Build | pass | 90.2 kB JS / 3.95 kB CSS gzipped |
| **Deploy via `npm run deploy`** | **pass** | Ran `npx --yes firebase-tools@15.34.1` with **no project dependency installed** — 10 files, release complete, **29.5 s total** |
| Production suite | **43 passed, 1 skipped** | Skip is the dev-only r16 hook |
| Evidence commit + push | pass | |
| Single change-log cycle | pass | one regenerate → sync → verify → commit → push |

**What this proves:** AC22.1 and AC22.4 are verified by a real deploy, not by
reading the script. The deploy ran with `firebase-tools` absent from
`node_modules`, resolved the pinned `15.34.1` from the shared npx cache, and
released the same 10 files to the same project. Total overhead against the old
local-binary path: about 7 s of resolution inside a 29.5 s deploy.

**Screenshots reverted again:** the production run rewrote the three tracked
evidence PNGs (`r1-hero`, `r18-header-light`, `r18-header-dark`) because those
specs save directly into `evidence/screenshots/`. They were reverted so this
commit contains only R22 publish records. The open decision from the R22 entry
still stands.

**Artifacts:**
- GitHub: `4ad3631` → evidence commit → changelog commit
- Live: https://project-006-e6ae1.web.app
- Firestore `changeLog`: synced and read-back verified

**Evaluation:** R22 published. `node_modules` is 196 MB lighter, the CLI stays
pinned, and the lighter deploy path is confirmed in production.

---

### 2026-10-22 — Blog detail page (R23)

**Scope:** `/blog/<slug>` with a header image, Markdown prose at a comfortable
measure, a sticky action rail (Like / Share / Bookmark), a comment section, and
related articles.
**Test cases:** TC-2301–TC-2320, plus the full regression suite
**Commands run:**

    npm install marked
    npm run build
    npm run lint
    npx playwright test

**Results:**

| Test case | AC | Result | Notes |
| --- | --- | --- | --- |
| TC-2301 | R23.1 | pass | Card click → `/blog/mixture-of-experts`; heading matches the card title |
| TC-2302 | R23.2 | pass | Unknown slug → "Article not found" with links home and to the list; no article title rendered |
| TC-2303 | R23.3 | pass | `document.title` contains the article title, and navigating away restores the previous title |
| TC-2304 | R23.4 | pass | Cover image visible, `naturalWidth > 0`, bounding box above the prose |
| TC-2305 | R23.5 | pass | Prose contains real `h2`, multiple `p`, `ul li`, and `blockquote` |
| TC-2306 | R23.6 | pass | Column 480–880 px; font-size 17 px; line-height ratio 1.75 |
| TC-2307 | R23.7 | pass | At 360 px the rail's `flex-direction` is `row`; zero horizontal overflow |
| TC-2308 | R23.8 | pass | `<aside aria-label="Article actions">` with Like, Share, Bookmark |
| TC-2309 | R23.9 | pass | `position: sticky`; after `scrollTo(0, 900)` the rail stays under the header (y < 220) |
| TC-2310 | R23.10 | pass | `aria-pressed` false→true→false, count 128→129→128, accessible name changes with state |
| TC-2311 | R23.11 | pass | Share sets the `role="status"` region to a copied / URL message containing the slug |
| TC-2312 | R23.12 | pass | Bookmark `aria-pressed` false→true |
| TC-2313 | R23.13 | pass | All three rail buttons have non-empty accessible names |
| TC-2314 | R23.15 | pass | Comment prepended, count +1, announced as "Comment posted by Ada Lovelace." |
| TC-2315 | R23.16 | pass | Empty submit → inline error, list count unchanged |
| TC-2316 | R23.17 | pass | "browser session only" notice visible |
| TC-2317 | R23.18 | pass | 1–3 related cards, current title excluded, all hrefs `/blog/<slug>` |
| TC-2318 | R23.19 | pass | Related card opens its own article |
| TC-2319 | R23.20 | pass | Prose paragraph and comment text ≥ 4.5:1 in both themes |
| TC-2320 | R23.21 | pass | 63 passed / 0 skipped; build and lint clean; 110.7 kB JS / 4.9 kB CSS gzipped |

**Latent bug found and fixed along the way:** `BlogCard.css` used
`var(--shadow-lg)` since R19, but no `--shadow-*` token was ever defined — the
hover shadow silently resolved to nothing. Added `--shadow-sm/md/lg` for both
themes in `tokens.css`; the R19 hover lift now actually casts a shadow.

**Two test defects found and fixed during the run (implementation untouched):**
1. TC-2310 located the Like button by its accessible name, but that name changes
   with state ("Like this article" → "Remove your like"), so the locator stopped
   resolving after the click. Switched to a stable class-based locator and
   asserted the name change separately.
2. TC-2314 used `getByLabel("Comment")`, which matched both the textarea and the
   `aria-labelledby` comment section. Scoped to `getByRole("textbox", …)`.

**Deliberate placeholder decisions (flagged for the owner):**
1. **Article bodies are seed content** in `src/data/postBodies.ts` — real prose,
   but authored as placeholders until R13 loads Markdown files.
2. **`marked` HTML is not sanitised.** Content is repository-authored and
   therefore trusted; `src/lib/markdown.ts` documents that this must change
   before any user-supplied Markdown is rendered.
3. **Like and Bookmark are local state only**, with an illustrative starting
   count of 128 and no server.
4. **Comments are session-only** and the UI says so; persistence needs accounts
   and locked-down Firestore rules.
5. **Share falls back to showing the URL** when the Clipboard API is blocked, so
   the action still works without permissions.

**Artifacts:** none new.
**Evaluation:** R23 complete and green.
**Commit:** local only — **awaiting owner approval before push/deploy**


---

### 2026-10-22 � R23 published

**Approval:** owner replied "push to github and deploy it in my firebase" after
reviewing the local build.
**Scope:** R23 � blog detail page.
**Commands run, in order:**

    git status --short          # clean
    git ls-files | Select-String -Pattern "^\.env$|serviceAccount|\.pem$|\.key$"
    git grep -n -I -E "AIza[0-9A-Za-z_-]{35}" -- . ':!evidence.md'
    git grep -n -I "BEGIN PRIVATE KEY" -- .
    git push origin main
    npm run build
    npm run deploy
    $env:PLAYWRIGHT_BASE_URL="https://project-006-e6ae1.web.app"; npx playwright test

**Results:**

| Step | Result |
| --- | --- |
| Secret scan | No `.env`, no service account files, no `AIza�` keys, no private key blocks in tracked files |
| Push | `b8e5776..c52c8f5  main -> main`; 0 commits ahead afterwards |
| Build | Clean; 110.66 kB JS / 4.92 kB CSS gzipped (budgets 150 / 25) |
| Deploy | `hosting[project-006-e6ae1]: release complete` ? https://project-006-e6ae1.web.app |
| Production suite | **62 passed, 1 skipped** (skipped = the dev-only R16 Firebase hook), exit 0 |

**Live verification:** `/blog/mixture-of-experts` renders on the deployed site �
the R23 test suite ran against `PLAYWRIGHT_BASE_URL` and passed in full, so the
route, sticky rail, comments, related articles, contrast, and mobile layout are
confirmed in production rather than only locally.

**Evaluation:** R23 published. The live site now serves the blog detail page.