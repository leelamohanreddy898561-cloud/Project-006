import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import { WorkspaceSiteProvider } from "../components/WorkspaceContext";
import { fetchWorkspaceBySlug, type Workspace } from "../lib/workspaces";
import "./WorkspaceSite.css";

/**
 * R43 — the tenant route element.
 *
 * A workspace is addressed by its slug (`/w/<slug>`), which is public content:
 * the workspace document carries only the name, slug and branding, so a visitor
 * needs no account to read a company's site. Unknown, malformed or unreadable
 * slugs each get an honest page rather than an empty shell or a crash.
 */
export function WorkspaceLayout() {
  const { siteSlug = "" } = useParams();
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">(
    "loading",
  );
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    setStatus("loading");
    setWorkspace(null);

    fetchWorkspaceBySlug(siteSlug).then((outcome) => {
      if (!active) return;

      if (!outcome.ok) {
        setMessage(outcome.message);
        setStatus("error");
        return;
      }

      if (!outcome.workspace) {
        setStatus("missing");
        return;
      }

      setWorkspace(outcome.workspace);
      setStatus("ready");
    });

    return () => {
      active = false;
    };
  }, [siteSlug]);

  const value = useMemo(
    () =>
      workspace
        ? { workspace, basePath: `/w/${workspace.slug}` }
        : null,
    [workspace],
  );

  if (status === "loading") {
    return (
      <div className="container site-state" aria-busy="true">
        <p role="status">Loading site…</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="container site-state">
        <h1 className="site-state__title">This site is unavailable</h1>
        <p className="site-state__text">{message}</p>
      </div>
    );
  }

  if (!workspace || !value) {
    return (
      <div className="container site-state">
        <p className="post-missing__code">404</p>
        <h1 className="site-state__title">Site not found</h1>
        <p className="site-state__text">
          There is no site at <code>/w/{siteSlug}</code>. Check the address, or
          head back to the home page.
        </p>
        <Link to="/" className="btn btn--primary">
          Back home
        </Link>
      </div>
    );
  }

  return (
    <WorkspaceSiteProvider value={value}>
      <Outlet />
    </WorkspaceSiteProvider>
  );
}
