# Test Cases

Every test case maps to a requirement ID in `requirements.md`.
`Type` is either `auto` (executable by Playwright) or `manual` (human check).
Results for each run are recorded in `evidence.md`.

**Status legend:** `pending` · `pass` · `fail`

## Writing a spec

When a requirement area is implemented, add a spec named after it —
`tests/r<number>-<area>.spec.ts` (for example `tests/r2-search.spec.ts`).

- Map **every** test back to its `TC-` id, and use the id in the test title so a
  failing run names the case directly.
- Assert observable behaviour, not implementation details: measured geometry,
  computed styles, navigation results, accessibility state.
- Add a new row here first, then write the test. If a case cannot be automated,
  label it `manual` rather than skipping it silently.
- Do not leave permanently-skipped specs in the suite; a skip must be a
  deliberate, documented condition (for example, a dev-only hook that cannot run
  against a remote URL).

---

## R0 — Project scaffold and tooling

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-001 | auto | Run `npm run dev` | Server starts on 127.0.0.1:5173, no errors |
| TC-002 | auto | Run `npm run build` | Build succeeds, zero TypeScript errors |
| TC-003 | auto | Run `npm run lint` | Zero warnings |
| TC-004 | auto | Run `npx playwright test` | Tests run, HTML report produced |
| TC-005 | manual | Run `git log --oneline` | Initial commit contains the workflow docs |

## R1 — Home page (hero)

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-101 | auto | Open `/` | Headline "Explore the Future of AI", a description, and a "Start Reading" button linking to `/blog` |
| TC-102 | auto | Open `/`, sample the network canvas twice, 400ms apart | Canvas exists with non-zero size and its pixels change between samples (it is animating) |
| TC-103 | auto | Open `/`, inspect `.topic-card` | Card is visible, has a float animation (`animation-name` ≠ `none`), and its topic text changes after the rotation interval |
| TC-104 | auto | Open `/` with `prefers-reduced-motion: reduce` | Canvas pixels do not change between samples; card float animation is `none` |
| TC-105 | auto | Set viewport to 360×800, open `/` | Card renders below the text; no horizontal overflow |
| TC-106 | auto | Open `/` in both themes | Headline and description contrast ≥ 4.5:1 against the page background |

## R1 — Home page (below the hero — later increments)

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-107 | auto | Open `/` | *(superseded by R19)* |
| TC-108 | auto | Open `/` | *(superseded by R19)* |
| TC-109 | auto | Open `/` | *(superseded by R19)* |

## R19 — Home main content layout

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-1901 | auto | Open `/` at 1440px | Two columns exist; article column width is ≈70% of the pair (between 60% and 80%) |
| TC-1902 | auto | Open `/` at 1440px | Article grid renders cards in 2 columns and shows posts newest-first |
| TC-1903 | auto | Inspect the first card | Contains a cover image, category badge, title, "N min read", author avatar + name, and a bookmark button |
| TC-1904 | auto | Hover a card | Card `transform` becomes a translateY lift and the image `scale` > 1 |
| TC-1905 | auto | Hover a card with `prefers-reduced-motion: reduce` | No transform lift is applied |
| TC-1906 | auto | Open `/` | Sidebar contains a Trending Topics section, a search input, and quick-filter controls |
| TC-1907 | auto | Type "prompt" in the sidebar search | Grid narrows to matching posts; count updates |
| TC-1908 | auto | Click the "Featured" quick filter | Grid shows only featured posts; filter is marked active |
| TC-1909 | auto | Click a card's bookmark button | `aria-pressed` flips from false to true |
| TC-1910 | auto | Search for a nonsense term | Empty state message is shown instead of a blank column |
| TC-1911 | auto | Set viewport to 360×800 | Layout is a single column, articles above sidebar, no horizontal overflow |
| TC-1912 | auto | Open `/` in both themes | Card title and excerpt contrast ≥ 4.5:1 |

## R2 — Blogs list with search and filters

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-201 | auto | Open `/blog` | All posts listed newest first; each shows title, excerpt, date, reading time, category, and tags (AC2.1) — **@smoke** |
| TC-202 | auto | Type `PROMPTING` in the search box | Only the Prompting post remains; matching is case-insensitive; URL contains `?q=PROMPTING` (AC2.2, AC2.4) |
| TC-203 | auto | Type `routing` in the search box | Only the post whose excerpt mentions routing remains; count updates (AC2.2) |
| TC-204 | auto | Click the "News" topic chip | Only News posts shown; chip is active; URL contains `?topic=news` (AC2.3, AC2.4) |
| TC-205 | auto | Click "All" | Topic filter cleared; all posts shown again (AC2.3) |
| TC-206 | auto | Type a nonsense term (`zzzz`) | Empty-state message shown (AC2.5) |
| TC-207 | auto | Apply any filter | Displayed count ("N posts") equals the number of rendered cards (AC2.6) |
| TC-208 | auto | Load `/blog?topic=news` directly | Page opens with the News chip active and only News posts shown (AC2.4) |
| TC-209 | auto | Click the `#models` tag chip, then reload | 3 cards; the chip stays active; the URL still contains `?tag=models` (AC2.4, AC2.7) |
| TC-210 | auto | Load `/blog?q=small%20local&topic=guides&tag=prompting`, then search `small vision` | First view: exactly 1 post with all three params retained; second: empty state — every search term must match (AC2.2, AC2.4) |

## R3 — Post detail page

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-301 | auto | Open `/blog/mixture-of-experts` | Markdown rendered: headings, lists, code block, blockquote present |
| TC-302 | auto | Open a post | Category, date, and reading time are shown |
| TC-303 | auto | Open a post | Table of contents lists h2/h3 headings; clicking an entry scrolls to that heading |
| TC-304 | auto | Open the oldest post | "Older post" link points to the next older post |
| TC-305 | auto | Open the newest post | "Newer post" link is absent (no newer post) |
| TC-306 | auto | Open a post | "Related posts" section shows up to 2 related posts |
| TC-307 | auto | Open a post | Each tag links to `/tags/<tag>` |

## R4 — Categories index

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-401 | auto | Open `/categories` | Every category listed with its post count |
| TC-402 | auto | Click a category card | Navigates to `/categories/<slug>` |

## R5 — Category detail page

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-501 | auto | Open `/categories/research` | Category name and post count shown; only Research posts listed |
| TC-502 | auto | Open `/categories/does-not-exist` | 404 page is shown |

## R6 — Tag detail page

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-601 | auto | Open `/tags/models` | Tag name and post count shown; only posts with that tag listed |
| TC-602 | auto | Open `/tags/does-not-exist` | 404 page is shown |

## R7 — About page

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-701 | auto | Open `/about` | Content explains the site; links to `/blog` and `/categories` exist |

## R8 — 404 page

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-801 | auto | Open `/no-such-page` | "404" indicator and message shown |
| TC-802 | auto | On the 404 page | Links to `/blog` and `/` exist and work |

## R9 — Theme toggle

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-901 | auto | Click the theme toggle | `data-theme` on `<html>` flips between `light` and `dark` |
| TC-902 | auto | Toggle theme, reload the page | Theme persists after reload |
| TC-903 | manual | Clear stored preference, set OS to dark | First visit renders in dark theme |
| TC-904 | auto | Compare body background color in both themes | Background color differs between light and dark |

