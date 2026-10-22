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

## R2 — AI Updates list with search and filters

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-201 | auto | Open `/blog` | All posts listed, newest first, each showing title, excerpt, date, reading time, category, tags |
| TC-202 | auto | Type `prompting` in the search box | Only matching posts remain; URL contains `?q=prompting` |
| TC-203 | auto | Type `routing` in the search box | Matching posts remain; count updates |
| TC-204 | auto | Click the "News" category chip | Only News posts shown; chip is active; URL contains `?category=news` |
| TC-205 | auto | Click "All" | Filter cleared, all posts shown again |
| TC-206 | auto | Type a nonsense term (`zzzz`) | Empty-state message shown |
| TC-207 | auto | Apply any filter | Displayed count ("N posts") equals number of rendered cards |
| TC-208 | auto | Load `/blog?category=news` directly | Page opens with the News filter pre-applied |

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
