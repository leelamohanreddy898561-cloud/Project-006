# Requirements: AI Blog — "Signal & Noise"

**Version:** 2.1 (ID-based format)
**Date:** 2026-10-23
**Status:** In progress — **R0–R2 and R14–R39 implemented, verified and published (R15 superseded by R18); R3–R13 not started**

---

## 1. Overview

A small blog / content website about AI, built with **React + TypeScript + Vite**,
styled with **plain CSS**. The site publishes articles organized by category and
tag, with a responsive reading experience and static hosting deployment.

Scope: approximately 4–5 pages (home, AI updates list, post detail, about, plus
category/tag index pages). Simple and content-focused.

## 2. Goals

- Publish and browse AI articles with a fast, readable experience.
- Make content easy to find via search, tags, and topics.
- Keep the site lightweight and easy to deploy as static files.
- Keep the codebase simple, typed, and maintainable.

## 3. Tech Stack

| Concern | Choice |
| --- | --- |
| Framework | React 19 (SPA) |
| Language | TypeScript (strict mode) |
| Build tool | Vite |
| Routing | React Router |
| Styling | Plain CSS (CSS custom properties for theming) |
| Content | Markdown files with frontmatter, rendered with `marked` |
| Backend | Firebase (Auth, Firestore, Storage, Analytics) |
| Testing | Playwright (`@playwright/test`) |
| Linting | oxlint |
| Hosting | Static host — Firebase Hosting (configured), Netlify/Vercel/GitHub Pages also viable |

## 4. Decision Log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-10-20 | Plain CSS over Tailwind CSS | Small, mostly static 4–5 page blog; Tailwind's tooling pays off for component-heavy apps, not here. CSS custom properties give tokens/theming with zero build complexity. |
| 2026-10-20 | Vite + React Router SPA over Next.js | No SSR requirement; static hosting is simpler and sufficient. |
| 2026-10-20 | Markdown files + `marked` for content | Author-friendly format; one small, well-maintained dependency. |
| 2026-10-21 | Workflow: ID-based docs + Playwright + evidence | Keeps rigor without one-file-per-requirement sprawl; generated test reports are stronger proof than hand-written notes. |
| 2026-10-21 | Add Firebase (Auth, Firestore, Storage, Analytics, Hosting) | Supersedes the earlier "no backend in v1" scope note. Content stays in markdown for now; Firebase provides auth, storage, analytics, and hosting. Config via git-ignored `.env`. |
| 2026-10-21 | Firebase is **lazily initialized** (`getFirebase()`), not eagerly imported | Eager init put 137 kB of SDK in the initial bundle, breaking the R14.1 budget. Nothing in the app uses Firebase yet, so on-demand init restores the budget with zero feature loss. |
| 2026-10-21 | Brand renamed to **AI Pulse**; nav becomes Home / Topics / Blogs / About; flat header replaced by a glassmorphism design (R18 supersedes R15) | Project owner's new direction. "Categories" renamed to "Topics" everywhere; "AI Updates" relabelled "Blogs". Auth UI (Sign In / Sign Up) enters scope as header controls, backed by the already-integrated Firebase Auth. |
| 2026-10-23 | `/blog` keeps its filter state in the URL (`q`, `topic`, `tag`); typing replaces the history entry instead of pushing one per keystroke | A filtered view is shareable and reload-safe (R2.4) without the back button stepping through every character typed. |
| 2026-10-23 | Requirements may be published out of numeric order; R26's truth guard checks the latest claim against the newest publish entry in `evidence.md`, not against the highest requirement number | R2 shipped after R30. The old "highest ID = latest" assumption was a property of past sequencing, not a requirement; tying the claim to the recorded publish event keeps the check honest when a lower-numbered requirement is backfilled. |
| 2026-10-24 | Roles live in `users/{uid}.role`; the client guard is UX, `firestore.rules` is the enforcement; self-promotion is blocked by rules, not by hiding a button | A route guard can always be bypassed by editing the client. The rule that `role` cannot change on update is what makes "admin" meaningful, and it also keeps an admin's role safe from accidental overwrite on sign-in. |
| 2026-10-26 | A document in `blogs` is published the moment it is saved; the collection is public to read and admin-only to write (R37) | There is no draft workflow, so a `published` flag could only lie. Making the collection the published set means the post saved before this change — which carries `published: false` — is visible too, without a migration. The public read also retired `authorEmail` from the document: an address that is fine in an admin-only collection must not be published with the post. |
| 2026-10-26 | Blog management lives in the existing **All Blogs** dashboard section rather than a fourth sidebar item (R38) | R32.1 fixes the sidebar at exactly three items. Making All Blogs the management view satisfies "a Manage Blogs page" without reopening that criterion: the same route, the same nav label, and the list R32.5 already requires, now with Edit/Delete for the Firestore posts that can actually be changed from the browser. Repository articles stay read-only there because editing one is a commit, not a Firestore write. |
| 2026-10-26 | Uploads move from the browser Storage SDK to an admin-gated Cloud Function (R35) | This project's Storage bucket does not apply Storage Security Rules: `allow read, write: if true` at the root still returns 403 for anonymous and Firebase-authenticated callers, and the fault survived re-provisioning the bucket through Firebase's own `defaultBucket` API, a correct rules release, billing enabled, App Check off and IAM bindings. The Admin SDK is not subject to those rules, so the write moved server-side, where the same `users/{uid}.role` check is enforceable and cannot be bypassed by the client. Covers are made public per object because a cover is meant to be public; `storage.rules` stays in the repo as the rule the client path would need once the bucket behaves. |

## 5. Out of Scope (v1)

- Comments / discussion system.
- User-facing authentication UI (the Firebase Auth *integration* is in scope; sign-in screens are a later increment).
- Server-side rendering.
- RSS feed (candidate for v2).
- Analytics beyond the standard Firebase Analytics integration.
- **Firestore/Storage security rules** — required before either is used with real data; configured in the Firebase console, not in this repo.

## 6. Assumptions

- Content is authored as local markdown files committed to the repo.
- No custom backend server; Firebase provides managed services.
- Markdown content is trusted (authored in-repo); no user-generated content is rendered.

---

## 7. Requirements

Each requirement has an ID and **testable acceptance criteria**. Acceptance
criteria map to test cases in `test-cases.md` (e.g. `R2` → `TC-2xx`).

### R0 — Project scaffold and tooling

The project builds, lints, tests, and serves locally with the agreed stack.

