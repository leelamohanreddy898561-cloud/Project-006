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
 */
export function AccountMenu({ user }: { user: AuthUser }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { role } = useUserRole(user);
  const mine = useMyWorkspaces(user.uid);

  const name = user.displayName?.trim() || user.email || "Your account";
  const initial = name.charAt(0).toUpperCase();
  const showAdminLink = isAdminRole(role);

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

      {/* R44 / R46 — every signed-in account can reach its own site; an owner
          of exactly one goes straight to that site's admin, everyone else to
          the launcher. The page itself still decides what can be opened. */}
      <Link to={siteHref} className="account__admin">
        {siteLabel}
      </Link>

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
