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
- [x] (R33.12) Execute TC-3301–TC-3303; evidence entry; local commit; **published 2026-10-26** (TC-3304 is the owner's manual walkthrough against the live site)

## Phase 3r — Storage rule scope fix (R34)

- [x] (R34.1) `storage.rules`: `isOwnerAdmin(uid)` takes the owner's uid as a parameter, so the function reads only variables in its own scope
- [x] (R34.2) Scope guard over both rules files: a function may only use wildcards that are parameters or encloses it
- [x] (R34.3) Correct TC-3302's Storage assertion to `isOwnerAdmin(uid)` — the call it asserted was the defect
- [x] (R34.5) Build, lint and the full suite unchanged; the bundle is untouched (server-side fix)
- [x] (R34.4) Rules deployed, deny-path probe re-run; the live save was completed through R35 and confirmed by the owner (TC-3404)

## Phase 3s — Uploads through an admin-gated function (R35)

- [x] (R35.1–R35.4) `functions/index.js`: `uploadBlogImage` checks `users/{uid}.role`, writes under `blog-images/<uid>/`, image-only, 5 MB cap; `deleteBlogImage` accepts only the caller's own folder
- [x] (R35.1, R35.7) `src/lib/blogs.ts` calls the function instead of the Storage SDK; images are downscaled to 1600 px / JPEG 0.85 with a raw fallback
- [x] (R35.5) Per-object public ACL on each cover, so a published post serves it without an expiring signed URL
- [x] (R35.8) `firebase.json` functions codebase + `npm run deploy:functions`; both functions deployed to `us-central1`
- [x] (R35.9) TC-3501–TC-3503; **published 2026-10-26** (TC-3504: the owner's own save, confirmed)

## Phase 3t — Admin link in the account menu (R36)

- [x] (R36.1–R36.3) `src/components/AccountMenu.tsx`: an **Admin** link to `/admin/dashboard`, rendered only when `isAdminRole(role)` from the existing `useUserRole` seam
- [x] (R36.2) Fail closed: the link is absent while the role loads, when it errors, and for every role except `"admin"`
- [x] (R36.4) `AccountMenu.css`: link visible at 360px (not a `.btn--sm`, which the header hides below 900px) and ≥ 4.5:1 in both themes
- [x] (R36.6) Execute TC-3601–TC-3603; build, lint, full suite; evidence entry; local commit

## Phase 3u — Saved posts visible to visitors (R37)

- [x] (R37.1–R37.3) `src/lib/blog-posts.ts` maps a `blogs` document to a `Post`; `listSavedBlogs()` in the seam reads the collection; `useSavedBlogs` feeds the archive and detail page, merged newest first
- [x] (R37.4) `src/pages/BlogList.tsx`/`PostDetail.tsx`/`Home.tsx` use the merged list; filters, counts, related articles and the home grid/topics include saved posts
- [x] (R37.5) `firestore.rules`: public read on `blogs`, write still `isAdmin()`; the rule ships in the publish step
- [x] (R37.6–R37.8) Seed content still renders while the read is pending/failed, with a `role="status"` notice; the document drops `authorEmail`; remote Markdown is sanitised
- [x] (R37.9) Execute TC-3701–TC-3703; build, lint, full suite (117 passed), bundle within budget; evidence entry; local commit

## Phase 3v — Manage blogs: edit, delete, replace covers (R38)

- [x] (R38.1–R38.3) `All Blogs` becomes the management view: merged repository + Firestore list, source badge, Edit/Delete only on Firestore posts, loading/failed-read states
- [x] (R38.4, R38.6) Inline editor pre-filled from the document; validation; `updateBlogPost` → `updateDoc` on `blogs/<id>` with re-derived fields and `updatedAt`
- [x] (R38.5) Add / replace / remove cover: upload through `uploadBlogImage`, store `imageUrl` + `imagePath`, remove the stale object best-effort, clean up a new upload if the write fails
- [x] (R38.7) Delete with inline confirmation: `deleteBlogPost` → `deleteDoc`, then best-effort cover deletion; failures reported and the post kept
- [x] (R38.8–R38.10) Rules unchanged (admin-only write), accessible labels/contrast/360px, build + lint + full suite + bundle; execute TC-3801–TC-3803
- [x] TC-3804: owner's live walkthrough (admin account) — approved and **published 2026-10-26**

## Phase 3w — The dashboard's Add New Blog is the Firestore composer (R39)

- [x] (R39.1, R39.4) `src/App.tsx`: `blogs/new` renders `<AddBlog />`; remove the markdown composer and its now-unused imports from `AdminPanels.tsx`
- [x] (R39.2) `src/pages/AddBlog.tsx`: order is title, category, excerpt, featured image, tags, content — the image directly above tags
- [x] (R39.3) The shared category taxonomy, the image rules and the admin-gated upload are unchanged, so both routes behave identically
- [x] (R39.5, R39.6) Sidebar unchanged (three items, exact `aria-current`); build, lint, full suite and bundle budget; execute TC-3901/TC-3902; evidence entry; local commit
- [x] TC-3903: owner's walkthrough — add a demo post with an image from the dashboard sidebar; approved and **published 2026-10-26**

## Phase 3x — Mobile blog reading (R40)

- [x] (R40.1, R40.2) `PostDetail.tsx` + `PostDetail.css`: the cover renders at its own aspect ratio — the presentational `height` attribute and the forced 8/5 box are gone, tall covers are capped and contained
- [x] (R40.3) `BlogCard.css`: card thumbnails show the full featured image below 640 px; the editorial thumbnail crop stays at and above it
- [x] (R40.4, R40.5) `ShareRail.css` + tokens: the mobile rail sticks below the wrapped header; `Sidebar.tsx` / `BlogList.tsx`: the search field is one tap target
- [x] (R40.6) `tokens.css`: dark-mode `--color-text-subtle` meets AA
- [x] (R40.7) Execute TC-4001–TC-4004; build, lint, full suite (126 passed); evidence entry; local commit; **awaiting owner approval**

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

## Phase 3y - Tenancy foundation: a workspace is one customer's blog (R41)

- [x] (R41.1) `firestore.rules`: `workspaces/{workspaceId}` with `members` (editor/viewer only), `private` (owner-only) and nested `blogs`; ownership is `ownerUid`, never a member role
- [x] (R41.2) `src/lib/workspaces.ts`: member-role normalisation, edit/manage helpers, slug and path helpers, the billing-free document builder, and the two reads
- [x] (R41.3, R41.4) Membership-gated writes, public posts, private team and billing, no `plan` on the public document and no browser ownership transfer
- [x] (R41.5) `functions/index.js`: a workspace upload needs that workspace's owner/editor and lands in `workspaces/<id>/blog-images/<uid>/`; the no-workspace path keeps R35 behaviour until R42
- [x] (R41) `scripts/run-rules-tests.mjs` + `tests/rules/r41-tenancy.test.mjs`: the real rules executed in the Firestore emulator (portable JDK 21 in `.tools/`, git-ignored)
- [x] (R41) TC-4104 static guard in `tests/r41-tenancy.spec.ts`; `playwright.config.ts` ignores `tests/rules/**` so node:test never runs inside the browser runner
- [x] (R41.6) Build, lint, `npm run test:rules` (3 passed) and the full suite (127 passed); bundle unchanged at 127.82 kB / 7.68 kB gzipped
- [x] Execute TC-4101-TC-4104; evidence entry; local commit; **published 2026-10-27**

## Phase 3z - The site's posts live in a workspace (R42)

- [x] (R42.1) `scripts/migrate-workspace.mjs`: copies `blogs` to `workspaces/<id>/blogs` with the same ids and values, creates the workspace with its owner, never deletes the source
- [x] (R42.2) Idempotent (a second run writes nothing, an existing destination is not overwritten) and inspectable (`--dry-run`); refuses to invent a workspace without an owner
- [x] (R42.3) `src/lib/blogs.ts` reads, writes, uploads and deletes through `workspaces/signal-and-noise/blogs`; the flat collection is no longer touched by the app
- [x] (R42.4) `imagePathFromUrl` / `storedImagePath` recognise `workspaces/<id>/blog-images/<uid>/<file>` as well as the legacy path
- [x] (R42) `tests/rules/r42-workspace-migration.test.mjs`: the real migration module executed against the emulator (copy, ids, timestamps, idempotency, dry run, owner refusal)
- [x] (R42.5) Build 127.91 kB / 7.68 kB gzipped, lint clean, `npm run test:rules` 5 passed, full suite 128 passed
- [x] Execute TC-4201-TC-4204; evidence entry; local commit; **published 2026-10-27**

## Phase 3aa - Workspace-scoped public site (R43)

- [x] (R43.1) `/w/:siteSlug` resolves by document id then by `slug`; an unknown or malformed slug renders **Site not found**, a failed read renders an unavailable notice
- [x] (R43.2) Tenant hero comes from `branding.title` / `tagline`; the page lists that workspace's posts only; repository seed articles stay on the default workspace; an empty workspace says **No posts yet**
- [x] (R43.3) Every link stays inside the tenant: card cover/title, category badge, tags, article breadcrumb, header brand/Home/Blogs and the search control; archive search and filters run on the tenant's posts
- [x] (R43.4) Public read needs no account and no rule was relaxed; `members`/`private` remain closed and writes remain membership-gated
- [x] (R43) `WorkspaceContext` keeps the Firebase seam out of the article card; `WorkspaceLayout` owns the resolve/not-found states
- [x] (R43.5) TC-4301-TC-4303 executed; build 129.15 kB JS / 7.68 kB CSS gzipped; lint clean; full suite 131 passed
- [x] Execute TC-4304; evidence entry; local commit; **published 2026-10-28**

## Phase 3bb - The launcher and a workspace's own admin (R44)

- [x] (R44.1) `/dashboard` behind a session; one card per owned workspace with its name, `/w/<slug>`, role, **View site** and **Admin**
- [x] (R44.2) No owned workspace -> **No sites yet**, no invented card; a failed read says so
- [x] (R44.3) `/w/:siteSlug/admin` gated by workspace ownership/membership, never the global role; viewer/stranger denied; failed read fails closed; unknown slug -> **Site not found**
- [x] (R44.4) Workspace admin lists only that site's posts and links to the public site and the launcher; no write controls before R45
- [x] (R44.5) `fetchWorkspaceRole` reads the workspace document first (an owner has no member document the rules would let it read), and treats `permission-denied` as "not a member"
- [x] (R44) **My sites** link in the account menu for every signed-in account
- [x] (R44.6) TC-4401-TC-4403 executed; build 130.74 kB JS / 8.18 kB CSS; lint clean; full suite 134 passed
- [ ] Execute TC-4404; evidence entry; local commit; **await owner approval**

## Phase 3cc - Workspace-scoped writes and tenant demo accounts (R45)

- [x] (R45.1) Every blog write takes `workspaceId`; no write falls back to `SITE_WORKSPACE_ID`; a missing id is refused
- [x] (R45.2, R45.3) `/w/:siteSlug/admin` is one gate with the post list and a composer; Edit, Delete and Write a post all pass the resolved workspace; the global panel keeps repository articles read-only
- [x] (R45.4, R45.5) `firestore.rules` and `functions/index.js`: the platform admin writes every workspace; ownership transfer and billing stay refused; tenant roles stay confined
- [x] (R45.6) `scripts/seed-demo-tenants.mjs` and the git-ignored `.demo-tenants.json`; `pine-and-pixel` and `orbit-analytics` seeded idempotently
- [x] (R45) `tests/rules/r45-global-admin.test.mjs`, `tests/r45-workspace-writes.spec.ts`; the R38, R42 and R44 guards updated for the explicit workspace
- [x] (R45.7) Build 131.13 kB JS / 8.17 kB CSS gzipped; lint clean; `npm run test:rules` 7 passed; full suite (recorded below)
- [x] (R45.2, R45.6) Owner follow-up: the demo passwords were reset to short, typeable values and both accounts signed in through `/signin`; the **Write a post** label was drawn in the same indigo as its fill and now passes 4.5:1
- [ ] Execute TC-4501-TC-4504; evidence entry; local commit; **await owner approval**

## Phase 3dd - A single-site owner lands on their own site (R46)

- [ ] (R46.1, R46.4) `src/lib/landing.ts` decides the landing as a pure function; `src/lib/sign-in-landing.ts` resolves it through the workspace seam and fails closed to `/`
- [ ] (R46.1, R46.2) `AuthPage` sends both email and Google sign-ins through the resolver; the header offers **My site** to a single-site owner and **My sites** otherwise
- [ ] (R46.3, R46.4) A multi-site account lands on `/dashboard`; the platform admin and a site-less reader keep `/`; R43's in-tenant nav is unchanged
- [ ] (R46.5) Build, lint, `npm run test:rules` and the full suite green; bundle inside the R14 budgets; evidence entry; local commit; **await owner approval**
