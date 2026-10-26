import { Link } from "react-router-dom";
import {
  formatDate,
  getCategories,
  getLatestPosts,
  getTags,
} from "../../data/posts";
import { useAuth } from "../../hooks/useAuth";
import "./AdminPanels.css";

/**
 * R32 — the dashboard panels other than All Blogs, which became the R38
 * management view (`ManageBlogs.tsx`).
 *
 * The composer is not here. R39 makes the dashboard's **Add New Blog** section
 * render `src/pages/AddBlog.tsx` — the one form that writes a `blogs` document,
 * with the featured image directly above Tags — so there is no second composer
 * to drift from it.
 *
 * **Manage Users** is honest about what the browser can actually do: the
 * committed rules let an account read only its own `users/{uid}` document and
 * forbid a client from writing `role: "admin"` on it (R31.8), so there is no
 * user list to render and no role change to offer.
 */

/* Overview ----------------------------------------------------------------- */

export function AdminOverview() {
  const posts = getLatestPosts();
  const featured = posts.filter((post) => post.featured).length;

  const stats = [
    { label: "Posts", value: posts.length },
    { label: "Topics", value: getCategories().length },
    { label: "Tags", value: getTags().length },
    { label: "Featured", value: featured },
  ];

  return (
    <section className="admin-panel">
      <h1 className="admin-panel__title">Dashboard</h1>
      <p className="admin-panel__lead">
        Everything published on AI Pulse, at a glance. Pick a section in the
        sidebar to work on it.
      </p>

      <dl className="admin-stats">
        {stats.map((stat) => (
          <div className="admin-stat" key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section className="admin-block" aria-labelledby="admin-recent-heading">
        <h2 className="admin-block__title" id="admin-recent-heading">
          Recently published
        </h2>
        <ul className="admin-recent">
          {posts.slice(0, 3).map((post) => (
            <li className="admin-recent__item" key={post.slug}>
              <Link to={`/blog/${post.slug}`} className="admin-recent__title">
                {post.title}
              </Link>
              <span className="admin-recent__date">
                {formatDate(post.date)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

/* Manage Users ------------------------------------------------------------- */

const ROLE_NOTES = [
  {
    role: "admin",
    note: "Opens /admin and this dashboard.",
  },
  {
    role: "student",
    note: "The default role for a new account (R31.1).",
  },
  {
    role: "user",
    note: "A standard account, with no admin access.",
  },
] as const;

export function AdminUsers() {
  const { user } = useAuth();

  return (
    <section className="admin-panel">
      <h1 className="admin-panel__title">Manage users</h1>
      <p className="admin-panel__lead">
        Roles, and the one account the browser is allowed to read.
      </p>

      <div className="admin-card">
        <h2 className="admin-card__title">Your account</h2>
        <dl className="admin-account">
          <div className="admin-account__row">
            <dt>Email</dt>
            <dd>{user?.email ?? "Unknown account"}</dd>
          </div>
          <div className="admin-account__row">
            <dt>User ID</dt>
            <dd>{user?.uid ?? "Unknown"}</dd>
          </div>
          <div className="admin-account__row">
            <dt>Role</dt>
            <dd>
              <span className="admin-badge">admin</span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="admin-note">
        <h2>Why there is no user list here</h2>
        <p>
          The committed rules let an account read, create, update and delete only
          its own <code>users/&#123;uid&#125;</code> document, and forbid a client
          from writing <code>role: "admin"</code> on it (R31.8). That is
          deliberate: a role is a permission, so it must not be grantable from
          the page it protects. Listing every account needs a privileged
          server-side path that does not exist yet.
        </p>
      </div>

      <div className="admin-note">
        <h2>Change a role</h2>
        <ol>
          <li>
            Open the Firebase console and go to <strong>Firestore Database</strong>.
          </li>
          <li>
            Open the <code>users</code> collection, then the document whose id is
            the account's user ID.
          </li>
          <li>
            Set <code>role</code> to <code>"admin"</code>,{" "}
            <code>"student"</code> or <code>"user"</code>.
          </li>
          <li>The account picks the change up on its next reload or sign-in.</li>
        </ol>
      </div>

      <div className="admin-block">
        <h2 className="admin-block__title">What each role can do</h2>
        <ul className="admin-roles">
          {ROLE_NOTES.map((entry) => (
            <li className="admin-roles__item" key={entry.role}>
              <span className="admin-badge">{entry.role}</span>
              <span>{entry.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* Unknown section ---------------------------------------------------------- */

export function AdminSectionMissing() {
  return (
    <section className="admin-panel">
      <h1 className="admin-panel__title">Section not found</h1>
      <p className="admin-panel__lead">
        That admin section does not exist. Pick one from the sidebar.
      </p>
      <Link to="/admin/dashboard" className="btn btn--primary">
        Back to the dashboard
      </Link>
    </section>
  );
}
