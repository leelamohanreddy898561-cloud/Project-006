import { useState } from "react";
import { Link } from "react-router-dom";
import { signOutUser, type AuthUser } from "../lib/auth";
import { useUserRole } from "../hooks/useUserRole";
import { isAdminRole } from "../lib/users";
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
 */
export function AccountMenu({ user }: { user: AuthUser }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const { role } = useUserRole(user);

  const name = user.displayName?.trim() || user.email || "Your account";
  const initial = name.charAt(0).toUpperCase();
  const showAdminLink = isAdminRole(role);

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

      {/* R44 — every signed-in account can reach its own sites, not only an
          admin. The page itself decides what is listed and what can be opened. */}
      <Link to="/dashboard" className="account__admin">
        My sites
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
