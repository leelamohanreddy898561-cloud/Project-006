import { useAuth } from "../hooks/useAuth";
import "./Admin.css";

/**
 * R31 — the protected landing page. At least one real admin surface, so the
 * guard has something worth protecting; user management comes later.
 */
export function Admin() {
  const { user } = useAuth();

  return (
    <div className="container admin">
      <p className="admin__eyebrow">Administration</p>
      <h1 className="admin__title">Admin</h1>
      <p className="admin__lead">
        Restricted area. Only accounts with the <strong>admin</strong> role can
        open this page.
      </p>

      <dl className="admin__card">
        <div className="admin__row">
          <dt>Signed in as</dt>
          <dd>{user?.email ?? "Unknown account"}</dd>
        </div>
        <div className="admin__row">
          <dt>Role</dt>
          <dd>
            <span className="admin__badge">admin</span>
          </dd>
        </div>
      </dl>

      <p className="admin__note">
        User management is not built yet. Roles live in the Firestore{" "}
        <code>users</code> collection and are changed there — the browser cannot
        promote an account.
      </p>
    </div>
  );
}
