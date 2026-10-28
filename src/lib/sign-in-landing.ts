import type { AuthUser } from "./auth";
import { landingPath, PLATFORM_HOME } from "./landing";
import { ensureUserProfile, isAdminRole } from "./users";
import { listWorkspacesOwnedBy } from "./workspaces";

/**
 * R46 — the sign-in landing, resolved through the real seam.
 *
 * The role and the owned sites are read in parallel, because neither answer is
 * enough alone: one site means "their site" only if the account is not the
 * platform operator. Every failure — an unreadable profile, an unreadable site
 * list, Firebase not configured — resolves to the platform home, so a broken
 * read can never drop an account onto a site it may not own.
 */
export async function resolveSignInLanding(user: AuthUser): Promise<string> {
  try {
    const [role, owned] = await Promise.all([
      ensureUserProfile({ uid: user.uid, email: user.email ?? null }),
      listWorkspacesOwnedBy(user.uid),
    ]);

    if (!owned.ok) return PLATFORM_HOME;

    return landingPath({
      ownedSites: owned.workspaces,
      isPlatformAdmin: isAdminRole(role),
    });
  } catch {
    return PLATFORM_HOME;
  }
}
