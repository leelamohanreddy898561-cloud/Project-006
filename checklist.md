# Checklist: AI Blog — "Signal & Noise"

Every item is tagged with the requirement ID(s) it serves (see `requirements.md`).
Test cases live in `test-cases.md`; proof of completion lives in `evidence.md`.
**Legend:** `[ ]` not started · `[~]` in progress · `[x]` done (with evidence entry)

---

## Phase 0 — Workflow foundation

- [x] Create `AGENTS.md` with the standing requirement loop
- [x] Restructure `requirements.md` to ID-based format (R0–R14)
- [x] Create `test-cases.md` mapped to requirement IDs
- [x] Create `evidence.md` with the entry format
- [x] (R0) Install Playwright and verify the runner executes
- [x] (R0) Initialize git and make the initial commit

## Phase 1 — Project scaffold (R0)

- [x] (R0.1) Scaffold Vite + React + TypeScript project
- [x] (R0.1) Enable TypeScript strict mode
- [x] (R0.1) Configure `dev` script on 127.0.0.1:5173
- [x] (R0.2) Verify `npm run build` passes with zero errors
- [x] (R0.3) Configure and verify `npm run lint` with zero warnings
- [x] (R0.4) Wire Playwright config (`playwright.config.ts`, `tests/`)
- [x] (R0.4) Enable the `webServer` block once a `dev` script exists

## Phase 1b — Firebase integration (R16)

- [x] (R16.1) Install the `firebase` SDK (v13) and approve required install scripts
- [x] (R16.1) Create `src/lib/firebase.ts` reading config from `import.meta.env`
- [x] (R16.1) Import the module in `main.tsx` so Firebase initializes on startup
- [x] (R16.2) Create `.env.example`; add `.env` to `.gitignore`
- [x] (R16.5) Create `firebase.json` (serve `dist/` with SPA rewrite)
- [x] (R16.6) Create `.firebaserc` with project `project-006-e6ae1`
- [ ] (R16.8) Add remaining `.env` values from the console: `apiKey`, `messagingSenderId`, `appId`, `measurementId` — **blocked on user**
- [ ] (R16.8) Verify real initialization against the project (TC-1607) — **blocked on credentials**
- [ ] (R16.8) Deploy to Firebase Hosting (TC-1608)
- [ ] Configure Firestore/Storage security rules before either is used with real data

## Phase 2 — Content model (R13)

- [ ] (R13.1) Define the `Post` type (frontmatter fields)
- [ ] (R13.1) Create markdown loader with frontmatter parsing
- [ ] (R13.1) Add 3 seed posts in `content/posts/`
- [ ] (R13.2) Implement reading-time calculation
- [ ] (R13.3) Sort posts newest first in all listings
- [ ] (R13.4) Verify a new `.md` file appears with no code changes (TC-1301)
- [ ] Helpers: `getAllPosts`, `getPostBySlug`, `getCategories`, `getTags`,
      `getRelatedPosts`, `getAdjacentPosts`, `searchPosts`

## Phase 3 — Design tokens & global styles (R1, R9, R10, R11)

- [x] Define CSS custom properties: colors, spacing, typography, radii, shadows
- [x] Light and dark theme values from the same tokens (R9)
- [x] Global reset and base element styles
- [x] Responsive breakpoint conventions (R10)
- [x] Visible `:focus-visible` styles (R11.2)
- [ ] Reusable button, card, and badge styles (buttons done; cards/badges pending)

## Phase 4 — Core components

- [ ] (R1, R11) `Layout` wrapper with skip link (R11.1) and landmarks (R11.3)
- [x] (R15) `Header` with brand and navigation
- [ ] (R9) `ThemeToggle` with `localStorage` persistence
- [ ] (R1) `Footer` with navigation and copyright
- [ ] (R1) `PostCard` (title, excerpt, date, reading time, tags)
- [ ] (R2) `PostList` / grid with empty state (R2.5)
- [ ] (R2) `SearchBar`
- [ ] (R3) `TagList`
- [ ] (R3) `Markdown` renderer + heading anchors (R3.1)
- [ ] (R3) `TableOfContents` (R3.3)
- [ ] (R8) `NotFound` page component

## Phase 5 — Routing & pages

- [x] Configure React Router route table
- [x] (R1) Home: hero + primary CTA button
- [ ] (R1) Home: featured, latest, and category sections
- [ ] (R2) AI Updates list with search + filters
- [ ] (R3) Post detail with TOC, prev/next, related
- [ ] (R4) Categories index
- [ ] (R5) Category detail
- [ ] (R6) Tag detail
- [ ] (R7) About
- [ ] (R8) 404 wired to unknown routes
- [ ] Scroll-to-top on route change
- [ ] (R12.1) Per-page document title updates

## Phase 6 — Features

- [ ] (R2.2) Client-side search over title/excerpt/tags
- [ ] (R2.3, R2.4) Category and tag filters reflected in URL params
- [ ] (R9.1–R9.4) Theme toggle, persistence, system preference, color change
- [ ] (R3.1) Styled markdown: headings, code, blockquotes, images
- [ ] (R3.4, R3.5) Prev/next and related posts

## Phase 7 — SEO & performance (R12, R14)

- [ ] (R12.1) Unique title + meta description per page
- [ ] (R12.3) Open Graph tags
- [ ] (R12.2) `sitemap.xml` and `robots.txt`
- [ ] (R14.1) JS bundle < 150 kB gzipped
- [ ] (R14.2) CSS bundle < 25 kB gzipped
- [ ] (R14.3) No console errors on home page

## Phase 8 — Accessibility & responsive (R10, R11)

- [ ] (R11.1) Skip-to-content link, visible on focus
- [ ] (R11.2) Full keyboard operability with visible focus
- [ ] (R11.3) Semantic landmarks on every page
- [ ] (R11.4) WCAG AA contrast in both themes
- [ ] (R10.1, R10.2) No horizontal overflow at 360/768/1024/1920px
- [ ] (R10.3) Navigation and search reachable at 360px

## Phase 9 — Verification & handoff

- [ ] Execute all `auto` test cases via Playwright
- [ ] Execute all `manual` test cases and record results
- [ ] Append evidence entries for every requirement
- [ ] Update `requirements.md` open questions
- [ ] Document how to add a post (frontmatter format)
- [ ] Configure SPA fallback and deploy to a static host