## R10 — Responsive layout

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-1001 | auto | Set viewport to 360×800, visit every route | No horizontal overflow; content readable |
| TC-1002 | auto | Set viewport to 768×1024 and 1920×1080, visit every route | Layout adapts, no overflow |
| TC-1003 | auto | At 360px | Navigation and search remain reachable |

## R11 — Accessibility

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-1101 | auto | Press Tab from page load | Skip link becomes visible and focuses `#main` |
| TC-1102 | auto | Tab through header, filters, and footer | Every interactive element receives a visible focus indicator |
| TC-1103 | auto | Inspect landmarks | `header`, `nav`, `main`, `article`, `footer` all present |
| TC-1104 | manual | Check text contrast in both themes | Meets WCAG 2.1 AA (4.5:1 for body text) |

## R12 — SEO basics

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-1201 | auto | Visit each route | Unique `<title>` and meta description per page |
| TC-1202 | auto | Request `/sitemap.xml` and `/robots.txt` | Both return 200 with valid content |
| TC-1203 | auto | Inspect `<head>` | Open Graph title and description tags present |

## R13 — Content model

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-1301 | auto | Add a new `.md` post with frontmatter | Post appears in lists with no code changes |
| TC-1302 | auto | Compare displayed reading time with word count | Reading time is plausible (≈200 wpm) |
| TC-1303 | auto | Check list ordering on `/` and `/blog` | Newest first |

## R14 — Performance budget

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-1401 | auto | Run `npm run build` | JS bundle < 150 kB gzipped (reported in build output) |
| TC-1402 | auto | Run `npm run build` | CSS bundle < 25 kB gzipped |
| TC-1403 | auto | Load `/` with console capture | No console errors |

## R15 — Site header (SUPERSEDED by R18 — cases below are historical)

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-1501 | auto | Open `/` | `<header>` landmark visible; site brand links to `/` |
| TC-1502 | auto | Open `/` | Nav links: Home→`/`, AI Updates→`/blog`, Categories→`/categories`, About→`/about` |
| TC-1503 | auto | Open `/` | Exactly one nav link is active, matching the current route |
| TC-1504 | auto | Open `/` | Exactly one `<header>` landmark on the page |

## R18 — Glassmorphism header

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-1801 | auto | Inspect `.site-header` computed style | `backdrop-filter` includes a blur; background-color is semi-transparent; a border is present |
| TC-1802 | auto | Open `/` | Logo mark plus brand text "AI Pulse" visible, linking to `/` |
| TC-1803 | auto | Open `/` | Nav links Home→`/`, Topics→`/topics`, Blogs→`/blog`, About→`/about`; a `:hover` rule with a gradient exists for nav links |
| TC-1804 | auto | Open `/` | Search control links to `/blog` |
| TC-1805 | auto | Click the theme toggle | `data-theme` flips; body background color changes; choice persists after reload |
| TC-1806 | auto | First visit with no stored theme, OS set to dark | Page renders in dark theme (manual variant TC-903) |
| TC-1807 | auto | Open `/` | Sign In links to `/signin`, Sign Up links to `/signup` |
| TC-1808 | auto | Visit `/signin`, `/signup`, `/topics`, `/blog`, `/about` | Each renders a real page with a heading — none is blank |
| TC-1809 | auto | Open `/` in both themes | Nav link text contrast ≥ 4.5:1 against the page background |
| TC-1810 | auto | Open `/` | Exactly one nav link is active, matching the current route |
| TC-1811 | auto | Inspect the logo's CSS | A glow animation is defined, and a `prefers-reduced-motion` rule disables it |
| TC-1812 | auto | Run `npm run build` and `npm run lint` | Both pass; the home page test still passes |

## R16 — Firebase integration

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-1601 | auto | Run `npm run build` | Passes; `firebase.ts` type-checks under strict mode |
| TC-1602 | auto | Run `npm run lint` | Zero warnings |
| TC-1603 | auto | Check `.env.example` exists and `git check-ignore .env` succeeds | All `VITE_FIREBASE_*` variables documented; `.env` is ignored by git |
| TC-1604 | auto | Inspect `firebase.json` | Valid JSON; `public` is `dist`; SPA rewrite `**` → `/index.html` present |
| TC-1605 | auto | Inspect `.firebaserc` | Valid JSON with a `projects.default` entry |
| TC-1606 | auto | Open `/`, monitor network requests | Page renders, no uncaught errors, and **zero** Firebase assets requested |
| TC-1607 | auto | Open `/`, call `window.__getFirebase()` | Resolves with `app`, `auth`, `db`, `storage` initialized against the real project. **Dev-server only** — the hook is stripped from production builds |
| TC-1608 | manual | Run `npx firebase deploy --only hosting` | Site deploys and loads from the Firebase Hosting URL |

## R14 — Performance budget (updated cases)

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-1404 | auto | Open `/`, monitor network requests | No request path matches `/firebase/i` — the SDK is not in the initial load |
| TC-1405 | auto | Run `npm run build` and sum gzipped JS | Total initial JS < 150 kB gzipped |

## R17 — Change log export

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-1701 | auto | Run `npm run changelog` | Valid JSON; every commit in `git log` is present; file lists match `git show --name-status` |
| TC-1702 | auto | Run the sync script with no credentials | Exits non-zero with a clear "missing credentials" message |
| TC-1703 | manual | Fill `.env`, run `npm run sync:changes` | Documents appear in the Firestore `changeLog` collection |
| TC-1704 | auto | Run `npm run sync:changes` twice | Second run adds 0 new documents (no duplicates) |

## R20 — Footer and newsletter subscription

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-2001 | auto | Open `/` | A newsletter box renders directly above the footer, containing an email input and a Subscribe button |
| TC-2002 | auto | Submit the newsletter form with an invalid email (e.g. `not-an-email`) | Inline error is shown, `aria-invalid="true"` on the field, no success message |
| TC-2003 | auto | Submit the newsletter form with `reader@example.com` | Success message appears, announced in a live region, and the field is cleared |
| TC-2004 | auto | Inspect the email field and its messages | Field has an accessible label; error/success text is referenced by `aria-describedby` |
| TC-2005 | auto | Inspect the footer | Exactly four columns exist: brand, Quick Links, AI Categories, Social Links |
| TC-2006 | auto | Click each Quick Link | Navigates client-side to Home, Blogs, Topics, About without a full reload |
| TC-2007 | auto | Inspect the AI Categories column | Lists AI categories, each linking to a `/topics/:slug` route |
| TC-2008 | auto | Inspect the Social Links column | X, GitHub and LinkedIn links exist, each has an accessible name, `target="_blank"` and `rel` containing `noopener` |
| TC-2009 | auto | Inspect the bottom bar | Shows the current year in the copyright notice and a Privacy Policy link |
| TC-2010 | auto | Click the Privacy Policy link | Resolves to a real route (`/privacy`) that renders content, not a dead `#` |
| TC-2011 | auto | Set viewport to 360×800 | Footer columns stack to one column; no horizontal overflow |
| TC-2012 | auto | Open `/` in both themes | Footer body text contrast ≥ 4.5:1 |