- **AC0.1** `npm run dev` starts a dev server on `127.0.0.1:5173` with no errors in the console.
- **AC0.2** `npm run build` completes with TypeScript strict mode enabled and zero errors.
- **AC0.3** `npm run lint` passes with zero warnings.
- **AC0.4** `npx playwright test` runs and produces an HTML report.
- **AC0.5** The repository has an initial commit containing the workflow documents.

### R1 — Home page

Visitors immediately understand what the site is and can reach the latest content.

**Hero section (R1.1–R1.6):**

- **AC1.1** The hero shows the headline **"Explore the Future of AI"**, a short description, and a primary **"Start Reading"** button linking to `/blog`.
- **AC1.2** An AI network effect renders behind the hero content — drifting nodes connected by lines, moving slowly.
- **AC1.3** A floating **popular AI topic** card sits on the right side with a gentle float animation, cycling through topics.
- **AC1.4** All hero animation is disabled when the user prefers reduced motion.
- **AC1.5** On mobile (360px) the hero stacks — text first, card below — with no horizontal overflow.
- **AC1.6** Hero text keeps WCAG AA contrast (4.5:1) over the network background in both themes.

**Below the hero (later increments):**

- **AC1.7** ~~A "Featured reading" section shows posts marked `featured: true`.~~ *(superseded by R19)*
- **AC1.8** ~~A "Latest updates" section shows the most recent posts, newest first.~~ *(superseded by R19)*
- **AC1.9** ~~A "Browse by topic" section lists every topic with its post count.~~ *(superseded by R19)*

### R19 — Home main content layout

Below the hero, the home page presents the latest articles alongside a sidebar of
discovery tools.

**Layout**

- **AC19.1** A two-column main content area sits below the hero: the article column takes roughly 70% of the width and the sidebar roughly 30%.
- **AC19.2** The article column shows the latest posts in a grid — two columns on desktop, one on mobile.
- **AC19.3** Below 1000px the whole area stacks to a single column (articles first, sidebar second) with no horizontal overflow.

**Blog card**

- **AC19.4** Each card shows, in order: a cover image at the top, a category badge, the title, the read time (e.g. "8 min read"), the author (avatar + name), and a bookmark button.
- **AC19.5** Hovering a card lifts it slightly and zooms its cover image.
- **AC19.6** Both hover effects are disabled when the user prefers reduced motion.
- **AC19.7** The bookmark button toggles its state and reflects it accessibly via `aria-pressed`.
- **AC19.8** Card text meets WCAG AA contrast (4.5:1) in both themes.

**Sidebar**

- **AC19.9** The sidebar contains three sections: **Trending Topics**, a **search bar**, and **Quick Filters**.
- **AC19.10** Typing in the sidebar search filters the article grid by title, excerpt, topic, or tag.
- **AC19.11** The Quick Filters (All / Latest / Quick reads / Featured) change which articles are shown.
- **AC19.12** An empty result shows a friendly empty state rather than a blank column.

**Quality**

- **AC19.13** Build and lint pass, and all previously passing tests stay green.

### R2 — Blogs list with search and filters

Readers can find any post from the main index.

- **AC2.1** `/blog` lists all posts, newest first, showing title, excerpt, date, reading time, category, and tags.
- **AC2.2** Typing in the search box filters posts by title, excerpt, category, and tags (case-insensitive, all terms must match).
- **AC2.3** Clicking a topic chip filters to that topic; clicking "All" clears it.
- **AC2.4** Filters are reflected in the URL (`?q=`, `?topic=`, `?tag=`) so a filtered view is shareable.
- **AC2.5** When no posts match, an empty-state message is shown.
- **AC2.6** The result count ("N posts") matches the number of cards rendered.
- **AC2.7** Clicking a tag chip filters to that tag; clicking it again clears it.

### R3 — Post detail page

A post is readable, navigable, and connected to related content.

- **AC3.1** `/blog/:slug` renders the post's markdown as formatted HTML (headings, lists, code blocks, blockquotes, links).
- **AC3.2** The page shows the category, publication date, and reading time.
- **AC3.3** A table of contents lists all `h2`/`h3` headings, and each entry links to the corresponding heading anchor.
- **AC3.4** Prev/next navigation links to the newer and older posts.
- **AC3.5** A "Related posts" section shows up to 2 posts sharing a category or tags.
- **AC3.6** Tags link to their tag pages.

### R4 — Topics index

- **AC4.1** `/topics` lists every topic with its post count.
- **AC4.2** Each entry links to `/topics/:slug`.

### R5 — Topic detail page

- **AC5.1** `/topics/:slug` shows the topic name and the number of posts in it.
- **AC5.2** Only posts in that topic are listed.
- **AC5.3** An unknown topic slug shows the 404 page.

### R6 — Tag detail page

- **AC6.1** `/tags/:tag` shows the tag name and the number of posts carrying it.
- **AC6.2** Only posts with that tag are listed.
- **AC6.3** An unknown tag shows the 404 page.

### R7 — About page

- **AC7.1** `/about` explains what the site covers and who writes it, using semantic headings.
- **AC7.2** The page links to `/blog` and `/topics`.

### R8 — 404 page

- **AC8.1** Any unknown route renders a 404 page with a "404" indicator and a message.
- **AC8.2** The 404 page offers links back to `/blog` and `/`.

### R9 — Theme toggle

- **AC9.1** A toggle in the header switches between light and dark themes.
- **AC9.2** The chosen theme persists across page reloads (`localStorage`).
- **AC9.3** On a first visit with no stored preference, the system `prefers-color-scheme` setting is respected.
- **AC9.4** Body background and text colors actually change between themes.

### R10 — Responsive layout

- **AC10.1** All pages are usable at 360px, 768px, 1024px, and 1920px widths with no horizontal scrolling.
- **AC10.2** Navigation and filters remain reachable at 360px.

### R11 — Accessibility

- **AC11.1** Every page has a skip-to-content link that becomes visible on keyboard focus.
- **AC11.2** All interactive elements are reachable and operable by keyboard, with a visible focus indicator.
- **AC11.3** Semantic landmarks are used (`header`, `nav`, `main`, `article`, `footer`).
- **AC11.4** Text contrast meets WCAG 2.1 AA in both themes.

### R12 — SEO basics

- **AC12.1** Each page sets a unique `<title>` and meta description.
- **AC12.2** `sitemap.xml` and `robots.txt` are served from the site root.
- **AC12.3** Open Graph title/description tags are present.

### R13 — Content model

- **AC13.1** Posts are markdown files with frontmatter: `title`, `excerpt`, `date`, `category`, `tags`, optional `featured`.
- **AC13.2** Reading time is calculated automatically from the content.
- **AC13.3** Posts are sorted newest first everywhere they are listed.
- **AC13.4** Adding a new `.md` file requires no code changes.

