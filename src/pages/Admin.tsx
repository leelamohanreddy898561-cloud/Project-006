import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "./Admin.css";

/**
 * R31 — the protected landing page. At least one real admin surface, so the
 * guard has something worth protecting; the working sections live in the
 * dashboard at /admin/dashboard (R32).
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
        The <Link to="/admin/dashboard">admin dashboard</Link> carries the
        day-to-day sections — all blogs, the new-post composer, and user
        management. Roles live in the Firestore <code>users</code> collection and
        are changed in the Firebase console; the browser cannot promote an
        account.
      </p>
    </div>
  );
}
