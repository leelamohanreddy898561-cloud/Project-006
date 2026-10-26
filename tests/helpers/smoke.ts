/**
 * R27 — the production smoke subset.
 *
 * The local run (`npm test`) still executes every test. This file declares the
 * small subset that is also run against the deployed site by
 * `npm run verify:prod`, and why each member earns its place there.
 *
 * Two things must stay true, and `tests/r27-production-smoke.spec.ts` enforces
 * both:
 *
 *   1. The manifest and the `@smoke` tags in the specs describe the same set.
 *      A test cannot be tagged without being declared, or declared without
 *      being tagged.
 *   2. Every required route class is covered by at least one member, so the
 *      subset cannot shrink into something that no longer proves the deploy.
 *
 * The subset is deliberately small. The deployed artifact is the one that just
 * passed the full local suite, so this check exists to prove the deploy serves
 * it correctly — not to re-run the whole suite over the network.
 */

/** Every smoke test carries this tag in its title. */
export const SMOKE_TAG = "@smoke";

/** Route classes the subset must prove. */
export type CoverageArea =
  | "home"
  | "blog-list"
  | "topics"
  | "about"
  | "article"
  | "article-missing"
  | "auth"
  | "not-found"
  | "newsletter"
  | "theme";

/** Areas a production check cannot do without. */
export const REQUIRED_COVERAGE: CoverageArea[] = [
  "home",
  "blog-list",
  "topics",
  "about",
  "article",
  "article-missing",
  "auth",
  "not-found",
];

export interface SmokeTest {
  /** Test case ID from test-cases.md. */
  tc: string;
  /** Spec file that declares it. */
  spec: string;
  /** What this member proves about the deployed site. */
  covers: CoverageArea[];
  /** Why it is in the subset, in one line. */
  why: string;
}

export const SMOKE_SUITE: SmokeTest[] = [
  {
    tc: "TC-1808",
    spec: "r18-header.spec.ts",
    covers: ["home", "blog-list", "topics", "about", "auth", "not-found"],
    why: "Every header destination — and the 404 route — renders a real page.",
  },
  {
    tc: "TC-3101",
    spec: "r31-admin-role.spec.ts",
    covers: ["auth"],
    why: "The deployed site still protects /admin: signed-out visitors are sent to sign in.",
  },
  {
    tc: "TC-201",
    spec: "r2-blog-list.spec.ts",
    covers: ["blog-list"],
    why: "The blog index renders every post, newest first, with its full card.",
  },
  {
    tc: "TC-2301",
    spec: "r23-post-detail.spec.ts",
    covers: ["article"],
    why: "A card opens its own article: data, routing and the detail view.",
  },
  {
    tc: "TC-2302",
    spec: "r23-post-detail.spec.ts",
    covers: ["article-missing"],
    why: "An unknown slug shows the not-found state instead of a blank page.",
  },
  {
    tc: "TC-2305",
    spec: "r23-post-detail.spec.ts",
    covers: ["article"],
    why: "Markdown renders as real HTML on the deployed build.",
  },
  {
    tc: "TC-4001",
    spec: "r40-mobile-featured-images.spec.ts",
    covers: ["article"],
    why: "The deployed article shows its featured image in full at every width — the R40 crop fix is live.",
  },
  {
    tc: "TC-2406",
    spec: "r24-auth.spec.ts",
    covers: ["auth"],
    why: "Auth validation runs client-side, with no backend round trip.",
  },
  {
    tc: "TC-2411",
    spec: "r24-auth.spec.ts",
    covers: ["auth"],
    why: "A failed sign-in returns a real provider error and stays signed out.",
  },
  {
    tc: "TC-2003",
    spec: "r20-footer.spec.ts",
    covers: ["newsletter"],
    why: "The newsletter form still works after a deploy.",
  },
  {
    tc: "TC-1805",
    spec: "r18-header.spec.ts",
    covers: ["theme"],
    why: "The theme toggle flips and persists: the interactive shell is alive.",
  },
];
