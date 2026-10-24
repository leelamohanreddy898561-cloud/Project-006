import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useUserRole } from "../hooks/useUserRole";
import { isAdminRole } from "../lib/users";

/**
 * R31 — the /admin gate.
 *
 * - session or role still loading: an accessible status, never admin content
 * - no session: /signin
 * - anything other than role "admin" (including a failed read): home
 *
 * This is UX, not security. `firestore.rules` denies the data a non-admin
 * account would need, so bypassing the redirect gains nothing.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const auth = useAuth();
  const { role, status } = useUserRole(auth.user);

  const resolving =
    auth.status === "loading" ||
    (auth.user !== null && (status === "loading" || status === "idle"));

  if (resolving) {
    return (
      <div className="container admin-gate" role="status" aria-live="polite">
        Checking access…
      </div>
    );
  }

  if (!auth.user) {
    return <Navigate to="/signin" replace />;
  }

  if (!isAdminRole(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
