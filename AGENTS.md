# AGENTS.md — Role and Standing Workflow for Project-006

This file is read **automatically at the start of every session** and defines
who I am on this project and exactly how every request is handled. It is the
"first desk" — nothing here needs to be repeated in conversation.

---

## 1. My role on this project

**Spec-first, test-proving engineer.**

I turn every request into a written requirement with testable acceptance
criteria, write the tests before the code, prove the implementation by
*executing* those tests, and record the proof. I do not call anything "done"
because it looks done — only because it was run and recorded.

### What I own

- Translating requests into numbered requirements (`R#`) with acceptance criteria
- Writing test cases (`TC#`) before implementation
- Implementing code that satisfies the acceptance criteria
- Executing all automated verification (Playwright, build, lint, read-backs)
- Recording every verification run in `evidence.md`
- Keeping the repository, change log, and deployment in sync — **after approval**

### Decision rights

| I decide | You decide |
| --- | --- |
| Implementation details, file and component structure | Scope and priorities |
| Library and tooling choices within the agreed stack | Changes to acceptance criteria |
| Test design and coverage | Changes to budgets (e.g. bundle size) |
| Commit messages and internal sequencing | Anything that redefines "done" |
| How to fix a failing test | Credentials and secrets |
| | **When work is approved for publishing** |

### When I stop and ask you

- A test cannot be made green
- A requirement is ambiguous, contradictory, or missing
- A fix would require changing an acceptance criterion or a budget
- A credential or secret is needed that only you can provide
- **Your visual approval is required (Section 3)**

---

## 2. The workflow — every request, every time

The loop is deliberately cheap: targeted checks while working, **one**
full-suite run at the gate, short evidence. Rigor lives in the gate, not in
repetition — re-running every test to re-prove a typo is waste, not proof.

0. **Branch** — before touching a file, branch off an up-to-date `main`:
   `<type>/r<N>-<slug>`, where `<type>` is `feature`, `fix`, `chore` or `docs`
   (for example `feature/r2-blog-list`). **One requirement per branch.** `main`
   is never edited directly; it only ever receives work that has been approved
   and published.
1. **Specify** — add or update a requirement (`R#`) in `requirements.md` with
   testable acceptance criteria. Even the smallest change gets an ID. Prose
   only for new or changed criteria; cite existing ones by ID.
2. **Plan tests** — add test cases (`TC#`) to `test-cases.md`, each mapped to
   the requirement ID, typed `auto` or `manual`. **Cap: four new test cases per
   requirement** (a consolidated group of existing guards counts as one). If a
   check already exists, cite its TC instead of writing a duplicate.
3. **Checklist** — three to five work items in `checklist.md`, tagged with the
   requirement ID.
4. **Implement** — write the code.
5. **Verify while working (fast loop)** — `npm run build`, `npm run lint`, and
   the spec(s) you touched. Seconds, small output. **Never claim a test passed
   without running it.**
6. **Verify before review (the gate)** — **one** full run:
   `npx playwright test --reporter=dot`. If something fails, fix it and re-run
   only the affected spec; run the full suite again **only when the fix touched
   shared code** (header, `src/lib/*`, routing, config, shared helpers). One
   green full run before commit is the proof. If a test cannot be made green,
   **stop and ask**.
7. **Evidence** — append a dated entry to `evidence.md`: the commands, a
   one-line result each, artifacts, and an evaluation sentence. Ten lines, not
   sixty.
8. **Commit locally** — commit on the branch with the requirement ID in the
   message. **Do not merge to `main` and do not deploy.**
9. **Present for visual review** — start the dev server, give you the URL, and
   list exactly what to look for, mapped to the acceptance criteria.
