import { useState } from "react";
import { Link } from "react-router-dom";
import { signOutUser, type AuthUser } from "../lib/auth";
import { useUserRole } from "../hooks/useUserRole";
import { useMyWorkspaces } from "../hooks/useMyWorkspaces";
import { isAdminRole } from "../lib/users";
import { siteAdminPath } from "../lib/landing";
import "./AccountMenu.css";

/**
 * R29 — who is signed in, and the way out.
 *
 * Shown in the header instead of Sign In / Sign Up once a session exists.
 * The identity is a name, and the button label never changes between pages.
 *
 * R36 — and, for an admin, the way into the workspace. The role is read from
 * the same `users/{uid}` profile the /admin guard reads. Until it resolves, or
 * if the read fails, there is no link: the menu fails closed, exactly as the
 * guard does. The link is a shortcut, not a permission — /admin/dashboard
 * still enforces R31 on its own.
 *
 * R46 — an account that owns exactly one site gets **My site**, straight to
 * that site's admin, because the launcher would be a menu of one. Everyone
 * else — several sites, none, or the platform operator — keeps **My sites**.
 * Until the site list resolves the link stays on the launcher, which always
 * works, rather than pointing at a site that may not exist.
 *
 * R48 — inside a tenant's public pages (`/w/<slug>...`) the menu is public-only:
 * the identity and **Sign out** stay, but the platform **Admin** shortcut and
 * **My site(s)** do not. A signed-in visitor reading another company's blog
 * sees that company's public site, not an admin view; the site's admin is
 * opened deliberately at `/w/<slug>/admin`. Neither the role nor the owned-site
 * list is read in that case, so a public page makes no admin-only request.
 */
export function AccountMenu({
  user,
  publicSite = false,
}: {
  user: AuthUser;
  /** True inside `/w/<slug>`; R48 suppresses every admin destination. */
  publicSite?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { role } = useUserRole(publicSite ? null : user);
  const mine = useMyWorkspaces(publicSite ? null : user.uid);

  const name = user.displayName?.trim() || user.email || "Your account";
  const initial = name.charAt(0).toUpperCase();
  const showAdminLink = !publicSite && isAdminRole(role);

  const onlySite =
    !showAdminLink && mine.status === "ready" && mine.workspaces.length === 1
      ? mine.workspaces[0]
      : null;

  const siteHref = onlySite?.slug ? siteAdminPath(onlySite.slug) : "/dashboard";
  const siteLabel = onlySite?.slug ? "My site" : "My sites";

  async function handleSignOut() {
    setPending(true);
    setError("");

    const outcome = await signOutUser();

    setPending(false);

    if (!outcome.ok) {
      setError(outcome.message);
    }
  }

  return (
    <div className="account">
      <span className="account__identity" title={user.email ?? undefined}>
        {user.photoURL ? (
          <img
            className="account__avatar"
            src={user.photoURL}
            alt=""
            width={28}
            height={28}
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="account__avatar account__avatar--initial" aria-hidden="true">
            {initial}
          </span>
        )}
        <span className="account__name">{name}</span>
      </span>

      {showAdminLink && (
        <Link to="/admin/dashboard" className="account__admin">
          Admin
        </Link>
      )}

      {/* R44 / R46 — on platform routes every signed-in account can reach its
          own site; an owner of exactly one goes straight to that site's admin,
          everyone else to the launcher. R48 removes this destination inside a
          tenant's public pages, where the site must not advertise an admin. */}
      {!publicSite && (
        <Link to={siteHref} className="account__admin">
          {siteLabel}
        </Link>
      )}

      <button
        type="button"
        className="btn btn--outline btn--sm"
        onClick={handleSignOut}
        disabled={pending}
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>

      <p className="sr-only" role="status" aria-live="polite">
        {error}
      </p>
    </div>
  );
}
