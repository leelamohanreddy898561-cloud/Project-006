# Requirements: AI Blog — "Signal & Noise"

**Version:** 2.0 (ID-based format)
**Date:** 2026-10-21
**Status:** Approved — **not yet implemented** (previous implementation was discarded on 2026-10-21)

---

## 1. Overview

A small blog / content website about AI, built with **React + TypeScript + Vite**,
styled with **plain CSS**. The site publishes articles organized by category and
tag, with a responsive reading experience and static hosting deployment.

Scope: approximately 4–5 pages (home, AI updates list, post detail, about, plus
category/tag index pages). Simple and content-focused.

## 2. Goals

- Publish and browse AI articles with a fast, readable experience.
- Make content easy to find via search, tags, and categories.
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
| Testing | Playwright (`@playwright/test`) |
| Linting | oxlint |
| Hosting | Static host (Netlify / Vercel / GitHub Pages) |

## 4. Decision Log

| Date | Decision | Rationale |
| --- | --- | --- |
| 2026-10-20 | Plain CSS over Tailwind CSS | Small, mostly static 4–5 page blog; Tailwind's tooling pays off for component-heavy apps, not here. CSS custom properties give tokens/theming with zero build complexity. |
| 2026-10-20 | Vite + React Router SPA over Next.js | No SSR requirement; static hosting is simpler and sufficient. |
| 2026-10-20 | Markdown files + `marked` for content | Author-friendly format; one small, well-maintained dependency. |
| 2026-10-21 | Workflow: ID-based docs + Playwright + evidence | Keeps rigor without one-file-per-requirement sprawl; generated test reports are stronger proof than hand-written notes. |

## 5. Out of Scope (v1)

- Comments / discussion system.
- User accounts, authentication, or an admin dashboard.
- Server-side rendering.
- RSS feed (candidate for v2).
- Analytics beyond an optional embeddable script.

## 6. Assumptions

- Content is authored as local markdown files committed to the repo.
- No backend or database for v1.
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

- **AC1.1** The page shows a hero with the site name, a one-sentence description, and a primary call-to-action linking to `/blog`.
- **AC1.2** A "Featured reading" section shows posts marked `featured: true`.
- **AC1.3** A "Latest updates" section shows the most recent posts, newest first.
- **AC1.4** A "Browse by category" section lists every category with its post count, each linking to its category page.

### R2 — AI Updates list with search and filters

Readers can find any post from the main index.

- **AC2.1** `/blog` lists all posts, newest first, showing title, excerpt, date, reading time, category, and tags.
- **AC2.2** Typing in the search box filters posts by title, excerpt, category, and tags (case-insensitive, all terms must match).
- **AC2.3** Clicking a category chip filters to that category; clicking "All" clears it.
- **AC2.4** Filters are reflected in the URL (`?q=`, `?category=`, `?tag=`) so a filtered view is shareable.
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

### R4 — Categories index

- **AC4.1** `/categories` lists every category with its post count.
- **AC4.2** Each entry links to `/categories/:slug`.

### R5 — Category detail page

- **AC5.1** `/categories/:slug` shows the category name and the number of posts in it.
- **AC5.2** Only posts in that category are listed.
- **AC5.3** An unknown category slug shows the 404 page.

### R6 — Tag detail page

- **AC6.1** `/tags/:tag` shows the tag name and the number of posts carrying it.
- **AC6.2** Only posts with that tag are listed.
- **AC6.3** An unknown tag shows the 404 page.

### R7 — About page

- **AC7.1** `/about` explains what the site covers and who writes it, using semantic headings.
- **AC7.2** The page links to `/blog` and `/categories`.

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

---

## 8. Open Questions

- [ ] Confirm the blog name and branding (currently "Signal & Noise").
- [ ] Confirm the number of seed posts needed for launch (currently planned: 3).
- [ ] RSS feed and reading-progress indicator: v1 or v2?
