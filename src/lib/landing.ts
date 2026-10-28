/**
 * R46 — where a sign-in lands.
 *
 * The decision is a pure function, so every case is checkable without a
 * browser. Only the case the product asks for changes: an account that owns
 * exactly one site belongs on that site. A reader who owns none keeps the
 * platform home it already had, and an account with several sites gets the
 * launcher, because "their site" is no longer one answer.
 *
 * It imports nothing, deliberately — the Firebase seam lives in
 * `sign-in-landing.ts`, so this file can be read and executed on its own.
 */

/** The platform's own home, and the landing for every case that has no site. */
export const PLATFORM_HOME = "/";

/** The launcher: one card per site, and the only place to choose between them. */
export const DASHBOARD_PATH = "/dashboard";

/** The public home of a workspace. */
export function sitePath(slug: string): string {
  return `/w/${slug}`;
}

/** That workspace's admin. */
export function siteAdminPath(slug: string): string {
  return `/w/${slug}/admin`;
}

export interface LandingInput {
  /** The workspaces the account owns, in any order. */
  ownedSites: ReadonlyArray<{ slug: string }>;
  /** `users/{uid}.role` is exactly `"admin"`. */
  isPlatformAdmin: boolean;
}

/**
 * One site is the whole answer; several need the launcher; none is a reader,
 * who keeps the platform home. The platform operator keeps it too — its work
 * spans every site, so no single tenant is "its" site. A site without a slug
 * cannot be opened, so it is treated as "no site" rather than guessed.
 */
export function landingPath({
  ownedSites,
  isPlatformAdmin,
}: LandingInput): string {
  if (isPlatformAdmin) return PLATFORM_HOME;

  if (ownedSites.length === 1) {
    const slug = ownedSites[0]?.slug?.trim() ?? "";
    if (slug) return sitePath(slug);
  }

  if (ownedSites.length > 1) return DASHBOARD_PATH;

  return PLATFORM_HOME;
}