## R21 — Repository and workflow hygiene

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-2101 | auto | Run `git ls-files` and read `.gitignore` | No `.firebase/` entry is tracked; `.gitignore` contains `.firebase/` |
| TC-2102 | auto | Check for `tests/example.spec.ts`; read `test-cases.md` | The file is gone and the spec-writing convention is documented in `test-cases.md` |
| TC-2103 | auto | Run `npx playwright test` | Report shows 0 skipped tests |
| TC-2104 | manual | Read `AGENTS.md` step 11 | Describes one change-log cycle per release (no second regenerate/sync/commit) |
| TC-2105 | auto | Run `npm ls firebase-tools` and `npx --no-install firebase --version` | Pinned in devDependencies; the pinned binary runs without network resolution |
| TC-2106 | auto | Open `/`, list all links named like the brand | The header and footer home links expose different accessible names |
| TC-2107 | auto | Run `npm run build`, `npm run lint`, `npx playwright test` | All green; JS and CSS stay under 150 kB / 25 kB gzipped |

## R22 — Deploy tooling footprint

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-2201 | auto | Run `npm ls firebase-tools --depth=0` | Not present as a project dependency |
| TC-2202 | auto | Run `npx --yes firebase-tools@15.34.1 --version` | Prints `15.34.1` |
| TC-2203 | auto | Read the `deploy` script in `package.json` | Uses `npx --yes firebase-tools@15.34.1`, keeps `--only hosting`, `--non-interactive`, and the project id |
| TC-2204 | auto | Measure `node_modules` before and after | Size drops materially |
| TC-2205 | auto | Run `npm run build`, `npm run lint`, `npx playwright test` | All green |

## R23 — Blog detail page

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-2301 | auto | Click the first card on `/` | URL becomes `/blog/<slug>` and the article heading matches the card title |
| TC-2302 | auto | Open `/blog/does-not-exist` | Not-found state with a link back home; no article body |
| TC-2303 | auto | Open an article | `document.title` contains the article title |
| TC-2304 | auto | Open an article | A header image is visible and sits above the prose body |
| TC-2305 | auto | Open an article | Prose contains real `h2`, `p`, `ul li`, and `blockquote` elements |
| TC-2306 | auto | Measure the prose column at 1440px | Width is a readable measure and `line-height` ≥ 1.6, `font-size` ≥ 16px |
| TC-2307 | auto | Set viewport to 360×800, open an article | Rail becomes a horizontal bar; no horizontal overflow |
| TC-2308 | auto | Open an article | A rail labelled "Article actions" contains Like, Share and Bookmark buttons |
| TC-2309 | auto | Scroll the article body 900px | Rail is `position: sticky` and still within the viewport |
| TC-2310 | auto | Click Like twice | `aria-pressed` flips false→true→false and the count changes with it |
| TC-2311 | auto | Click Share | A live region reports the outcome (copied, or the URL to copy) |
| TC-2312 | auto | Click Bookmark | `aria-pressed` flips from false to true |
| TC-2313 | auto | Inspect the three rail buttons | Each has a non-empty accessible name |
| TC-2314 | auto | Submit a comment with a name | Comment appears at the top of the list and the live region announces it |
| TC-2315 | auto | Submit with an empty name or empty comment | Inline error shown; comment count unchanged |
| TC-2316 | auto | Open an article | A visible notice says comments are not persisted |
| TC-2317 | auto | Inspect related articles | 1–3 cards shown, none matching the current article's title, each linking to `/blog/<slug>` |
| TC-2318 | auto | Click a related card | Navigates to that article |
| TC-2319 | auto | Open an article in both themes | Prose body and comment text contrast ≥ 4.5:1 |
| TC-2320 | auto | Run `npm run build`, `npm run lint`, `npx playwright test` | All green; bundle within budget |

## R24 — Sign in and sign up pages

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-2401 | auto | Open `/signin` and `/signup` | Both render an auth card with a heading; no "Coming soon" placeholder |
| TC-2402 | auto | Inspect each card | Email input, password input, "Sign in with Google" button, submit button all present |
| TC-2403 | auto | Read `document.title` on each page | Title matches the page; navigating away restores the previous title |
| TC-2404 | auto | Read computed style of the card | Background is semi-transparent (alpha < 1), `backdrop-filter` contains `blur`, border and shadow present |
| TC-2405 | auto | Count glow layers behind the card | Glow elements exist, are `aria-hidden`, and are `pointer-events: none` |
| TC-2406 | auto | Submit with every field empty | Two inline errors, nothing submitted, live region stays empty |
| TC-2407 | auto | Enter `not-an-email` + short password, submit | Email error mentions a valid address; password error mentions the 8-character minimum |
| TC-2408 | auto | Inspect an invalid field | `aria-invalid="true"` and `aria-describedby` pointing at the error, which has `role="alert"` |
| TC-2409 | auto | Fix the email after an error | Email error disappears while the password error remains |
| TC-2410 | auto | Inspect the two password fields | `autocomplete` is `current-password` on `/signin`, `new-password` on `/signup` |
| TC-2411 | auto | Submit valid credentials | Live region reports the not-connected outcome; no success wording |
| TC-2412 | auto | Click "Sign in with Google" | The same live region reports the not-connected outcome |
| TC-2413 | auto | Click the password toggle twice | `type` switches password→text→password and `aria-pressed` follows |
| TC-2414 | auto | Click the switch link on each page | `/signin` → `/signup` and `/signup` → `/signin` |
| TC-2415 | auto | Import scan of `src/pages/AuthPage.tsx` | Auth calls come only from `src/lib/auth.ts` |
| TC-2416 | auto | Set viewport to 360×800 on both pages | No horizontal overflow; card fits within the viewport |
| TC-2417 | auto | Open both pages in both themes | Title, label, helper and link text ≥ 4.5:1 against the composited card colour |
| TC-2418 | auto | Run `npm run build`, `npm run lint`, `npx playwright test` | All green; bundle within budget |

## R25 — Test runs must not mutate committed evidence

> Auto cases TC-2502–TC-2505 were consolidated into TC-3004 by R30.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-2501 | cli | Run `npx playwright test`, then `git status --short` | No output — the tree is unchanged |
| TC-2502 | auto | Assert the capture target with no env var set, then list `test-results/screenshots/` after a run | Helper resolves to `test-results/screenshots/`; the three captures exist there |
| TC-2503 | auto | Grep every spec for screenshot writes | Each capture goes through `screenshotPath(...)`; none names an `evidence/` path |
| TC-2504 | auto | Grep every spec for the literal tracked evidence path | No spec contains it |
| TC-2505 | auto | Read `.gitignore` | No rule ignores `evidence/`; `test-results/` is ignored |
| TC-2506 | cli | Check `git ls-files evidence/screenshots` | The proof images are tracked |
| TC-2507 | manual | Run `npm run evidence:screenshots` deliberately, then `git status --short` | The three images are modified, proving refresh is possible on demand; revert afterwards |
| TC-2508 | cli | Run the full suite twice | Green both times; tree clean after each |

