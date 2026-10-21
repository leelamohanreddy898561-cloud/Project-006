# Test Cases

Every test case maps to a requirement ID in `requirements.md`.
`Type` is either `auto` (executable by Playwright) or `manual` (human check).
Results for each run are recorded in `evidence.md`.

**Status legend:** `pending` · `pass` · `fail`

---

## R0 — Project scaffold and tooling

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-001 | auto | Run `npm run dev` | Server starts on 127.0.0.1:5173, no errors |
| TC-002 | auto | Run `npm run build` | Build succeeds, zero TypeScript errors |
| TC-003 | auto | Run `npm run lint` | Zero warnings |
| TC-004 | auto | Run `npx playwright test` | Tests run, HTML report produced |
| TC-005 | manual | Run `git log --oneline` | Initial commit contains the workflow docs |

## R1 — Home page

| ID | Type | Steps | Expected |
| --- | --- | --- | --- |
| TC-101 | auto | Open `/` | Hero shows site name, description, and a CTA linking to `/blog` |
| TC-102 | auto | Open `/` | "Featured reading" section exists and shows featured posts |
| TC-103 | auto | Open `/` | "Latest updates" shows posts in newest-first order |
| TC-104 | auto | Open `/` | "Browse by category" lists all categories with counts; each links to its category page |

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
| TC-1607 | auto | Open `/`, call `window.__getFirebase()` | Resolves with `app`, `auth`, `db`, `storage` initialized against the real project |
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