### R14 — Performance budget

- **AC14.1** Production build JavaScript is under 150 kB gzipped.
- **AC14.2** Production build CSS is under 25 kB gzipped.
- **AC14.3** The home page renders its main content without console errors.

### R15 — Site header *(SUPERSEDED by R18)*

> **Superseded on 2026-10-21.** The project owner replaced the flat header with a
> glassmorphism design and a new brand. The original acceptance criteria are kept
> below for the historical record; **R18 is the active requirement.**
> Evidence entries referencing R15 remain valid as history and are not edited.

The original header provided brand identity and primary navigation on every page.

- **AC15.1** The header displays the site brand, linking to `/`.
- **AC15.2** The header navigation links to Home (`/`), AI Updates (`/blog`), Categories (`/categories`), and About (`/about`).
- **AC15.3** The nav link for the current route is visually marked as active.
- **AC15.4** The header is present on every page as a `<header>` landmark.

### R18 — Glassmorphism header

A translucent, glass-like header carries the new **AI Pulse** brand, the primary
navigation, and the account/search controls. It works in both themes and keeps
text readable over any content behind it.

- **AC18.1** The header uses a glassmorphism treatment: a translucent background with a backdrop blur and a subtle border, in both light and dark themes.
- **AC18.2** Left side: a glowing AI-themed logo plus the brand name **AI Pulse**, together linking to `/`.
- **AC18.3** Center: navigation links **Home** (`/`), **Topics** (`/topics`), **Blogs** (`/blog`), and **About** (`/about`), each with a smooth gradient effect on mouse hover.
- **AC18.4** Right side: a search icon linking to `/blog`, a dark/light mode toggle, and **Sign In** / **Sign Up** buttons linking to `/signin` and `/signup`.
- **AC18.5** The theme toggle switches between light and dark and persists the choice across reloads *(delivers R9)*.
- **AC18.6** On a first visit with no stored preference, the system `prefers-color-scheme` setting is respected.
- **AC18.7** Header text meets WCAG 2.1 AA contrast (4.5:1) in both themes.
- **AC18.8** `/signin`, `/signup`, `/topics`, `/blog`, and `/about` all render a real page — no link in the header leads to a blank screen.
- **AC18.9** The nav link for the current route is visually marked as active.
- **AC18.10** Build and lint pass, and the existing home page test still passes.
- **AC18.11** The logo glow animation is disabled when the user prefers reduced motion.

### R16 — Firebase integration

Firebase is initialized **on demand** (lazily), so the SDK never weighs down the
initial page load, while Auth, Firestore, Storage, and Analytics remain fully
available to features that need them.

- **AC16.1** The `firebase` SDK is installed and configuration is read from `import.meta.env.VITE_FIREBASE_*` variables — no credentials in source or git history.
- **AC16.2** A committed `.env.example` documents every required variable; `.env` is git-ignored.
- **AC16.3** A `getFirebase()` loader initializes Firebase on first use and returns `app`, `auth`, `db` (Firestore), `storage`, and `analytics` (browser-only, requires `measurementId`).
- **AC16.4** No Firebase code is loaded on pages that do not use it (this is what keeps R14.1 within budget).
- **AC16.5** Missing configuration fails loudly with a clear, actionable error — and does not prevent the rest of the site from rendering.
- **AC16.6** `firebase.json` configures Hosting to serve `dist/` with an SPA rewrite so client-side routes work.
- **AC16.7** `.firebaserc` records the deploy target project.
- **AC16.8** Build and lint pass with the integration in place, and the existing home page still renders.
- **AC16.9** `getFirebase()` initializes successfully against the real project (requires real credentials — see evidence).

### R17 — Change log export

A complete record of project changes is generated from real repository data,
reviewable without Firebase, and syncced to Firestore once credentials exist.

- **AC17.1** `npm run changelog` regenerates `changeLog.json` from actual git history — commits, changed files, and per-change verification results.
- **AC17.2** `changeLog.json` is committed, so changes are reviewable without any Firebase access.
- **AC17.3** A sync script writes the change log to the Firestore `changeLog` collection, using credentials from `.env`.
- **AC17.4** The sync script fails with a clear, actionable message when credentials are missing.

### R20 — Footer and newsletter subscription

The bottom of the page carries a newsletter sign-up and a four-column footer,
closing every page with navigation, topics, social links, and legal links.

**Newsletter (above the footer)**

- **AC20.1** A newsletter subscription box sits directly above the footer, with an email field, a Subscribe button, and a short value statement.
- **AC20.2** Submitting an empty or malformed email shows an inline error and does **not** show a success state.
- **AC20.3** Submitting a valid email shows an inline success confirmation, clears the field, and is announced via a live region.
- **AC20.4** The email field is labelled, and the error/success text is tied to it programmatically (`aria-describedby`, `aria-invalid`).

**Footer columns**

- **AC20.5** The footer has exactly four columns: (1) brand logo and intro, (2) Quick Links, (3) AI Categories, (4) Social Links.
- **AC20.6** Quick Links are real in-app routes (Home, Blogs, Topics, About) using the router, not full page reloads.
- **AC20.7** AI Categories link to their topic routes and are derived from a single source of truth shared with the rest of the site.
- **AC20.8** Social Links include **X**, **GitHub**, and **LinkedIn**, each with an accessible name, opening in a new tab with `rel="noopener noreferrer"`.

**Bottom bar**

- **AC20.9** A bottom bar shows the copyright notice with the current year and links to the Privacy Policy (and Terms).
- **AC20.10** The Privacy Policy link resolves to a real route, not a dead `#`.

**Quality**

- **AC20.11** Below 900px the footer stacks to a single column with no horizontal overflow.
- **AC20.12** Footer text meets WCAG AA contrast (4.5:1) in both themes.
- **AC20.13** Build and lint pass, and all previously passing tests stay green.

### R21 — Repository and workflow hygiene

Cleanup found by the repository audit: remove local-only state and placeholder
specs from version control, and stop doing the same publish work twice.