## R26 — `AGENTS.md` current state

> Auto cases TC-2601–TC-2604 were consolidated into TC-3002 by R30.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-2601 | auto | Read Section 9 of `AGENTS.md` | It names the most recent published requirement, and that ID is the highest one listed as published |
| TC-2602 | auto | Read Section 9 | R15 is still described as superseded by R18, not deleted |
| TC-2603 | auto | Cross-read every `### R#` heading in `requirements.md` against Section 9 | Each requirement is either listed as published or still in the not-yet-built set |
| TC-2604 | auto | Compare the bundle figure in `AGENTS.md` with the latest evidence entry | Within 1 kB on both JS and CSS |

## R27 — Published-site smoke subset

> Auto cases TC-2701–TC-2704 were consolidated into TC-3003 by R30.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-2701 | auto | Read every spec title carrying `@smoke` and compare with `SMOKE_SUITE` in `tests/helpers/smoke.ts` | The two sets are identical — no tagged test is undeclared and no declared test is untagged |
| TC-2702 | auto | Collect the `covers` field of every manifest entry | Each required route class (home, blog list, topics, about, article, unknown slug, auth, 404) appears at least once |
| TC-2703 | auto | Count the tagged tests and all declared tests | Smoke count is between 6 and 12, and strictly smaller than the full suite |
| TC-2704 | auto | Read `package.json` and `scripts/verify-prod.mjs` | `verify:prod` exists, passes `--grep` with `@smoke`, forces `--retries=0`, and demands `PLAYWRIGHT_BASE_URL` |
| TC-2705 | cli | Run `npm run verify:prod` with `PLAYWRIGHT_BASE_URL` unset | Exits non-zero and prints the variable that is required; no browser is launched |
| TC-2706 | cli | Set `PLAYWRIGHT_BASE_URL` to the live site and run `npm run verify:prod` | Only the tagged tests run, all pass, and the elapsed time is well under a full run |
| TC-2707 | cli | Run `npx playwright test --list`, then `npx playwright test --grep @smoke --list` | The full suite declares every test (88 before R27, plus the R27 guards); the smoke selection is exactly 8 |
| TC-2708 | cli | Run the full suite locally, then `git status --short` | All tests green; tree clean (R25 still holds) |

## R28 — One branch per requirement

> Auto cases TC-2801–TC-2804 were consolidated into TC-3005 by R30.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-2801 | auto | Read Section 2 step 0 and Section 4 of `AGENTS.md` | They require one branch per requirement, name the `<type>/r<N>-<slug>` pattern with all four types, and forbid editing `main` directly |
| TC-2802 | auto | Read the Section 2 publish steps | The branch is pushed and deployed first; `main` is moved last with `git merge --ff-only` |
| TC-2803 | auto | Read the non-fast-forward note in Section 2 | It requires rebasing and re-verifying, and forbids force-push and merge commits |
| TC-2804 | auto | Read Section 3 | Pushing a work branch is explicitly not publishing; merge, deploy and sync stay gated on approval |
| TC-2805 | cli | Run `git branch --show-current` during development | Matches `^(feature\|fix\|chore\|docs)/r[0-9]+-[a-z0-9-]+$` |
| TC-2806 | cli | Run `git rev-list --count HEAD..main` while working | 0 — the branch is ahead of `main`, never behind it |
| TC-2807 | cli | After publishing: compare `git rev-parse main` with `git rev-parse HEAD`, then `git log --merges --oneline main` | Same commit; no merge commits on `main` |

## R29 — Live authentication (Google and email/password)

The email/password cases run end to end against the real project, using an
account created by the suite and deleted when the run ends (TC-2905). The
Google flow needs a real Google account and a human consent screen, so it is
`manual` and recorded in evidence.md.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-2901 | auto | Load `/` as a signed-out visitor | The header shows Sign In and Sign Up links and no Sign out button |
| TC-2902 | auto | Grep every `src/**/*.ts(x)` file for `firebase/auth` imports | Only `src/lib/auth.ts` and `src/lib/firebase.ts` match (AC29.7) |
| TC-2903 | auto | Fill `/signup` with a fresh address and a strong password, submit | The page leaves for `/`; the header shows the account and a Sign out button; a reload keeps the visitor signed in (AC29.1) |
| TC-2904 | auto | Sign in on `/signin` with the TC-2903 account, then use Sign out in the header | Lands signed in; after sign out the header shows Sign In again, and a reload does not restore the session (AC29.2, AC29.3) |
| TC-2905 | auto | After the run, attempt to sign in as the test account, then delete it | The sign-in succeeds before deletion and fails afterwards — the account did not survive the run (AC29.10) |
| TC-2906 | manual | On the deployed site, click "Sign in with Google" and complete the consent screen | The pop-up opens, the chosen Google account is signed in, the header shows it, and a reload keeps the session (AC29.4) |
| TC-2907 | cli | Run `npm run build`, then inspect the chunk report and `dist/assets` | Build passes; the entry chunk contains no `firebase/auth`; JS < 150 kB and CSS < 25 kB gzipped (AC29.6) |
| TC-2908 | auto | Block the Firebase SDK chunks and load `/` | The home page renders completely, reports no page errors, and behaves as signed out (AC29.8) |
| TC-2909 | cli | Run the full suite locally, then `git status --short` | Every test green; the working tree is unchanged afterwards (R25 still holds) |
| TC-2910 | manual | In the Firebase console, check the sign-in providers page | Email/Password and Google are both listed as enabled |

## R30 — Lean loop and consolidated workflow guards

The R25–R28 auto guards were sixteen tests across four files; R30 carries the
same assertions in six tests in one file (`tests/workflow-guards.spec.ts`).
The R25–R28 CLI cases stay where they are — they assert on real run and git
state and are recorded in evidence.md.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-3001 | auto | Read Section 2 of `AGENTS.md` | States the fast loop, the one-full-run gate, re-run-only-the-affected-spec, the four-TC cap with cite-don't-duplicate, and the short evidence entry (AC30.1–AC30.3) |
| TC-3002 | auto | Read Section 9 against `requirements.md` and the latest `evidence.md` entry | Latest published requirement named and matching the newest publish entry; every requirement accounted for; superseded ones kept; bundle figure within 1 kB (was TC-2601–TC-2604) |
| TC-3003 | auto | Compare `@smoke`-tagged tests with `SMOKE_SUITE`, check coverage and size, read `package.json` and `scripts/verify-prod.mjs` | Sets agree, every required route class covered, 6–12 members, `verify:prod` demands `PLAYWRIGHT_BASE_URL` and forbids retries (was TC-2701–TC-2704) |
| TC-3004 | auto | Read `tests/helpers/screenshots.ts`, every spec, and `.gitignore` | Captures default to `test-results/screenshots/`, all go through `screenshotPath()`, no spec names a tracked evidence path, `evidence/` stays tracked and `test-results/` ignored (was TC-2502–TC-2505) |
| TC-3005 | auto | Read Sections 2, 3 and 4 of `AGENTS.md` | One branch per requirement with all four types, `main` never edited directly, `--ff-only` publish, rebase-and-re-verify, force-push and merge commits forbidden, pushing a branch is not publishing (was TC-2801–TC-2804) |
| TC-3006 | auto | List `tests/*.spec.ts` and read the Section 5 file map | The four retired guard specs are gone, the consolidated spec exists and carries at least six tests, and the file map names it and none of the retired four (AC30.4, AC30.5) |
| TC-3007 | cli | Run the full suite, then `git status --short` | 86 tests green; the tree is unchanged (AC30.7) |
| TC-3008 | cli | Run `npm run verify:prod` with `PLAYWRIGHT_BASE_URL` unset | Exits non-zero naming the variable; unchanged behaviour (AC30.7) |

