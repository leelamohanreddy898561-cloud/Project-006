import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useMyWorkspaces } from "../hooks/useMyWorkspaces";
import "./Dashboard.css";

/**
 * R44 — the launcher.
 *
 * A signed-in account sees the sites it owns: one card per workspace, each
 * opening the public site or that site's admin. A visitor who is not signed in
 * is sent to sign in, and an account with no site is told so rather than being
 * shown an invented one.
 *
 * It lists only workspaces the account owns. Memberships exist in the model
 * (R41) but nothing creates them yet, so they are not listed instead of being
 * listed empty.
 */
export function Dashboard() {
  const auth = useAuth();
  const mine = useMyWorkspaces(auth.user?.uid ?? null);

  if (auth.status === "loading") {
    return (
      <div className="container dashboard" role="status" aria-live="polite">
        Checking your session…
      </div>
    );
  }

  if (!auth.user) {
    return <Navigate to="/signin" replace />;
  }

  return (
    <div className="container dashboard">
      <header className="dashboard__intro">
        <p className="dashboard__eyebrow">Workspaces</p>
        <h1 className="dashboard__title">My sites</h1>
        <p className="dashboard__lead">
          Every site you own. Each one is its own workspace with its own posts.
        </p>
      </header>

      {mine.status === "loading" && (
        <p className="dashboard__notice" role="status" aria-live="polite">
          Loading your sites…
        </p>
      )}

      {mine.status === "error" && (
        <p className="dashboard__notice" role="status">
          {mine.message}
        </p>
      )}

      {mine.status === "ready" && mine.workspaces.length === 0 && (
        <div className="dashboard__empty" role="status">
          <h2 className="dashboard__empty-title">No sites yet</h2>
          <p>
            This account does not own a site. Creating one from here is the next
            requirement; today a workspace is added in the Firebase console.
          </p>
        </div>
      )}

      {mine.workspaces.length > 0 && (
        <ul className="site-list">
          {mine.workspaces.map((workspace) => (
            <li className="site-card" key={workspace.id}>
              <div className="site-card__body">
                <h2 className="site-card__name">
                  {workspace.branding.title || workspace.name}
                </h2>
                <p className="site-card__slug">/w/{workspace.slug}</p>
                <p className="site-card__role">
                  <span className="badge">Owner</span>
                </p>
              </div>

              <div className="site-card__actions">
                <Link
                  to={`/w/${workspace.slug}`}
                  className="btn btn--primary btn--sm"
                >
                  View site
                </Link>
                <Link
                  to={`/w/${workspace.slug}/admin`}
                  className="btn btn--outline btn--sm"
                >
                  Admin
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