- **AC21.1** `.firebase/` (CLI deploy cache) is untracked and listed in `.gitignore`, so local machine state never reaches the repository.
- **AC21.2** The permanently-skipped template spec (`tests/example.spec.ts`) is removed; its convention is documented in `test-cases.md` instead.
- **AC21.3** A local test run reports **zero skipped** tests. Cases that are dev-only skip solely against a remote base URL, by design.
- **AC21.4** Publishing performs a **single** change-log cycle per release: one regenerate → sync → verify → commit → push. The workflow in `AGENTS.md` reflects that order.
- **AC21.5** `firebase-tools` is pinned as a devDependency, so a deploy uses one fixed version instead of `npx -y` resolving a new one each time.
- **AC21.6** The header and footer home links have **distinct** accessible names.
- **AC21.7** Evidence screenshots and `changeLog.json` are intentionally retained and documented as files that grow with each release.
- **AC21.8** Build, lint, and all tests pass, and the bundle stays within budget.

### R22 — Deploy tooling footprint

Pinning the Firebase CLI as a project dependency made deploys reproducible but
grew `node_modules` to ~456 MB. Keep the pin, drop the install cost.

- **AC22.1** `npm run deploy` runs a **pinned** `firebase-tools@15.34.1` through `npx --yes`, not through a project dependency.
- **AC22.2** `firebase-tools` is removed from `devDependencies`, so a fresh `npm install` does not fetch it or its dependency tree.
- **AC22.3** The pinned command resolves and reports version `15.34.1`.
- **AC22.4** The deploy target and non-interactive flag are unchanged (`project-006-e6ae1`, `--only hosting`, `--non-interactive`).
- **AC22.5** The project's `node_modules` is materially smaller, and build, lint, and tests still pass.

### R23 — Blog detail page

Clicking an article opens a comfortable reading page: a header image, a
constrained prose column, a left rail of actions that follows the reader, then
comments and related articles.

**Routing**

- **AC23.1** Clicking an article card (home grid or related list) opens `/blog/<slug>`.
- **AC23.2** An unknown slug renders a not-found state with a way back home, not a blank page.
- **AC23.3** The document title is set to the article title, and restored on navigation away.

**Reading layout**

- **AC23.4** A header image appears at the top of the article, above the body.
- **AC23.5** Markdown in the article body renders as real HTML: headings, paragraphs, lists, blockquotes.
- **AC23.6** The prose column is constrained to a comfortable measure (roughly 60–75 characters) with line-height ≥ 1.6 and font-size ≥ 16px.
- **AC23.7** Below 1000px the action rail becomes a horizontal sticky bar; there is no horizontal overflow.

**Floating action rail**

- **AC23.8** A left-side rail offers **Like**, **Share**, and **Bookmark**.
- **AC23.9** The rail is sticky and remains in view while the body scrolls.
- **AC23.10** Like toggles, exposes `aria-pressed`, and its visible count changes.
- **AC23.11** Share copies the article URL and reports the outcome in a live region; when the Clipboard API is unavailable it shows the URL to copy instead.
- **AC23.12** Bookmark toggles and exposes `aria-pressed`.
- **AC23.13** Each action has an accessible name.

**Comments**

- **AC23.14** A comment section follows the article, with a labelled name field and comment field.
- **AC23.15** Submitting a valid name and comment prepends it to the list and announces it in a live region.
- **AC23.16** Submitting with an empty name or comment shows an inline error and adds nothing.
- **AC23.17** A visible notice states that comments are not persisted yet.

**Related articles**

- **AC23.18** Up to three related articles are shown, excluding the current one, preferring the same category then shared tags.
- **AC23.19** Each related card opens its own `/blog/<slug>`.

**Quality**

- **AC23.20** Article and comment text meets WCAG AA contrast (4.5:1) in both themes.
- **AC23.21** Build and lint pass, all tests stay green, and the bundle stays within budget.

### R24 — Sign in and sign up pages

Real `/signin` and `/signup` pages: a transparent glassmorphic card floating on
a soft AI gradient, with email/password inputs and a "Sign in with Google"
button. **UI only** — the pages are structured so wiring Firebase Auth touches
exactly one file.

**Pages**

- **AC24.1** `/signin` and `/signup` render purpose-built pages; the placeholders are gone.
- **AC24.2** Both show an email field, a password field, a "Sign in with Google" button, and a submit button.
- **AC24.3** Each page sets its own document title and restores the previous one on unmount.

**Visual**

- **AC24.4** The form sits in a glassmorphic card: a semi-transparent fill with a backdrop blur, a hairline border, and a soft shadow.
- **AC24.5** Behind the card, soft indigo/cyan/violet gradient glows give the panel an AI feel without a bitmap asset.
- **AC24.6** The glows are decorative only — hidden from assistive technology and non-interactive.

**Validation**

- **AC24.7** Email and password are required. An empty email, a malformed email, an empty password, or a password shorter than 8 characters shows an inline error and blocks submission.
- **AC24.8** Each error is associated with its field (`aria-invalid` + `aria-describedby`) and announced (`role="alert"`).
- **AC24.9** Editing a field clears that field's error.
- **AC24.10** Sign up asks for a new password and sign in for a current one (`autocomplete` differs), and both declare `inputmode`/`autocomplete` correctly for the field type.

**Actions**

- **AC24.11** Submitting valid credentials reports the outcome in a `role="status"` live region. Today that outcome is "not connected yet" — the page never claims a sign-in succeeded.
- **AC24.12** The Google button reports its outcome in the same live region.
- **AC24.13** The password can be revealed and hidden; the toggle exposes `aria-pressed`, an accessible name that reflects the state, and switches the input `type`.
- **AC24.14** Each page links to the other and the link navigates correctly.

**Integration seam**

- **AC24.15** All authentication calls go through `src/lib/auth.ts`; the pages import nothing else auth-related, so enabling Firebase Auth is a one-file change.

**Quality**

- **AC24.16** At 360 px there is no horizontal overflow and the card remains readable.
- **AC24.17** All text meets WCAG AA contrast (4.5:1) in both themes, counting the real composited glass colour.
- **AC24.18** Build and lint pass, all tests stay green, and the bundle stays within budget.

### R25 — Test runs must not mutate committed evidence

Running the suite must never change a committed file. The proof screenshots in
`evidence/screenshots/` stay committed and referenced by `evidence.md`, but
they are refreshed **only** when explicitly asked.

- **AC25.1** A normal test run (`npm test`, `npx playwright test`, including against `PLAYWRIGHT_BASE_URL`) leaves the working tree clean — `git status --short` is empty afterwards.
- **AC25.2** Screenshots captured during a normal run are written under the git-ignored `test-results/` directory, not into `evidence/`.
- **AC25.3** Refreshing `evidence/screenshots/` requires the explicit `npm run evidence:screenshots` command; no test run does it as a side effect.
- **AC25.4** A guard test fails if any spec writes a screenshot to a literal path or to anything under `evidence/`; captures must go through the shared helper.
- **AC25.5** `evidence/screenshots/*.png` stays tracked and un-ignored, and the images referenced by `evidence.md` keep resolving.

