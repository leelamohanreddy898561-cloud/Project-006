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
- [x] (R16.1, R16.4) Convert to a lazy `getFirebase()` loader; remove the eager import from `main.tsx`
- [x] (R16.2) Create `.env.example`; add `.env` to `.gitignore`
- [x] (R16.6) Create `firebase.json` (serve `dist/` with SPA rewrite)
- [x] (R16.7) Create `.firebaserc` with project `project-006-e6ae1`
- [x] (R16.9) Add real credentials to `.env` and verify initialization (TC-1607)
- [x] (R16.8) Deploy to Firebase Hosting — live at https://project-006-e6ae1.web.app
- [ ] Configure Firestore/Storage security rules before either is used with real data

## Phase 1c — Change log export (R17)

- [x] (R17.1) Create `scripts/generate-changelog.mjs` (builds from real git history)
- [x] (R17.2) Generate and commit `changeLog.json`
- [x] (R17.3, R17.4) Create `scripts/sync-changes.mjs` with a credentials guard
- [x] (R17.3) Run `npm run sync:changes` against Firestore — 4 entries live, verified by read-back

## Phase 1d — Glassmorphism header (R18, supersedes R15)

- [x] (R18) Add R18 to `requirements.md`; mark R15 superseded; rename Categories→Topics, AI Updates→Blogs
- [x] (R18) Add TC-1801–TC-1812 to `test-cases.md`
- [x] (R18.1) Glass treatment: translucent background, backdrop blur, subtle border, both themes
- [x] (R18.2) Glowing AI logo + "AI Pulse" brand linking to `/`
- [x] (R18.3) Nav: Home / Topics / Blogs / About with smooth gradient hover
- [x] (R18.4) Search icon → `/blog`; Sign In → `/signin`; Sign Up → `/signup`
- [x] (R9, R18.5, R18.6) Theme toggle: switch, persist, respect system preference
- [x] (R18.8) Placeholder pages for `/signin`, `/signup`, `/topics`, `/blog`, `/about`
- [x] (R18.9) Active-route highlighting
- [x] (R18.11) `prefers-reduced-motion` disables the logo glow (and all transitions)
- [x] (R18) Brand rename in `index.html` (title, meta, OG) and home hero copy
- [x] (R18) Execute TC-1801–TC-1812; verify contrast in both themes
- [x] (R18) Evidence entry + local commit; **awaiting owner visual approval before push/deploy**
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
- [x] (R18) Glassmorphism `Header`: brand, navigation, search, theme toggle, auth buttons
- [x] (R9, R18) `ThemeToggle` with `localStorage` persistence and system-preference default
- [ ] (R1) `Footer` with navigation and copyright
- [ ] (R1) `PostCard` (title, excerpt, date, reading time, tags)
- [ ] (R2) `PostList` / grid with empty state (R2.5)
- [ ] (R2) `SearchBar`
- [ ] (R3) `TagList`
- [ ] (R3) `Markdown` renderer + heading anchors (R3.1)
- [ ] (R3) `TableOfContents` (R3.3)
- [ ] (R8) `NotFound` page component

## Phase 3b — Hero section (R1.1–R1.6)

- [x] (R1.1) Hero copy: "Explore the Future of AI", description, "Start Reading" → `/blog`
- [x] (R1.2) `NetworkBackground`: canvas particle network, slow ambient drift
- [x] (R1.3) `TopicCard`: floating popular-topic card with float animation + rotation
- [x] (R1.4) All hero animation disabled under `prefers-reduced-motion`
- [x] (R1.5) Mobile stacking at 360px with no overflow
- [x] (R1.6) Hero text contrast ≥ 4.5:1 in both themes
- [x] Execute TC-101–TC-106; evidence entry; local commit; published after owner approval

## Phase 3c — Home main content layout (R19)

- [x] (R19.1) 70/30 two-column layout below the hero
- [x] (R19.2) Article grid: 2 columns desktop, 1 mobile, newest first
- [x] (R19.4) `BlogCard`: cover image, category badge, title, read time, author, bookmark
- [x] (R19.5, R19.6) Hover lift + image zoom, disabled under reduced motion
- [x] (R19.7) Bookmark toggle with `aria-pressed`
- [x] (R19.9) Sidebar: Trending Topics, search bar, Quick Filters
- [x] (R19.10, R19.11) Sidebar search and quick filters drive the grid
- [x] (R19.12) Empty state when nothing matches
- [x] (R19.3, R19.8) Single column on mobile; AA contrast in both themes
- [x] Seed post data + local AI-themed cover art (placeholder until R13)
- [x] Execute TC-1901–TC-1912; evidence entry; local commit; **awaiting owner approval**

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
- [x] (R14.1) JS bundle < 150 kB gzipped — **83.32 kB** after lazy-loading Firebase
- [x] (R14.2) CSS bundle < 25 kB gzipped — **1.38 kB**
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
