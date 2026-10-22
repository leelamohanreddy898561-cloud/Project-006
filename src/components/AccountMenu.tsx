import { useState } from "react";
import { signOutUser, type AuthUser } from "../lib/auth";
import "./AccountMenu.css";

/**
 * R29 — who is signed in, and the way out.
 *
 * Shown in the header instead of Sign In / Sign Up once a session exists.
 * The identity is a name, and the button label never changes between pages.
 */
export function AccountMenu({ user }: { user: AuthUser }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  const name = user.displayName?.trim() || user.email || "Your account";
  const initial = name.charAt(0).toUpperCase();

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
