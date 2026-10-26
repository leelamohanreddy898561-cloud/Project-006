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
- [x] (R18) Evidence entry + local commit; published after owner approval
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
- [x] (R1, R2, R19) `BlogCard` — title, excerpt, read time, category, author, bookmark; date and tags shown on `/blog`
- [x] (R2) `BlogList` grid with empty state (R2.5) and result count (R2.6)
- [x] (R2) Search bar and topic/tag filter chips (R2.2–R2.4, R2.7)
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
- [x] Execute TC-1901–TC-1912; evidence entry; local commit; published after owner approval (2026-10-21)

## Phase 3d — Footer + newsletter (R20)

- [x] (R20.1) Newsletter box above the footer: email field + Subscribe + value statement
- [x] (R20.2–R20.4) Validation, success state, live region, label + `aria-describedby`
- [x] (R20.5) Four footer columns: brand, Quick Links, AI Categories, Social Links
- [x] (R20.6) Quick Links use the router (no full reloads)
- [x] (R20.7) AI Categories from the shared site config
- [x] (R20.8) X, GitHub, LinkedIn links with accessible names + `rel="noopener noreferrer"`
- [x] (R20.9, R20.10) Bottom bar: copyright with current year + Privacy Policy route
- [x] (R20.11, R20.12) Single column below 900px; AA contrast both themes
- [x] Execute TC-2001–TC-2012; evidence entry; local commit; **awaiting owner approval**

## Phase 3e — Repository and workflow hygiene (R21)

- [x] (R21.1) Untrack `.firebase/` and add it to `.gitignore`
- [x] (R21.2) Delete `tests/example.spec.ts`; document the convention in `test-cases.md`
- [x] (R21.3) Local suite reports 0 skipped
- [x] (R21.4) Publish = one change-log cycle; update `AGENTS.md` step 11
- [x] (R21.5) Pin `firebase-tools` as a devDependency + `npm run deploy`
- [x] (R21.6) Distinct accessible names for the header and footer home links
- [x] (R21.7) Document that screenshots and `changeLog.json` are retained on purpose
- [x] Execute TC-2101–TC-2107; evidence entry; local commit; **awaiting owner approval**

## Phase 3f — Deploy tooling footprint (R22)

- [x] (R22.1) `deploy` script uses `npx --yes firebase-tools@15.34.1`
- [x] (R22.2) Remove `firebase-tools` from devDependencies
- [x] (R22.3) Verify the pinned command resolves to `15.34.1`
- [x] (R22.4) Deploy target and flags unchanged
- [x] (R22.5) Measure `node_modules`, re-run build/lint/tests; evidence entry; local commit

## Phase 3g — Blog detail page (R23)

- [x] (R23.1–R23.3) `/blog/:slug` route, not-found state, document title
- [x] (R23.4–R23.7) Header image, markdown body, readable measure, mobile bar
- [x] (R23.8–R23.13) Sticky left rail: Like, Share, Bookmark with a11y state
- [x] (R23.14–R23.17) Comment section with validation + non-persistence notice
- [x] (R23.18–R23.19) Related articles
- [x] (R23.20–R23.21) AA contrast; build, lint, tests, budget
- [x] Article body content for the six seed posts (markdown)
- [x] Execute TC-2301–TC-2320; evidence entry; local commit; **awaiting owner approval**

## Phase 3h — Sign in and sign up pages (R24)

- [x] (R24.1–R24.6) Real `/signin` and `/signup` routes, glass card, gradient glows
- [x] (R24.7–R24.10) Field validation, error association, error clearing, autocomplete
- [x] (R24.11–R24.14) Live-region outcomes, Google button, password reveal, cross links
- [x] (R24.15) Single auth seam in `src/lib/auth.ts`
- [x] (R24.16–R24.18) Mobile overflow, AA contrast, build/lint/tests/budget
- [x] Execute TC-2401–TC-2418; evidence entry; local commit; **awaiting owner approval**

## Phase 3i — Test hygiene and documentation truth (R25, R26)

- [x] (R25.1–R25.3) Capture helper, redirect to `test-results/`, explicit `evidence:screenshots` command
- [x] (R25.4–R25.5) Guard test against literal/`evidence/` paths; keep the proof images tracked
- [x] (R26.1-R26.4) `AGENTS.md` Section 9 lists R0-R24 with R15 still marked superseded

## Phase 3j - Production smoke subset (R27)

- [x] (R27.1) `npm run verify:prod` refuses to run without `PLAYWRIGHT_BASE_URL`
- [x] (R27.2-R27.4) `@smoke` tags on existing tests; 8 tests covering every route class plus interactive flows
- [x] (R27.5) Guard test keeps the tagged set and the manifest identical, and route coverage complete
- [x] (R27.6) Launcher exits non-zero on failure and forces zero retries
- [x] (R27.7) `AGENTS.md` publish steps name `npm run verify:prod`

## Phase 3k - One branch per requirement (R28)

- [x] (R28.1-R28.2) Branch created from `main`; workflow documents one branch per requirement and a fast-forward publish
- [x] (R28.3) Rebase-and-re-verify rule recorded; force-push and merge commits forbidden
- [x] (R28.4) Approval gate corrected: pushing a work branch is not publishing
- [x] (R28.5) Guard test asserts every documented branch rule
- [x] (R28.6) Full suite green; `verify:prod` unchanged
- [ ] Execute TC-2501–TC-2604; evidence entry; local commit; await owner approval

## Phase 3l - Live authentication (R29)