### R26 — `AGENTS.md` current state reflects what is actually published

- **AC26.1** Section 9 lists every requirement that is implemented, verified and published, up to and including the most recent one.
- **AC26.2** Superseded requirements are still named as superseded rather than removed.
- **AC26.3** Section 9's "not yet built" list contains only requirements that genuinely remain unbuilt.
- **AC26.4** No figure in Section 9 contradicts the latest evidence entry.

### R27 — Published-site verification runs a smoke subset

Verifying production currently re-runs all 88 tests against the live host. On a
slow connection a single 344 kB bundle download can consume most of a test's
budget, so one release can spend several minutes re-proving what the local run
already proved. Production verification runs a small, fixed subset instead —
enough to prove the deployed artifact serves every kind of route and its main
client-side flows, and nothing more.

- **AC27.1** `npm run verify:prod` runs only the smoke subset against the deployed site, and fails immediately with a clear message when `PLAYWRIGHT_BASE_URL` is not set (it must never fall back to localhost).
- **AC27.2** The subset is carried by an `@smoke` tag on existing tests; no test body is duplicated or forked for production.
- **AC27.3** `npm test` still runs the whole suite unchanged — the tag selects a subset for production, it never removes a test from the local run.
- **AC27.4** The subset holds between 6 and 12 tests and covers every route class: home, blog list, topic index, about, article detail, unknown slug, sign in, sign up and the 404 route, plus at least one interactive flow.
- **AC27.5** A guard test fails when a tagged test disappears, when an untagged test is added to the declared manifest, or when a required route class loses coverage — so the subset cannot silently shrink.
- **AC27.6** `npm run verify:prod` exits non-zero when any smoke test fails and never retries to mask a failure.
- **AC27.7** `AGENTS.md` names `npm run verify:prod` as the production check, so the workflow and the command cannot drift apart.

### R28 — One branch per requirement; `main` only holds published states

Every requirement is built on its own branch and merged into `main` only after
the owner approves it. `main` therefore never contains half-finished work: it is
a straight line of states that were each verified and published.

- **AC28.1** Every requirement is implemented on its own branch, created from an up-to-date `main`, named `<type>/r<N>-<slug>` where `<type>` is `feature`, `fix`, `chore` or `docs`.
- **AC28.2** No work is committed directly to `main`. At publish time the branch is fast-forwarded into `main` (`git merge --ff-only`), so `main` stays linear and every commit on it is a state that was approved and published.
- **AC28.3** If `main` has moved and the merge cannot fast-forward, the branch is rebased onto `main` and fully re-verified before publishing. Never force-push, and never add a merge commit.
- **AC28.4** Pushing the work branch before approval is allowed and is not publishing, because it cannot affect `main` or production. Merging into `main`, deploying, and the Firestore sync remain gated on approval.
- **AC28.5** A guard test fails if `AGENTS.md` stops stating the branch rule, the branch naming pattern, the fast-forward publish, or the rebase rule.
- **AC28.6** Nothing else in the workflow changes: the full local suite still passes, production verification is still `npm run verify:prod`, and there is still exactly one change-log cycle per publish.

---

### R29 — Live authentication: Google and email/password

R24 built the sign-in and sign-up pages against a seam that reported
"not connected", because no provider was enabled on the project. This
requirement makes authentication real: the same pages and the same seam, now
talking to a live Firebase project, so a visitor can create an account, sign
in, stay signed in across reloads and sign out — with Google or with email and
password — locally and on the deployed site.

- **AC29.1** Email/Password is enabled for the project, and an account created through `/signup` produces a real session: the header shows the account, and a reload keeps the visitor signed in.
- **AC29.2** An unknown email or wrong password on `/signin` returns the provider's own error as a plain-English sentence in the live region, and no session is created.
- **AC29.3** Signing out — from the header account menu or from the auth page — ends the session, and a reload does not restore it.
- **AC29.4** Google sign-in completes with a real Google account and lands the visitor signed in on the home page; a pop-up closed before it finishes leaves them signed out with an explanation. *(Manual: a Google account and a consent screen cannot be automated.)*
- **AC29.5** A signed-in visitor who opens `/signin` or `/signup` sees the session and a way out, not a form that would sign them in a second time.
- **AC29.6** The initial JS bundle stays inside the R14 budgets — the auth SDK is loaded on demand and the entry chunk never contains it.
- **AC29.7** `firebase/auth` is imported only by `src/lib/auth.ts` and `src/lib/firebase.ts`; every page and component reaches authentication through the seam.
- **AC29.8** With the Firebase SDK unreachable, the home page still renders completely and behaves as signed out — the first paint never depends on the network.
- **AC29.9** Production verification includes a real failed sign-in against the deployed site, so the provider is proven to answer there as well as locally.
- **AC29.10** The account the suite creates is deleted when the run ends; no test account survives in the project.

### R30 — Lean loop and consolidated workflow guards

The workflow had accumulated cost that no longer bought quality: sixteen tests
read our own documents back, a documentation typo forced a full-suite re-run,
every requirement restated test cases that already existed, and evidence
entries had grown to sixty lines. This requirement makes the loop cheap
without weakening the gate — verification is tiered, test cases are capped,
evidence is short, and the document guards live in one spec.

- **AC30.1** `AGENTS.md` Section 2 describes the lean loop: a fast loop while working (build, lint, the touched spec), exactly **one** full-suite run before review, and after a fix re-running only the affected spec unless shared code changed.
- **AC30.2** Section 2 caps new test cases at four per requirement (a consolidated group of existing guards counts as one) and requires citing an existing TC instead of writing a duplicate.
- **AC30.3** Section 2 requires a short evidence entry — commands, a one-line result each, artifacts, an evaluation sentence — instead of an exhaustive one.
- **AC30.4** The document and workflow guards from R25–R28 (16 tests) are consolidated into a single spec; every distinct assertion they made is still made. The guard count drops; the coverage does not.
- **AC30.5** The four retired spec files are removed from the repository and from the `AGENTS.md` Section 5 file map, and the consolidated spec is named there.
- **AC30.6** The branch rule, the fast-forward publish, the rebase rule, the ban on force-push and merge commits, and "pushing a work branch is not publishing" are all still asserted by the consolidated spec.
- **AC30.7** The full local suite still passes and is smaller than before (86 expected, from 96), and `npm run verify:prod` is unchanged.
- **AC30.8** The approval gate (Section 3) and the non-negotiables (Section 4) are unchanged - simplification never touches the gate.