**Consolidated by R30** (auto cases only; the CLI and manual cases above them
still stand as written): TC-2502–TC-2505 → TC-3004; TC-2601–TC-2604 →
TC-3002; TC-2701–TC-2704 → TC-3003; TC-2801–TC-2804 → TC-3005.

## R31 — User roles and the protected admin route

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-3101 | auto | Open `/admin` as a signed-out visitor | Redirects to `/signin`; no admin heading or admin content is shown (AC31.5) — **@smoke** |
| TC-3102 | auto | Sign up with a fresh email, read the role through the dev hook, then open `/admin` | `users/{uid}` exists with `role: "student"`; `/admin` redirects to `/` and no admin content appears; the header still shows the session (AC31.1, AC31.2, AC31.4) |
| TC-3103 | manual | In the Firestore console set the owner's `users/{uid}.role` to `"admin"`, reload `/admin`; also try to change your own role from the browser console | The admin page renders for the admin account; a standard account is still redirected home; the rules reject a client-side role change (AC31.3, AC31.8) |

## R32 — Admin dashboard

The signed-out and route-wiring cases run without an account. The admin-session
walkthrough needs an account promoted in the Firebase console, so it stays
`manual` for the same reason TC-3103 does — that is a console action only the
owner can perform.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-3201 | auto | Open `/admin/dashboard`, `/admin/dashboard/blogs`, `/admin/dashboard/blogs/new` and `/admin/dashboard/users` as a signed-out visitor; then open `/admin/not-a-dashboard-route` | All four dashboard routes redirect to `/signin` with no admin heading and no sidebar nav rendered, while the unknown `/admin/...` path renders the 404 page — so the redirects are the guard at work, not a missing route (AC32.2) |
| TC-3202 | auto | Read `src/App.tsx` and `src/pages/AdminDashboard.tsx` | All four dashboard routes are registered and every one is wrapped by `RequireAdmin`; the sidebar declares exactly All Blogs, Add New Blog and Manage Users, each with an accessible name and pointing at a registered route (AC32.1, AC32.2) |
| TC-3203 | manual | Sign in as the console-promoted admin, open `/admin/dashboard`, then click each sidebar item and load each route directly | Sidebar shows exactly the three items; each opens its panel and is the only item marked `aria-current="page"`; All Blogs lists every post newest first with title, category, date, read time and a working `/blog/<slug>` link; Add New Blog opens the Firestore composer — title, category, excerpt, featured image, tags and content, with the image directly above tags — and blocks an empty submit with inline field errors *(revised by R39)*; Manage Users shows the signed-in account and states that roles change in the console; at 360px the layout stacks with no horizontal overflow; all text is ≥ 4.5:1 in both themes (AC32.1, AC32.3–AC32.9) |
| TC-3204 | cli | Run `npm run build`, `npm run lint`, `npx playwright test`, then `git status --short` | Build and lint pass, the whole suite is green, the bundle stays under 150 kB JS / 25 kB CSS gzipped, and the working tree is unchanged (AC32.10) |

**Cites rather than duplicates:** TC-3101 (signed-out → `/signin`) and
TC-3102 (a standard account is redirected home and never sees admin content)
already prove the guard for the `/admin` route; TC-3201 proves the same guard
for the new route family, and the account-class behaviour is not re-proved here.

## R33 — Admin blog composer at `/admin/add-blog`

The signed-out and route-wiring cases run without an account. The composer
itself renders only for an account promoted in the Firebase console, so the
walkthrough stays `manual` for the reason TC-3103 and TC-3203 do. What can be
proved without that account is proved here by executing the draft module — the
validation and the document it builds are plain functions, so they are tested
directly rather than through a screen the suite cannot reach.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-3301 | auto | Open `/admin/add-blog` as a signed-out visitor | Redirects to `/signin`; no composer heading, no form controls and no submit button render (AC33.1) |
| TC-3302 | auto | Read `src/App.tsx`, `src/pages/AddBlog.tsx`, `src/lib/blogs.ts`, `firestore.rules`, `storage.rules` and `firebase.json`, and walk `src/**` for Storage/Firestore imports | The route is registered and wrapped in `RequireAdmin`; the form declares a labelled title input, a category select built from the shared categories, an `image/*` file input and a content textarea; only `src/lib/blogs.ts` imports `firebase/storage` and `firebase/firestore` for blogs; `blogs` is admin-only in `firestore.rules`; `blog-images/<uid>/` is admin-only, image-only and size-capped in `storage.rules`; `firebase.json` wires the storage rules (AC33.2, AC33.3, AC33.7, AC33.10, AC33.11) |
| TC-3303 | auto | Import `src/lib/blog-draft.ts` and run it | An empty draft yields a title, a category and a content error; a non-image file and an oversized file are each rejected; a valid draft builds the `blogs` document with a slug, the category, a tags array, the image URL, a reading time and the author, and no `authorEmail` or `published` flag *(revised by R37 — the collection is the published set and a public post carries no email)* (AC33.4, AC33.5, AC33.8, AC33.9) |
| TC-3304 | manual | Sign in as the console-promoted admin, open `/admin/add-blog`, fill the form, choose an image and submit; repeat once with an empty title and once with a non-image file | The chosen image is previewed, the submit control is disabled while the upload runs, and the live region reports the outcome; a document appears in the Firestore `blogs` collection with the title, category, content, `imageUrl` pointing at the uploaded file in Storage, a reading time and the signed-in account as author; the empty submit and the non-image file are blocked with inline errors and write nothing; the page states that the saved document is live *(revised by R37)* (AC33.2, AC33.4–AC33.9) |

**Cites rather than duplicates:** TC-3202 already proves that a `/admin` route
registered in `src/App.tsx` inside `RequireAdmin` is really guarded, and TC-3201
proves the signed-out redirect for a route family; TC-3301 repeats the redirect
only because it is the one browser-reachable proof for this route, and TC-3302
covers the new route's own wiring.

## R34 — The featured image upload is refused for every account