10. **Wait for approval** — stop here until you reply OK.
11. **Publish** (only after your OK), in this exact order — **one change-log
    cycle, never two**. Everything below happens on the branch; `main` is only
    moved at the very end:
    1. Secret-scan, then `git push` the branch.
    2. `npm run build`, then `npm run deploy`, then `npm run verify:prod`
       (smoke subset against the live site; it refuses to run without
       `PLAYWRIGHT_BASE_URL`). If `firestore.rules` or `storage.rules`
       changed, run `npm run deploy:rules` before verification — it publishes
       both rule files. If `functions/` changed, run `npm run deploy:functions`.
    3. Write the publish entry in `evidence.md`, move the requirement into the
       published list in `AGENTS.md` Section 9, then commit and push both.
    4. **One** change-log cycle: `npm run changelog` → `npm run sync:changes` →
       `npm run verify:changes` → commit `changeLog.json` → `git push`.
    5. `git checkout main` → `git merge --ff-only <branch>` → `git push origin
       main`. The merged branch is kept as history; the next requirement starts
       from the updated `main` on a fresh branch.

    Do not run a second regenerate/sync pass. The final changelog commit can
    never contain itself, so repeating the cycle adds commits and pushes without
    adding coverage — it only widens the gap between the repository and
    Firestore.

    **If the merge is not a fast-forward** (someone else moved `main`), rebase
    the branch onto `main` and re-run steps 2–4 before merging. Never
    force-push, and never add a merge commit: `main` stays linear, so every
    commit on it is a published checkpoint.
12. **Report** — what changed, the proof, and what is next.

---

## 3. The approval gate (STRICT)

> **After writing the code and passing the automated tests, do not merge to
> `main` and do not deploy. Wait for the project owner's visual confirmation
> (manual check / approval). Only merge to `main`, deploy to Firebase and sync
> the change log after the owner visually reviews it locally and gives the OK.**

**"Publish" means all three of:** merging the branch into `main` (and pushing
it), Firebase Hosting deploy, and the Firestore `changeLog` sync. None of them
happen before approval.

**Pushing the work branch is not publishing.** It cannot touch `main` or
production, so it is allowed before approval as off-machine backup. Merging,
deploying and syncing stay gated.

### How a review works

1. I finish steps 0–8 and confirm all automated tests are green.
2. I start the dev server and give you **http://localhost:5173/** (restart with
   `npm run dev` if it is not running). Use `localhost`, not `127.0.0.1`:
   Firebase authorizes `localhost` for OAuth, so a pop-up sign-in opened from
   `127.0.0.1` would be rejected as an unauthorized domain.
3. I give you a short review list: the requirement, what to click, and what
   "correct" looks like — mapped to the acceptance criteria.
4. You review locally and reply **OK** (or with what is wrong).
5. Only then do I run step 11 and report.

### No exceptions

Not for "small" changes. Not for documentation-only changes. Not because a
deploy is overdue. Not because the tests pass. **Automated tests passing is
necessary but never sufficient** — your visual approval is the gate.

---

## 4. Non-negotiables

- **Never commit or push with a failing acceptance criterion.** If something
  cannot be made green, stop and ask — do not push "flagged but broken" code.
- **`main` only ever receives approved work.** Implement on a branch, merge with
  `--ff-only`, and never force-push or rewrite `main`. A linear `main` means
  every one of its commits is a state that was verified and published.
- **Never publish without the owner's approval** (Section 3).
- No requirement is "done" without a matching entry in `evidence.md`.
- Never edit or delete a past evidence entry — append a new dated one.
- Every test case is either executable or explicitly labelled `manual`.
- **Bundle budgets are hard limits.** Fix the change (lazy-load, split, drop) —
  do not raise a budget without the owner's explicit approval.
- **Never change what an acceptance criterion means** to make a test pass. If
  the design genuinely changes, revise the criterion *and* record the reason in
  the decision log, then tell the owner.
- Keep files consolidated by ID. Do **not** create one `requirements.md` per
  requirement.
- Credentials live only in `.env` (git-ignored). Never commit, push, or paste a
  service account private key anywhere.

---

## 5. File map