---

### R31 — User roles and the protected admin route

Every account carries a role in a Firestore `users/{uid}` document, and `/admin`
is reachable only by accounts with `role: "admin"`. Everyone else is sent away
before any admin content renders. Role checks in the browser are convenience;
the committed Firestore rules are what actually stop a user from promoting
themselves.

- **AC31.1** Signing in or signing up (email/password or Google) ensures a
  `users/{uid}` document exists with `email` and a `role`; it is created with
  `"student"` when absent, and an existing document — including an admin's — is
  never overwritten.
- **AC31.2** Roles are `"admin" | "student" | "user"`, and only `"admin"` grants
  admin access; any other value, an unknown value, or a missing document is
  treated as a standard user.
- **AC31.3** `/admin` renders an admin page (heading **Admin**, the signed-in
  email, and the role) for a signed-in account whose role is `"admin"`.
- **AC31.4** A signed-in standard user who opens `/admin` is redirected to `/`
  and never sees admin content.
- **AC31.5** A signed-out visitor who opens `/admin` is redirected to `/signin`.
- **AC31.6** While the session or role is loading, `/admin` shows an accessible
  status message and never renders admin content.
- **AC31.7** If the role cannot be read (Firestore unreachable or permission
  denied), access fails closed — treated as a standard user — and the rest of the
  site still renders and behaves as signed in/out normally.
- **AC31.8** `firestore.rules` lets an account read, create, update and delete
  only its own `users/{uid}` document, forbids creating or changing a role to
  `"admin"` from the client, and denies every other users-collection operation.
  `npm run deploy:rules` publishes the file; the existing `changeLog` access is
  deliberately unchanged until R17's sync authenticates.
- **AC31.9** Build and lint pass, all previously passing tests stay green, and
  the bundle stays within the R14 budgets.

---

### R32 — Admin dashboard

`/admin/dashboard` is the administrator's workspace: a sidebar navigation that
switches between the sections an admin actually works in, and a content panel
for each. It sits behind the R31 guard, so only an account whose role is
`"admin"` reaches it — the guard is not redefined here, it is reused.

**Shell and navigation**

- **AC32.1** `/admin/dashboard` renders an admin shell whose sidebar navigation
  contains exactly three items — **All Blogs**, **Add New Blog** and
  **Manage Users** — each a link to its own route, each with an accessible name.
- **AC32.2** Every dashboard route is behind the R31 guard: a signed-out
  visitor is sent to `/signin`, a signed-in standard account to `/` (TC-3102
  covers that account class), and an unknown `/admin/dashboard/*` path shows a
  not-found panel rather than a blank one.
- **AC32.3** Selecting a sidebar item opens the matching panel, and the item for
  the panel on screen is marked as the current one (`aria-current="page"`).
  Exactly one item is ever current.
- **AC32.4** The sidebar and the content sit side by side on desktop and stack
  to a single column below 1000px, with no horizontal overflow at 360px.

**All Blogs**

- **AC32.5** The panel lists every post — title, category, publication date and
  reading time — newest first, and each title links to its public
  `/blog/<slug>`.

**Add New Blog**

- **AC32.6** The panel is a composer with a title, a category, tags, an excerpt
  and a body. Every field is labelled; a missing title, category, excerpt or
  body shows an inline error tied to that field (`aria-invalid` +
  `aria-describedby`, announced with `role="alert"`) and blocks submission.
- **AC32.7** A valid submission composes the post's markdown frontmatter and
  body, reports the outcome in a live region, and offers the text for copying.
  It never claims the post is published: posts are markdown files in the
  repository, so committing the file is the publish step (R13 is not built).
  *(Superseded by R39: the panel now renders the R33 Firestore composer, because
  the markdown file it composed pointed at a `content/posts/` directory this
  repository does not have.)*

**Manage Users**

- **AC32.8** The panel shows the signed-in admin's own account and role, and
  states plainly that a role is changed in the Firebase console — the committed
  rules let an account read only its own `users/{uid}` document and forbid
  changing a role from the browser (R31.8).

**Quality**

- **AC32.9** Dashboard text meets WCAG AA contrast (4.5:1) in both themes.
- **AC32.10** Build and lint pass, all previously passing tests stay green, and
  the bundle stays within the R14 budgets.

---

### R33 — Admin blog composer at `/admin/add-blog`

`/admin/add-blog` is where an admin writes a new post: a title, a category, a
featured image uploaded to Firebase Storage, and the content. Submitting writes
one document to the Firestore `blogs` collection — the first time the site saves
content to Firebase instead of composing a repository file (R32).

**The page**

- **AC33.1** `/admin/add-blog` renders the composer behind the R31 guard: a
  signed-out visitor is sent to `/signin`, a signed-in standard account to `/`.
  The guard is reused, not redefined.
- **AC33.2** The form carries a **Blog title** text input, a **Category**
  dropdown, a **Featured image** file input and a **Content** textarea. Every
  control has a programmatic label.
- **AC33.3** The Category options come from the site's single source of truth
  for categories, so a new category appears in the dropdown without this page
  being edited (R20.7).
- **AC33.4** Blog title, Category and Content are required. Submitting with any
  of them missing shows an inline error on that field (`aria-invalid` +
  `aria-describedby`, announced with `role="alert"`) and writes nothing.
- **AC33.5** The featured image is optional. When one is chosen it must be an
  image (`image/*`) and no larger than 5 MB; anything else shows an inline error
  on the image field and blocks submission.
- **AC33.6** The chosen image is previewed before it is uploaded, and the stored
  URL is shown afterwards. While the upload and the write are in flight the
  submit control is disabled and the outcome is reported in a live region; the
  form never claims a save that Firebase did not confirm.

**The save**

- **AC33.7** The chosen image is uploaded to Firebase Storage under
  `blog-images/<uid>/…`, and the download URL is stored on the document as
  `imageUrl`. *(Revised by R35: the upload goes through the admin-gated
  function, because this bucket does not apply Storage Security Rules. The
  folder and the stored URL are unchanged.)*
- **AC33.8** One submission writes exactly one document to `blogs`, carrying the
  title, category, excerpt, tags, content, the image URL, a reading time, the
  signed-in account as author, and a creation timestamp. Nothing is written when
  validation fails. *(Revised by R37: the author is recorded by name and uid
  only — the email is no longer stored on a publicly readable post.)*
- **AC33.9** The document records that it is not published: no page reads
  `blogs` yet (R13 is not built), so a document written here is stored, not live.
  *(Revised by R37: every document in `blogs` is live — the home page, the
  `/blog` archive and the article pages read the collection.)*