TC-3302 keeps proving the route, the fields, the single seam and the rules
files; only its Storage assertion is corrected here (`isOwnerAdmin(uid)` instead
of `isOwnerAdmin()`), because the call it asserted was the defect. The cases
below add the scope guard and the live proof; the deny path re-uses the probe
R33's publish recorded.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-3401 | auto | Read `storage.rules` and `firestore.rules`; for every `function`, collect the wildcards used inside it that are not preceded by a `.` | Every such name is a parameter of that function or a wildcard of a `match` block enclosing it — the old `isOwnerAdmin()` (reading the child `{uid}` wildcard from the bucket scope) fails this, the fixed one passes (AC34.1, AC34.2) |
| TC-3402 | auto | Read `storage.rules` | The admin check takes the uid as a parameter and all three operations pass it; the image-only and 5 MB conditions and the delete rule are intact (AC34.1) |
| TC-3403 | cli | `npm run deploy:rules`, then run the deny-path probe with a throwaway account and delete it | Both rule files release; a non-admin is refused `blogs`, an upload into its own and another folder, and self-promotion; anonymous writes are refused; the probe account is gone (AC34.3) |
| TC-3404 | manual | Sign in as the console-promoted admin, save one post with an image | The live region reports the document id; the file is in `blog-images/<uid>/`; the `blogs` document carries its `imageUrl` (AC34.4) |

## R35 — Uploads through an admin-gated Cloud Function

TC-3501 is the direction the suite can reach on its own: a real signed-in
account that is not an admin. The allow path needs an account promoted in the
console, which is TC-3504; the end-to-end version I ran with a throwaway
promoted account is recorded per publish in `evidence.md` (TC-3503).

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-3501 | auto | Create a throwaway account, call `uploadBlogImage` with a valid image payload while it has no profile, then again after writing itself a `role: "student"` profile; delete the account | Both calls return HTTP 403 with `PERMISSION_DENIED`, and no object is written (AC35.2) |
| TC-3502 | auto | Read `src/lib/blogs.ts`, `functions/index.js` and `firebase.json` | The client calls `uploadBlogImage`/`deleteBlogImage` and no longer imports `firebase/storage`; the function reads `users/{uid}.role`, requires `"admin"`, caps at 5 MB, accepts image data URLs, writes under `blog-images/<uid>/`, and `firebase.json` deploys the `functions` codebase (AC35.1, AC35.3–AC35.6, AC35.8) |
| TC-3503 | cli | With a throwaway account promoted through IAM, sign in and save a post through the composer; read the document back and fetch its `imageUrl` without credentials; delete everything | The live region reports the document id; the document carries `imageUrl`, `published: false` and the author; the image returns 200 `image/jpeg`; the probe is fully cleaned up (AC35.4, AC35.5, AC35.7) |
| TC-3504 | manual | Sign in as the console-promoted admin and save a post with an image | The image appears under `blog-images/<your uid>/`, is publicly reachable, and the document carries its URL (AC35.4, AC35.5) |

## R36 — Admin link in the account menu

The absent cases are proved in the browser: signed out, and signed in as a
throwaway **student** (the suite creates and deletes it, as TC-3102 does). The
allow case needs an account promoted in the console, so — like TC-3103 and
TC-3504 — it stays `manual`; TC-3603 proves the rendered branch is wired to the
same role seam without needing that account.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-3601 | auto | Load `/`, `/blog` and `/signin` as a signed-out visitor and inspect the header | No **Admin** link appears; an account link never replaces the signed-out controls (AC36.2) |
| TC-3602 | auto | Sign up a throwaway account, wait for its role to resolve, then inspect the header and open `/admin/dashboard`; delete the account | The account menu shows the identity and Sign out, no **Admin** link; the dashboard still redirects home; the header stays signed in (AC36.2, AC36.5) |
| TC-3603 | auto | Read `src/components/AccountMenu.tsx`, `src/hooks/useUserRole.ts` and `src/lib/users.ts` | The Admin link is a router `Link` to `/admin/dashboard` with the accessible name Admin, rendered only when `isAdminRole(role)` is true; the role comes from `useUserRole`, and the guard in `src/App.tsx` still wraps the dashboard with `RequireAdmin` (AC36.1–AC36.3, AC36.5) |
| TC-3604 | manual | Sign in as the console-promoted admin on the dev server; inspect the header at desktop width and at 360px in both themes; click Admin, then reload | The **Admin** link sits in the account area, opens `/admin/dashboard`, survives the reload, is absent for a standard account, causes no horizontal overflow at 360px, and its text measures ≥ 4.5:1 in both themes (AC36.1, AC36.3, AC36.4) |

## R37 — Saved blog posts are visible to visitors

The suite stays hermetic: every browser case that loads the archive, the home
page or an article blocks `firestore.googleapis.com`, so live content can never
change a count (the R2 and R19 guards still assert the six seed articles). R37's
browser case injects a saved document through the dev-only
`window.__savedBlogsFixture` seam, which is compiled out of the production build
— the same pattern as the existing `window.__getFirebase` hook (TC-1607). The
real read is exercised by the owner against the project's own data (TC-3705),
because the admin account needed for a signed-in read is console-managed.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-3701 | auto | Import `src/lib/blog-posts.ts` and `src/lib/markdown.ts`; run `savedBlogToPost`, `mergePosts` over a document shaped like a Firestore `blogs` record and the seed list, then render raw HTML, a `javascript:` link and a `javascript:` image inside otherwise valid Markdown | The record becomes a `Post`: title, slug (stored, or derived), category, excerpt (or the content opening), tags, reading time, author name and initials, cover (`imageUrl` or the default), and date from a Firestore `Timestamp` (seconds or `toDate()`), an ISO string or a `Date`; `authorEmail` is not carried; a slug collision keeps the saved post; the merged list is newest first with undated posts last; raw HTML is escaped, an unsafe link has no `href`, an unsafe image does not become an `<img>`, and headings, paragraphs, lists and blockquotes still render (AC37.1, AC37.3, AC37.7, AC37.8) |
| TC-3702 | auto | Seed the dev fixture with one saved post, then load `/`, `/blog`, `/blog?q=…`, `/blog?tag=…`, the post's `/blog/<slug>` and an unknown slug | Home and the archive show the saved card with the default cover; it is newest first; search and tag filters include it and the count includes it; the article page renders its Markdown heading and body, never its `authorEmail`, and an injected `<script>` does not run; the unknown slug still renders the not-found state (AC37.1–AC37.4, AC37.6) |
| TC-3703 | auto | Block `firestore.googleapis.com`, load `/blog`, then read `firestore.rules`, `src/lib/blogs.ts`, `src/hooks/useSavedBlogs.ts`, `src/pages/BlogList.tsx`, `src/pages/Home.tsx`, `src/pages/PostDetail.tsx` and `src/App.tsx` | The archive still renders the six seed cards while the read is pending or failed, and a `role="status"` notice says saved posts could not be loaded; `blogs` is publicly readable and still admin-only to write; the read goes through `listSavedBlogs`/`getDocsFromServer` in `src/lib/blogs.ts`; the three visitor surfaces use the hook and the merge (AC37.5, AC37.6) |
| TC-3704 | manual | Sign in as the console-promoted admin (the deployed rules still let an admin read `blogs`, or after `npm run deploy:rules` if signed out), open `/`, `/blog` and the saved SEO post's article page | The saved SEO post appears on the home grid and the archive, opens at its `/blog/<slug>`, shows its cover and Markdown content, and a signed-out browser reads it once the R37 rule is deployed (AC37.1–AC37.7) |

## R38 — The admin manages blogs