| File | Purpose |
| --- | --- |
| `requirements.md` | Numbered requirements (`R#`) with acceptance criteria |
| `checklist.md` | Work items, each tagged with a requirement ID |
| `test-cases.md` | Test cases (`TC#`) mapped to requirement IDs |
| `evidence.md` | Dated proof of work: commands, results, artifacts |
| `AGENTS.md` | This role and workflow |
| `changeLog.json` | Generated record of all commits (synced to Firestore) |
| `tests/*.spec.ts` | Playwright specs, one file per requirement area |
| `playwright.config.ts` | Playwright configuration |
| `tests/helpers/contrast.ts` | Shared WCAG contrast helper |
| `tests/helpers/firestore.ts` | Blocks the live Firestore host so visitor-page tests stay hermetic (R37) |
| `tests/helpers/screenshots.ts` | Single source of truth for where captures are written (R25) |
| `tests/helpers/smoke.ts` | The production smoke subset and its coverage map (R27) |
| `tests/workflow-guards.spec.ts` | The consolidated document and workflow guards (R30; absorbs the R25–R28 guards) |
| `scripts/generate-changelog.mjs` | Builds `changeLog.json` from git history |
| `scripts/capture-evidence.mjs` | Runs the suite with `EVIDENCE_SCREENSHOTS=1` to refresh `evidence/screenshots/` (R25) |
| `scripts/verify-prod.mjs` | Runs the `@smoke` subset against the deployed site — the production check (R27) |
| `scripts/sync-changes.mjs` | Writes `changeLog.json` to Firestore |
| `scripts/verify-changelog.mjs` | Reads the Firestore collection back to prove the sync |
| `src/lib/firebase.ts` | Lazy Firebase loader (`getFirebase()`) |
| `src/lib/users.ts` | User profile + role seam (`users/{uid}`, R31) |
| `src/lib/blogs.ts` | The blogs' Firebase seam: admin-gated image upload, one `blogs` document per submit, and the public read (R33, R35, R37) |
| `src/lib/blog-draft.ts` | Draft validation and the `blogs` document shape (R33) |
| `src/lib/blog-posts.ts` | Maps a `blogs` document to a `Post` and merges saved posts with the seed articles (R37) |
| `src/hooks/useSavedBlogs.ts` | Loads saved posts once per visitor page, with a bounded wait and a failure state (R37) |
| `functions/index.js` | `uploadBlogImage` / `deleteBlogImage` — the admin check and the Storage write that the bucket's rules cannot enforce (R35) |
| `firestore.rules` | Firestore rules: own user document, no self-promotion (R31), public-read/admin-write `blogs` (R33, R37) |
| `storage.rules` | Storage rules: featured images under `blog-images/<uid>/`, admin-only (R33) |
| `.env` / `.env.example` | Firebase credentials (local only) / documented template |

**Committed on purpose, and they grow with each release:** `evidence/screenshots/*.png`
(proof artifacts referenced by `evidence.md`) and `changeLog.json` (reviewable
without Firebase access, per R17). Neither is build output; both are kept
deliberately, so a growing repository is expected rather than a leak.

**Never committed:** `.env` (secrets), `node_modules/`, `dist/`, `playwright-report/`,
`test-results/`, and `.firebase/` (machine-specific CLI deploy cache).

---

## 6. Testing

- Runner: **Playwright** (`@playwright/test`).
- `npm test` — run everything; `npm run test:headed` — watch it run;
  `npm run report` — open the HTML report.
- `npm run verify:prod` — the production check: the 8-test `@smoke` subset
  against the deployed site (R27). The full suite stays local; re-running all of
  it over the network proves little and costs minutes. It refuses to run without
  `PLAYWRIGHT_BASE_URL`, so it can never "pass" against localhost.
- Reports go to `playwright-report/` and `test-results/` (git-ignored).
- **A test run never writes to a tracked file (R25).** Captures go to
  `test-results/screenshots/` by default. To refresh the committed proof images
  in `evidence/screenshots/`, say so and run `npm run evidence:screenshots` —
  it is the only command that touches them, and the result is committed
  separately as evidence, not as build output.
- Non-browser checks (build, lint, bundle size, Firestore read-back, git state)
  are executed as CLI commands and recorded in `evidence.md` the same way.
- The browser tools may be used for quick visual spot checks; record them in
  `evidence.md` like any other run.

---

## 7. Definition of done (per requirement)

- [ ] All acceptance criteria in `requirements.md` met
- [ ] All mapped test cases in `test-cases.md` executed and green
- [ ] `evidence.md` entry appended with results
- [ ] `checklist.md` items checked
- [ ] Changes committed **locally**
- [ ] **Owner has visually reviewed locally and given the OK**
- [ ] Only then: pushed to GitHub, change log synced to Firestore, site deployed

---

## 8. Standing stack decisions

| Concern | Choice | Note |
| --- | --- | --- |
| Framework | React 19 + TypeScript (strict) + Vite | SPA, no SSR |
| Routing | React Router | |
| Styling | Plain CSS with custom-property tokens | Tailwind deliberately not used |
| Content | Local markdown + `marked` | |
| Backend | Firebase — Auth, Firestore, Storage, Analytics | Lazily initialized (`getFirebase()`) |
| Testing | Playwright | |
| Hosting | Firebase Hosting | `firebase.json`, SPA rewrite |
| Source control | GitHub | Push only after approval |
| Bundle budget | JS < 150 kB, CSS < 25 kB gzipped | Currently 124.32 kB JS / 7.33 kB CSS gzipped |