- [x] (R29.1) `getFirebaseAuth()` exported from `src/lib/firebase.ts` with localStorage persistence
- [x] (R29.5) `useAuth` hook subscribes to the session; header shows the account menu when signed in
- [x] (R29.1, R29.3) Email/password sign-up and sign-in wired to the live project; sign out from header and auth page
- [x] (R29.4) Google pop-up sign-in wired with `prompt: "select_account"` and preloaded auth module
- [x] (R29.5) A signed-in visitor sees the session and a sign-out on `/signin` and `/signup`
- [x] (R29.6, R29.7) Auth-only loader keeps the SDK out of the entry chunk; seam is the only importer
- [x] (R29.9) Smoke subset carries a real failed sign-in against the provider
- [x] (R29.10) Suite creates a throwaway account and deletes it in `afterAll`
- [ ] **Owner action:** enable Email/Password and Google in Firebase Console → Authentication → Sign-in method
- [ ] Execute TC-2901–TC-2910; evidence entry; local commit; await owner approval

## Phase 3m - Lean loop and consolidated guards (R30)

- [x] (R30.1-R30.3) Section 2 rewritten as the lean loop: fast loop, one full run at the gate, four-TC cap, short evidence
- [x] (R30.4-R30.6) 16 R25-R28 guards consolidated into `tests/workflow-guards.spec.ts`; four spec files retired; Section 5 map updated
- [x] (R30.7) Full suite green at 86 tests; `verify:prod` unchanged
- [x] (R30.8) Approval gate and non-negotiables untouched
- [x] Execute TC-3001-TC-3008; evidence entry; local commit; published

## Phase 3n - Blogs list with search and filters (R2)

- [x] (R2.1) `/blog` renders every post newest first with title, excerpt, date, read time, category, tags
- [x] (R2.2) Search across title/excerpt/category/tags — case-insensitive, every term must match
- [x] (R2.3, R2.7) Topic and tag chips filter; a second click (or "All") clears
- [x] (R2.4) `q`, `topic`, `tag` live in the URL and survive a reload
- [x] (R2.5, R2.6) Friendly empty state; the count matches the cards rendered
- [x] Execute TC-201-TC-210; evidence entry; local commit; published (2026-10-23)

## Phase 3o — User roles and the protected admin route (R31)

- [x] (R31.1, R31.2) `src/lib/users.ts`: ensure/read the `users/{uid}` profile, default `student`, never overwrite a role
- [x] (R31.1) Seed the profile after email/password sign-up, sign-in, and Google sign-in without blocking the session
- [x] (R31.3–R31.6) `RequireAdmin` guard + `/admin` page: admin allowed, standard user → `/`, signed-out → `/signin`, loading status
- [x] (R31.7) Role read failure fails closed without breaking the shell
- [x] (R31.8) `firestore.rules` (own doc, no self-promotion), `firebase.json`, `npm run deploy:rules` (deployed at publish)
- [x] (R31.9) Execute TC-3101–TC-3103; evidence entry; local commit; await owner approval

## Phase 3p — Admin dashboard (R32)

- [x] (R32.1, R32.3) `AdminDashboard` shell: sidebar nav with exactly All Blogs, Add New Blog, Manage Users; exact-match `aria-current`
- [x] (R32.4) Register `/admin/dashboard` + `blogs` + `blogs/new` + `users` + not-found behind the existing `RequireAdmin`; desktop side-by-side, stacked below 1000px
- [x] (R32.5) All Blogs panel: every post newest first with title, category, date, read time, link to `/blog/<slug>`
- [x] (R32.6, R32.7) Add New Blog composer: labelled fields, inline validation, markdown output + copy, live region that never claims a publish
- [x] (R32.8) Manage Users panel: the signed-in account, the role legend, and the console-only rule stated plainly
- [x] (R32.9, R32.10) Contrast check in both themes; execute TC-3201–TC-3204; evidence entry; local commit

## Phase 3q — Admin blog composer at `/admin/add-blog` (R33)

- [x] (R33.7, R33.8) `src/lib/blogs.ts` — the single seam: image upload to Storage under `blog-images/<uid>/`, one `blogs` document per submit, plain-English failures
- [x] (R33.4, R33.5, R33.8) `src/lib/blog-draft.ts` — validation, tag parsing, reading time, slug and the document the form writes
- [x] (R33.1–R33.6) `src/pages/AddBlog.tsx` + `.css` behind the R31 guard: labelled title, category, image, content; inline errors; live-region outcome
- [x] (R33.10, R33.11) `firestore.rules` `blogs` block (admin-only via `users/{uid}.role`), new `storage.rules`, `firebase.json` storage block, `deploy:rules` publishes both
- [x] (R33.12) Execute TC-3301–TC-3303; evidence entry; local commit; await owner approval (TC-3304 manual)

## Phase 5 — Routing & pages

- [x] Configure React Router route table
- [x] (R1) Home: hero + primary CTA button
- [ ] (R1) Home: featured, latest, and category sections
- [x] (R2) Blogs list with search + topic/tag filters
- [ ] (R3) Post detail with TOC, prev/next, related
- [ ] (R4) Categories index
- [ ] (R5) Category detail
- [ ] (R6) Tag detail
- [ ] (R7) About
- [ ] (R8) 404 wired to unknown routes
- [ ] Scroll-to-top on route change
- [ ] (R12.1) Per-page document title updates

## Phase 6 — Features

- [x] (R2.2) Client-side search over title/excerpt/category/tags
- [x] (R2.3, R2.4) Topic and tag filters reflected in URL params
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