The management page sits behind the R31 guard, so its rendered list and its
writes cannot be exercised by the suite without a console-promoted account. The
cases below prove the guard, the merge/editor logic and the wiring; the live
walkthrough against the project's own data is TC-3804.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-3801 | auto | Load `/admin/dashboard/blogs` signed out | The browser is redirected to `/signin`; no management heading, Edit/Delete control or editor form renders (AC38.1, AC38.8) |
| TC-3802 | auto | Import `src/lib/blog-admin.ts` and `src/lib/blog-draft.ts`; run `managedBlogs` over the seed list and two `blogs` records (one with an image, one without), `draftFromRecord`, `imagePathFromUrl` over a `storage.googleapis.com` URL, a `firebasestorage.googleapis.com` URL, a default cover and an unrelated URL, and `buildBlogDocument` with and without an image path | The list holds repository articles and saved posts once each, newest first with undated posts last, a slug collision keeps the saved post, only a saved entry carries its record id, and its source is `Firestore`; an empty image falls back to the default cover; the draft is pre-filled from the document; a Storage URL yields the decoded `blog-images/<uid>/<file>` path while a cover or unrelated URL yields `""`; the built document carries `imagePath`, or `""` when there is no image (AC38.1, AC38.3, AC38.5, AC38.6) |
| TC-3803 | auto | Read `src/App.tsx`, `src/components/admin/ManageBlogs.tsx`, `src/lib/blog-admin.ts`, `src/lib/blogs.ts`, `firestore.rules` and `functions/index.js` | The `blogs` dashboard route renders `<ManageBlogs />` inside `<RequireAdmin>`; the panel has Edit and Delete controls, a file input, Replace/Remove image controls and a save action; it reaches Firebase only through `updateBlogPost` and `deleteBlogPost`; the seam calls `updateDoc`/`deleteDoc` on `blogs` with a server timestamp, removes a stale cover after a successful save and derives a path when the document has no `imagePath`; `blogs` still allows a write only for `isAdmin()`, and `deleteBlogImage` still checks the admin role (AC38.2, AC38.4–AC38.8) |
| TC-3804 | manual | Sign in as the console-promoted admin, open `/admin/dashboard/blogs`, edit an existing post's title/content, replace its image, save, then reopen it and remove the image, save; add an image to a post without one; finally delete a test post and confirm | Each save updates the same `blogs/<id>` document (visible in the console and on the public article page after reload), the cover is replaced/removed/added as chosen, records were created with `imagePath`, the delete removes the document and its archived card, and the layout has no horizontal overflow at 360px in both themes (AC38.1, AC38.4–AC38.9) |

## R39 — The dashboard's Add New Blog is the Firestore composer

The composer renders only for a console-promoted account, so what the suite can
prove is its wiring and the order of its fields; the rendered save is the
owner's walkthrough (TC-3903). The guard for `/admin/dashboard/blogs/new` is
already proved by TC-3201 and is cited, not repeated.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-3901 | auto | Read `src/App.tsx`, `src/components/admin/AdminPanels.tsx` and `src/pages/AddBlog.tsx` | `/admin/dashboard/blogs/new` and `/admin/add-blog` both render `<AddBlog />` inside `<RequireAdmin>`; `AdminPanels.tsx` no longer exports a markdown composer, and no `Compose markdown` control remains in `src/`; the sidebar still declares exactly the three R32.1 items (AC39.1, AC39.4, AC39.5) |
| TC-3902 | auto | Read `src/pages/AddBlog.tsx` and record the index of each field's label | `htmlFor={titleId}` < `htmlFor={categoryId}` < `htmlFor={excerptId}` < `htmlFor={imageId}` < `htmlFor={tagsId}` < `htmlFor={contentId}`, so the featured image sits directly before Tags; the image input is `type="file"` with `accept="image/*"`, and the category options come from `categoryOptions` (AC39.2, AC39.3) |
| TC-3903 | manual | Sign in as the console-promoted admin, open **Add New Blog** from the dashboard sidebar, fill title, category, excerpt, tags and content, choose a demo image and save; then open the public `/blog` and the new article; finally open `/admin/add-blog` | The form shows title, category, excerpt, featured image, tags and content in that order, previews the image and reports the saved document in the live region; the post appears on the public archive and its article page with the uploaded cover; `/admin/add-blog` renders the same form; no second, markdown-only composer exists (AC39.1–AC39.5) |

## R40 — Mobile blog reading: the featured image is never cropped

The reported defect is geometry, so the cases measure geometry: a cover of a
known ratio is routed into the page and the rendered box is compared with the
image's own ratio. A forced box or a `cover` crop fails that comparison. The
cases reuse the existing R23 spec's article and the R19 cards, and cite rather
than repeat the per-surface 360 px overflow guards (TC-1911, TC-2011, TC-2307,
TC-2416, TC-3204, TC-3604, TC-3804).

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-4001 | auto | Route a 1600 × 600 cover into `/blog/mixture-of-experts`; measure the cover box at 360 px and at 1280 px; then route a 900 × 1200 cover and measure again; finally scroll `/blog` down, tap a card, and check the resulting scroll position, then type in the search box and check it again | The rendered box matches the image's natural ratio at both widths, `object-fit` is not `cover`, and the full width is on screen; the tall cover is fully visible inside a capped box and is not stretched; the tapped article opens at scroll 0 with the cover in view, and a filter change does not reset the scroll (AC40.1, AC40.2, AC40.7) — **@smoke** |
| TC-4002 | auto | Route a 1600 × 900 cover into every card image; measure the first card's media box on `/` at 360 px, then at 900 px | Below 640 px the media box matches the image's natural ratio, so the whole featured image is visible; at 900 px the media box is 8 / 5 and the image is cropped to it, and the hover zoom still applies (AC40.3) |
| TC-4003 | auto | Open an article at 360 px, scroll down, and compare the rail's box with the header's box | The rail is `position: sticky`, its offset from the top is at least the header's height, and no part of the rail sits behind the header (AC40.4) |
| TC-4004 | auto | At 360 px: tap the search field's padding area on `/` and `/blog`; then read dark-mode `--color-text-subtle` against the real backgrounds of the card meta, the article meta line and the sidebar | Each tap focuses the input, so the target is the field's height (≥ 32 px); every measured pair is ≥ 4.5:1 (AC40.5, AC40.6) |

## R41 — Tenancy foundation

