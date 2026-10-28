import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useSavedBlogs } from "../hooks/useSavedBlogs";
import { savedBlogToPost } from "../lib/blog-posts";
import {
  fetchWorkspaceBySlug,
  fetchWorkspaceRole,
  type Workspace,
  type WorkspaceRole,
} from "../lib/workspaces";
import { formatDate } from "../data/posts";
import "./WorkspaceSite.css";

/**
 * R44 — a workspace's admin, gated by that workspace's role.
 *
 * Access is decided by `workspaces/{id}.ownerUid` and `members/{uid}`, not by
 * the global `users/{uid}.role`: an account that runs one site has no business
 * opening another, and an account with no site has no business here at all. A
 * failed role read fails closed, and the rules enforce the same boundary for
 * anything this page could try to write.
 *
 * R44 shows the site's posts read-only. Writing (create/edit/delete with the
 * workspace named) is R45, so this page says so rather than showing controls
 * that would write to the wrong place.
 */
export function WorkspaceAdmin() {
  const { siteSlug = "" } = useParams();
  const auth = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [role, setRole] = useState<WorkspaceRole | null>(null);
  const [phase, setPhase] = useState<
    "loading" | "ready" | "missing" | "denied" | "error"
  >("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const uid = auth.user?.uid;

    if (!uid) return undefined;

    let active = true;

    setPhase("loading");

    (async () => {
      const found = await fetchWorkspaceBySlug(siteSlug);

      if (!active) return;

      if (!found.ok) {
        setMessage(found.message);
        setPhase("error");
        return;
      }

      if (!found.workspace) {
        setPhase("missing");
        return;
      }

      setWorkspace(found.workspace);

      const access = await fetchWorkspaceRole(found.workspace.id, uid);

      if (!active) return;

      if (!access.ok) {
        setMessage(access.message);
        setPhase("error");
        return;
      }

      setRole(access.role);

      setPhase(
        access.role === "owner" || access.role === "editor" ? "ready" : "denied",
      );
    })();

    return () => {
      active = false;
    };
  }, [auth.user?.uid, siteSlug]);

  const canManage = phase === "ready";
  const saved = useSavedBlogs(canManage && workspace ? workspace.id : null);

  if (auth.status === "loading" || (auth.user && phase === "loading")) {
    return (
      <div className="container site-state" role="status" aria-live="polite">
        Checking access…
      </div>
    );
  }

  if (!auth.user) return <Navigate to="/signin" replace />;

  if (phase === "missing") {
    return (
      <div className="container site-state">
        <p className="post-missing__code">404</p>
        <h1 className="site-state__title">Site not found</h1>
        <p className="site-state__text">
          There is no site at <code>/w/{siteSlug}</code>.
        </p>
        <Link to="/dashboard" className="btn btn--primary">
          My sites
        </Link>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="container site-state">
        <h1 className="site-state__title">Access could not be checked</h1>
        <p className="site-state__text">{message}</p>
        <Link to="/dashboard" className="btn">
          My sites
        </Link>
      </div>
    );
  }

  if (phase === "denied" || !workspace) {
    return (
      <div className="container site-state">
        <h1 className="site-state__title">You do not have access</h1>
        <p className="site-state__text">
          This account is not an owner or an editor of{" "}
          <code>/w/{siteSlug}</code>. Ask that site&apos;s owner for access.
        </p>
        <Link to="/dashboard" className="btn btn--primary">
          My sites
        </Link>
      </div>
    );
  }

  const name = workspace.branding.title || workspace.name;
  const posts = saved.records.map(savedBlogToPost);

  return (
    <div className="container ws-admin">
      <header className="ws-admin__header">
        <p className="dashboard__eyebrow">Workspace admin</p>
        <h1 className="site-state__title">{name}</h1>
        <p className="ws-admin__meta">
          <span className="badge">{role === "owner" ? "Owner" : "Editor"}</span>
          {" · "}
          <Link to={`/w/${workspace.slug}`}>View public site</Link>
          {" · "}
          <Link to="/dashboard">All my sites</Link>
        </p>
      </header>

      <section className="ws-admin__section" aria-labelledby="ws-posts">
        <h2 id="ws-posts" className="ws-admin__section-title">
          Posts
        </h2>

        {saved.status === "error" && (
          <p className="dashboard__notice" role="status">
            This site&apos;s posts could not be loaded right now.
          </p>
        )}

        {posts.length === 0 && saved.status === "ready" ? (
          <div className="dashboard__empty" role="status">
            <h3 className="dashboard__empty-title">No posts yet</h3>
            <p>
              This site has not published anything. Writing and editing here is
              the next requirement; nothing is invented on this page.
            </p>
          </div>
        ) : (
          <ul className="ws-admin__posts">
            {posts.map((post) => (
              <li className="ws-admin__post" key={post.slug}>
                <div>
                  <Link
                    className="ws-admin__post-title"
                    to={`/w/${workspace.slug}/blog/${post.slug}`}
                  >
                    {post.title}
                  </Link>
                  <p className="ws-admin__post-meta">
                    {post.category}
                    {post.date ? ` · ${formatDate(post.date)}` : ""} ·{" "}
                    {post.readingTime} min read
                  </p>
                </div>
                <span className="badge">Published</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
