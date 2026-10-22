# Requirements: AI Blog — "Signal & Noise"

**Version:** 2.0 (ID-based format)
**Date:** 2026-10-21
**Status:** In progress — **R0, R14, R15 (superseded by R18), R16, R17, R18, R1 (hero) and R19 implemented, verified and published; R2–R13 not started**

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

---

## 8. Open Questions

- [ ] Confirm the blog name and branding (currently "Signal & Noise").
- [ ] Confirm the number of seed posts needed for launch (currently planned: 3).
- [ ] RSS feed and reading-progress indicator: v1 or v2?