The boundary this requirement adds lives in `firestore.rules`, and a browser
cannot exercise it. The three cases below run the real rules in the Firestore
emulator (`npm run test:rules`, launcher `scripts/run-rules-tests.mjs`), with
fixtures written under disabled rules and every assertion made through the rule
under test. TC-4104 is the cheap regression guard in the Playwright suite, so a
future edit that relaxes a tenant path fails the normal run too. The emulator
needs a JDK; the launcher finds `.tools/`, `JAVA_HOME` or `java` on `PATH`.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-4101 | cli | Seed workspaces A and B with an editor of A and a viewer of A; as the editor, create, update and delete A's posts, then repeat against B's; as a stranger, write A's post; as the viewer, read and write A's post | Every write inside A succeeds; every write against B is refused (update, create and delete); the stranger is refused; the viewer reads but cannot write (AC41.2, AC41.3) |
| TC-4102 | cli | As an anonymous visitor read a post in A and in B, write to A, and read A's member list; as the editor of A read A's and B's member lists; as the owner of A add a viewer and try to add an `"owner"` member; as the editor try to add a viewer | Anonymous reads both posts and is refused the write and the member list; the editor reads A's team and is refused B's; the owner adds a viewer and is refused an `"owner"` member; the editor is refused a member write (AC41.3, AC41.4) |
| TC-4103 | cli | As the owner, the editor and an anonymous visitor read `workspaces/a/private/billing`; as the owner write `plan` and a new `ownerUid` into the workspace document; as a fresh account create a workspace owned by itself, one owned by somebody else, one with an invalid slug, and one carrying `plan`; then read the workspace document anonymously | Only the owner reads the billing document; the plan field and the `ownerUid` change are refused; only the self-owned, valid, billing-free workspace is created; the anonymous read returns the slug and no plan (AC41.4) |
| TC-4104 | auto | Read `firestore.rules` and `src/lib/workspaces.ts`; check the tenant paths, the predicates they use, and that no path allows an unconditional write | `workspaces/{workspaceId}` exists with nested `members`, `private` and `blogs`; nested post writes are gated on `canEditWorkspace(...)`, member writes on `isWorkspaceOwner(...)`, `private` on `isWorkspaceOwner(...)`; the workspace document refuses billing fields and an `ownerUid` change; no `allow write: if true` exists; the seam exposes the role, slug and path helpers (AC41.1, AC41.4, AC41.5) |

## R42 - The site's posts live in a workspace

The migration runs with the Admin SDK, which bypasses rules, so its proof is the
emulator: the real script module is executed against a seeded flat `blogs`
collection and the destination is read back (TC-4201, under `npm run test:rules`
alongside R41). The switch itself is proved by the seam's own unit checks and by
the visitor/admin specs that already render the archive (TC-4202, TC-4203). The
production run is the publish step (TC-4204) because it needs credentials only
the owner can supply.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-4201 | cli | Against the emulator: seed three `blogs` documents (one without `updatedAt`), run the migration with a named owner, read the destination, run it again, then run a `--dry-run` over a fourth seeded document | The workspace document exists with that owner; all three documents are under `workspaces/signal-and-noise/blogs` with the same ids and values (timestamps included); the second run writes nothing and reports zero new; the dry run writes nothing and reports one pending; the flat collection is untouched (AC42.1, AC42.2) |
| TC-4202 | auto | Import `src/lib/blog-draft.ts` and `src/lib/blog-admin.ts`; feed `imagePathFromUrl` and `storedImagePath` a workspace URL, a legacy URL, a workspace `imagePath` and an unrelated URL; read `src/lib/blogs.ts` and `functions/index.js` | A workspace URL yields its full `workspaces/<id>/blog-images/<uid>/<file>` path, a legacy URL keeps working, an unrelated URL yields `""`; the seam reads and writes `workspaces/<workspaceId>/blogs` and passes `workspaceId` on the upload and delete calls; the function accepts that shape (AC42.3, AC42.4) |
| TC-4203 | cli | Run `npm run build`, `npm run lint`, `npm run test:rules` and the full suite; compare the bundle with the R41 figure | Build and lint pass, the rules cases pass, the suite is green at the same count as before the switch, and the bundle stays within the R14 budgets (AC42.5) |
| TC-4204 | manual | At publish: run `node scripts/migrate-workspace.mjs --dry-run`, then the real run against the project, read the destination back, then open `/`, `/blog` and a saved post | Dry run reports the expected count and writes nothing; the real run copies that count; the destination holds the same documents; the site shows the same posts (including the saved ones) and the admin panel still edits them (AC42.1, AC42.3, AC42.5) |

## R43 - A workspace is a public site at `/w/<slug>`

The browser cases inject dev-only workspace fixtures (`__workspaceDocs` and
`__workspaceFixtures`, compiled out of a production build), the same pattern
R37 uses for saved posts. That lets one run show two tenants side by side and
prove that neither leaks into the other, without reaching the live project. The
quality gate is TC-4304; the rules themselves are unchanged and already executed
by R41's TC-4101-TC-4103, so they are cited, not repeated.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-4301 | auto | With fixtures for two workspaces and one post each, open `/w/alpha` and then `/w/beta/blog` | The hero shows that workspace's own name; each page lists exactly its own post and never the other tenant's; no repository seed article appears on a tenant site (AC43.1, AC43.2) |
| TC-4302 | auto | Open `/w/alpha`, inspect the header, card cover/title/category/tag links, then open the card and inspect the breadcrumb | Brand, Home, Blogs and the search control point under `/w/alpha`; the card links to `/w/alpha/blog/<slug>` and its badge to `/w/alpha/blog?topic=`; the article opens at `/w/alpha/blog/<slug>` with Home and Blogs breadcrumbs inside the tenant (AC43.3) |
| TC-4303 | auto | Open an unknown slug, an empty workspace, and the default workspace | Unknown slug renders **Site not found** with no cards; the empty workspace shows **No posts yet**; the default workspace shows the six seed articles, so it matches `/` (AC43.1, AC43.2, AC43.5) |
| TC-4304 | cli | Run `npm run build`, `npm run lint`, `npm run test:rules` and the full suite; compare the bundle with the R42 figure | Build and lint pass, the rules cases pass, the suite is green, and the bundle stays within the R14 budgets (AC43.4, AC43.5) |

## R44 - The launcher and a workspace's own admin

The signed-out cases run for real. A signed-in case uses a throwaway account the
suite creates and deletes - it owns no workspace, which is the empty state that
must not be faked. The owner/editor path needs a workspace owned by the signed-in
account, so its wiring is proved statically (TC-4403), the same way R32 and R38
prove panels the suite cannot open without a promoted account.

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-4401 | auto | Open `/dashboard` and `/w/alpha-labs/admin` signed out | Both redirect to `/signin`; no "My sites" heading and no "Workspace admin" content renders (AC44.1, AC44.3) |
| TC-4402 | auto | Sign up a throwaway account, click **My sites** in the header | The header shows the link, `/dashboard` renders, the account owns nothing, so **No sites yet** is shown and there are no site cards; the account is deleted afterwards (AC44.1, AC44.2) |
| TC-4403 | auto | Read `src/pages/Dashboard.tsx`, `src/pages/WorkspaceAdmin.tsx`, `src/hooks/useMyWorkspaces.ts`, `src/lib/workspaces.ts` and `src/App.tsx` | The launcher queries `ownerUid` and links to `/w/<slug>/admin`; both routes are registered; the workspace admin uses `fetchWorkspaceRole` and never `isAdminRole`; the owner check precedes the members read; a `permission-denied` members read is treated as "not a member" (AC44.3, AC44.5) |
| TC-4404 | cli | Run `npm run build`, `npm run lint`, `npm run test:rules` and the full suite; compare the bundle with the R43 figure | Build and lint pass, the rules cases pass, the suite is green, and the bundle stays within the R14 budgets (AC44.6) |