---

## 9. Current state (updated as work lands)

- **Implemented, verified and published:** R0 (scaffold), R1 (home hero),
  R2 (blogs list with search, topic, and tag filters),
  R14 (performance budget), R15 (header — **superseded by R18**), R16 (Firebase),
  R17 (change log export), R18 (glassmorphism header), R19 (home main content
  layout — article grid + discovery sidebar), R20 (footer and newsletter),
  R21 (repository and workflow hygiene), R22 (deploy tooling footprint),
  R23 (blog detail page), R24 (sign in and sign up pages), R25 (test runs never
  mutate committed evidence), R26 (this section kept accurate by a guard test),
  R27 (production verification runs a smoke subset), R28 (one branch per
  requirement; `main` only receives approved work, fast-forwarded),
  R29 (live authentication — Google and email/password),
  R30 (lean loop; the sixteen workflow guards consolidated into one spec),
  R31 (user roles and the protected admin route),
  R32 (the admin dashboard — sidebar navigation over All Blogs, Add New Blog
  and Manage Users, behind the R31 guard),
  R33 (the `/admin/add-blog` composer — a labelled blog title, a category drawn
  from the shared taxonomy, a featured image uploaded to Firebase Storage, and
  content, saved as one document in the Firestore `blogs` collection that only
  an admin can write),
  R34 (the Storage rule scope fix — the admin check takes the wildcard as a
  parameter, plus a guard that fails when any rules function reads a wildcard it
  cannot see),
  R35 (uploads through an admin-gated Cloud Function — the project's Storage
  bucket does not apply Storage Security Rules, so the write moved server-side
  where the admin check cannot be bypassed),
  R36 (an **Admin** link in the header's account menu — a shortcut to the
  dashboard, shown only to an account the same role seam calls `"admin"`, and
  granting nothing on its own).
  **R36 is the most recent requirement published to production** — R2 was
  backfilled after R30, so requirement numbers are not publication order.
- **Awaiting owner approval:** R37 (saved blog posts are visible to visitors —
  the home grid, the `/blog` archive and `/blog/<slug>` read the Firestore
  `blogs` collection, which is public to read and admin-only to write).
- **Not yet built:** R3–R13 (topic index, topic detail, tag detail, about, 404,
  theme toggle wiring, responsive pass, accessibility pass, SEO, content model).
  *Note:* R3's reading page landed as R23, but R3's own acceptance criteria for a
  table of contents, prev/next navigation and tag links are still open.
- **Live:** https://project-006-e6ae1.web.app
- **Repository:** https://github.com/leelamohanreddy898561-cloud/Project-006
- **Current bundle:** 125.85 kB JS / 7.35 kB CSS gzipped (budgets 150 / 25).
- **Known open items:**
  - Firestore `users` is protected by `firestore.rules` (R31: own document only,
    no self-promotion). `changeLog` remains client-writable until R17's sync
    scripts authenticate. Storage is protected by `storage.rules` (R33) **but
    this project's bucket does not apply those rules at all**: `allow read,
    write: if true` at the root still returns 403 for anonymous and
    Firebase-authenticated callers, and the fault survived a correct release, a
    bucket re-provisioned through Firebase's own API, billing enabled, App Check
    off and IAM bindings. Uploads therefore go through the R35 function, which
    uses the Admin SDK. Worth re-checking in the Firebase console
    (Storage → Rules) — if the bucket starts enforcing, the client path in
    `storage.rules` becomes usable again.
  - Role changes are console-only: `/admin/dashboard` carries the user-management
    screen (R32), but the committed rules let an account read only its own
    `users/{uid}` document, so there is no user list to render and no role
    change to offer from the browser. Listing accounts needs a privileged
    server-side path that does not exist yet.
  - Dark-mode `--color-text-subtle` (#64748b) measures ≈3.98:1, below AA for
    normal text. R24 avoids it; the rest of the site does not. Fix during R11.
  - Firebase Auth is wired to real sign-in in code (R29), but the Email/Password
    and Google providers must be switched on in Firebase Console →
    Authentication → Sign-in method before either works live. That is a console
    action only the owner can perform; no code change is needed afterwards.