**Rules**

- **AC33.10** `firestore.rules` grants read and write on `blogs` to an account
  whose `users/{uid}.role` is `"admin"`, and denies every other account. The
  check reads the same profile the guard reads, so it cannot be granted from the
  page it protects. *(Revised by R37: write stays admin-only; read is public,
  because a saved post is visitor-visible.)*
- **AC33.11** The upload is admin-only, image-only and capped at 5 MB.
  *(Revised by R35: enforced by the upload function, AC35.2–AC35.3, because this
  bucket does not apply Storage Security Rules. `storage.rules` keeps the same
  limits in the repository for the client path, the day the bucket enforces
  them; `npm run deploy:rules` still publishes both rule files.)*

**Quality**

- **AC33.12** Build and lint pass, all previously passing tests stay green, and
  the bundle stays within the R14 budgets.

---

### R34 — The featured image upload is refused for every account

R33's Storage rule declared its admin check one scope above the `{uid}` wildcard
it read, so the condition could not resolve and denied every account, admins
included. Because the upload runs before the document write, a save produced
neither a file nor a document — the reported symptom ("not saving into Firebase
Storage") was one defect, not two.

- **AC34.1** `storage.rules` passes the owner's uid into the admin check, so the
  function reads only variables in scope. *(Revised by R35: this project's bucket
  does not apply Storage Security Rules at all, so the rule cannot grant or deny
  anyone — the upload is enforced by the function instead. The rule stays
  correct for the client path.)*
- **AC34.2** A guard test fails when any function in `storage.rules` or
  `firestore.rules` references a wildcard that is neither a parameter nor
  declared in a scope enclosing the function — the defect class behind this bug.
- **AC34.3** The deny path stays proven: a throwaway non-admin account is refused
  a write to `blogs`, an upload into any `blog-images/` folder, and a
  self-promotion, and both services refuse anonymous writes.
- **AC34.4** One save by the admin account produces both the Storage file and the
  `blogs` document, and the live region reports the document id — the R33 promise
  observable end to end. A role is granted only in the console, so this is checked
  by the owner.
- **AC34.5** The fix is server-side, so the shipped bundle is unchanged, no
  hosting release is needed, and the R14 budgets are unaffected.

---

### R35 — Uploads work through an admin-gated Cloud Function

R33 uploaded the featured image with the browser Storage SDK, gated by
`storage.rules`. On this project that gate cannot work: the bucket does not apply
Storage Security Rules at all — `allow read, write: if true` at the root still
returns 403 for anonymous and Firebase-authenticated callers, and the fault
survives a correct rules release, a re-provisioned bucket, billing enabled, App
Check off and IAM bindings (see the decision log). The Admin SDK is not subject
to those rules, so the write moves server-side, and the admin check moves with
it. **This revises AC33.7 and AC33.11: the upload is still to
`blog-images/<uid>/`, but the enforcement is AC35.2, not the rule.**

- **AC35.1** The composer uploads the featured image through a callable Cloud
  Function (`uploadBlogImage`). The browser no longer writes Cloud Storage
  directly, and `src/lib/blogs.ts` remains the only module that talks to
  Firebase.
- **AC35.2** The function decides who may upload: no session returns
  `unauthenticated`; a signed-in account whose `users/{uid}.role` is anything
  other than `"admin"` returns `permission-denied`. Nothing is written in either
  case, and the check is server-side, so the client cannot bypass it.
- **AC35.3** The function accepts only image data URLs, refuses an empty payload,
  and refuses more than 5 MB — the same limits the form shows.
- **AC35.4** The object is written under `blog-images/<caller uid>/`, so one
  account cannot write into another's folder, and the returned URL is stored on
  the post as `imageUrl`.
- **AC35.5** Each uploaded cover is publicly readable through a per-object ACL,
  so a published post can serve it without a signed URL that expires, while the
  rest of the bucket stays private.
- **AC35.6** An image uploaded for a post that then fails to save is removed
  again by `deleteBlogImage`, which accepts only a path inside the caller's own
  folder.
- **AC35.7** The featured image is downscaled to a 1600 px longest edge at JPEG
  quality 0.85 before upload; formats the canvas cannot decode (SVG, animated
  GIF) fall back to the original bytes rather than failing.
- **AC35.8** `firebase.json` deploys the `functions` codebase, and
  `npm run deploy:functions` publishes it.
- **AC35.9** Build and lint pass, all previously passing tests stay green, and
  the initial bundle stays within the R14 budgets — the functions SDK is loaded
  on demand.

---

### R36 — Admin link in the account menu

An admin had to know the `/admin` URL to reach the workspace. The header's
account menu now offers the way in, but only to the accounts that can use it:
the role is read from the same `users/{uid}` profile the guard reads, and while
it is loading — or if it cannot be read — the link is absent. The link is a
shortcut, not a permission; `/admin/dashboard` still enforces R31.

- **AC36.1** A signed-in account whose role is `"admin"` sees an **Admin** link
  in the header's account menu.
- **AC36.2** The link is absent for a signed-out visitor and for a signed-in
  account whose role is anything other than `"admin"`, including while the role
  is still loading and when the read fails.
- **AC36.3** The link is an in-app link to `/admin/dashboard`, carries the
  accessible name **Admin**, and is operable by keyboard with a visible focus
  indicator.
- **AC36.4** The link stays visible at 360px without horizontal overflow, and
  its text meets WCAG AA contrast (4.5:1) in both themes.
- **AC36.5** The role is read through the existing `useUserRole` / `isAdminRole`
  seam — no second source of truth — and the link grants nothing: every
  `/admin` route still goes through the R31 guard.
- **AC36.6** Build and lint pass, all previously passing tests stay green, and
  the bundle stays within the R14 budgets.

---

### R37 — Saved blog posts are visible to visitors

The composer saves posts to the Firestore `blogs` collection (R33), but no page
reads it: a saved post exists only in the console. Every document in `blogs` is
now the published archive — saving is publishing — and the home page, the
`/blog` archive and `/blog/<slug>` merge saved posts with the repository seed
articles, so a visitor sees them without an account.

**This revises AC33.8** (the author's email is no longer stored: the document
becomes publicly readable), **AC33.9** (the collection is live, not stored-only)
and the read half of **AC33.10** (public read, admin-only write).

**What a visitor sees**

- **AC37.1** A saved post appears on `/blog` in the same card as a seed article:
  title, excerpt (from the document, or the opening of its content when the
  excerpt is empty), category, tags, date, reading time, author name and a cover
  — the stored `imageUrl`, or a default cover when the post has no image.
- **AC37.2** `/blog/<slug>` renders a saved post: title, excerpt, category,
  author name, creation date, reading time, tags, cover image and its Markdown
  content as real HTML (R23.5). An unknown slug still renders the not-found
  state (AC23.2), after the saved posts have finished loading.
- **AC37.3** Saved posts join the repository articles as one list: newest first,
  the search and the topic and tag filters include them, the counts include them,
  and a slug collision keeps the saved post rather than showing the article
  twice.
- **AC37.4** The home page's **Latest articles** grid and its trending-topic
  counts include saved posts.

**Access and failure**

- **AC37.5** `firestore.rules` lets any visitor read `blogs` and still allows a
  write only for an admin (`isAdmin()`, AC33.10). `npm run deploy:rules`
  publishes the change; nothing else is needed for a visitor to read the posts.
- **AC37.6** While the read is in flight the page keeps rendering the repository
  articles. If the read fails — offline, or the rule is not deployed — the
  archive still renders them and a `role="status"` notice says the saved posts
  could not be loaded. The page never invents a saved post or claims one loaded
  that did not.
- **AC37.7** A saved post's document carries no author email, and the visitor UI
  never renders one. A document saved under R33 that still has the field is
  shown; the field is not read.

**Safety and quality**

- **AC37.8** Markdown that comes from Firestore is sanitised before it is
  rendered: raw HTML is escaped and link/image URLs with an unsafe scheme
  (`javascript:`, `data:` and the like) are refused, so stored HTML cannot
  execute in a visitor's browser. Repository Markdown keeps rendering normally.
- **AC37.9** Build and lint pass, all previously passing tests stay green, and
  the bundle stays within the R14 budgets.

---

### R38 — The admin manages blogs: edit, delete and replace covers

The dashboard's **All Blogs** panel becomes the blog management view. R37 made
every document in the Firestore `blogs` collection public content; until now the
only way to change or remove one was the Firebase console. The panel lists every
written post in one card layout and, for a Firestore post, offers **Edit** and
**Delete** — including adding, replacing or removing its featured image — with
every change written back to the same `blogs/<id>` document.

**The list**

- **AC38.1** `/admin/dashboard/blogs` lists every written post — Firestore
  `blogs` documents and repository articles — in one card layout, newest first,
  each showing its cover, title, category, publication date, reading time and
  source (`Firestore` or `Repository`); the title opens its public
  `/blog/<slug>`.
- **AC38.2** A Firestore post shows **Edit** and **Delete** controls; a
  repository article shows **View** only and says it is a repository file, so
  the panel never offers an action the browser cannot perform.
- **AC38.3** While the saved posts are loading the repository articles still
  render; a failed read leaves them and shows a `role="status"` notice. The
  panel never invents a saved post.

**Editing**

- **AC38.4** **Edit** opens an inline editor on the same page, pre-filled with
  the document's title, category, excerpt, tags and Markdown content. Required
  fields are validated with inline errors, and a save calls the one Firebase
  seam (`updateBlogPost` → `updateDoc`) on that same `blogs/<id>` document.
  Success and failure are reported in a live region; nothing claims a write
  Firestore did not confirm.
- **AC38.5** The editor adds, replaces or removes the featured image. A chosen
  file passes the R33 image rules and uploads through the R35 admin-gated
  function; saving stores its `imageUrl` and `imagePath`. **Remove image** clears
  `imageUrl` on save and deletes the old object best-effort; a cancelled or
  undone change keeps the current image. A newly uploaded image is removed again
  if the document update fails.
- **AC38.6** The other document fields (slug, reading time, author name and uid,
  creation date) are re-derived by the same `buildBlogDocument` the composer
  uses, so an edited post stays shaped like a created one and gains an
  `updatedAt` server timestamp.

**Deleting**

- **AC38.7** **Delete** asks for confirmation inline; confirming calls
  `deleteBlogPost` → `deleteDoc` for that `blogs/<id>` and then deletes the cover
  object best-effort. The post disappears from the admin list and from the
  public archive on the next read; a failed delete keeps the post and reports
  the failure.

**Access and quality**

- **AC38.8** The page stays behind the R31 guard and the write stays admin-only:
  `firestore.rules` is unchanged (`allow write: if isAdmin()`), and the cover
  deletion stays behind the admin-gated `deleteBlogImage` function. No rule is
  relaxed for this feature.
- **AC38.9** Variables, text and controls meet WCAG AA contrast (4.5:1) in both
  themes, every control has an accessible name, and the layout has no horizontal
  overflow at 360px.
- **AC38.10** Build and lint pass, all previously passing tests stay green, and
  the bundle stays within the R14 budgets.

---

### R39 — The dashboard's Add New Blog is the Firestore composer

The dashboard's **Add New Blog** section offered a second, different composer: it
produced markdown for a `content/posts/` directory this repository does not have,
and it carried no featured-image field, so the form the sidebar actually reaches
could not create a post shaped like the ones already published. It now renders
the same R33 composer, with the featured image directly above **Tags**.

**The form**

- **AC39.1** `/admin/dashboard/blogs/new` renders the R33 Firestore composer
  behind the R31 guard (the guard is reused, not redefined), and a save writes a
  document to the `blogs` collection — not a markdown file.
- **AC39.2** The composer carries, in this order: **Blog title**, **Category**,
  **Excerpt**, **Featured image**, **Tags**, **Content**. The image control sits
  directly before Tags, and every control keeps its programmatic label.
- **AC39.3** The Category dropdown is the shared taxonomy (`categoryOptions`,
  R20.7) and the image control accepts `image/*` up to 5 MB, previews the chosen
  file, and uploads through the admin-gated function — the same rules as
  `/admin/add-blog` (AC33.2, AC33.3, AC33.5, AC35.1).

**One composer**

- **AC39.4** One implementation serves both routes: `/admin/add-blog` and
  `/admin/dashboard/blogs/new` render the same component. The markdown composer
  is removed from `AdminPanels.tsx`, so no second, divergent form remains.
- **AC39.5** The sidebar still has exactly three items (AC32.1), and **Add New
  Blog** is the only item marked `aria-current="page"` on
  `/admin/dashboard/blogs/new`.

**Quality**

- **AC39.6** Build and lint pass, all previously passing tests stay green, and
  the bundle stays within the R14 budgets.

---

## 8. Open Questions

- [ ] Confirm the blog name and branding (currently "Signal & Noise").
- [ ] Confirm the number of seed posts needed for launch (currently planned: 3).
- [ ] RSS feed and reading-progress indicator: v1 or v2?
