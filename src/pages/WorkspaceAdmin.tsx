import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  useOutletContext,
  useParams,
} from "react-router-dom";
import { ManageBlogs } from "../components/admin/ManageBlogs";
import { DocsIcon, PlusIcon } from "../components/icons";
import { useAuth } from "../hooks/useAuth";
import { fetchUserRole, isAdminRole } from "../lib/users";
import {
  fetchWorkspaceBySlug,
  fetchWorkspaceRole,
  type Workspace,
  type WorkspaceRole,
} from "../lib/workspaces";
import { AddBlog } from "./AddBlog";
import "./WorkspaceSite.css";

/**
 * R44 / R45 — a workspace's admin, gated by that workspace's role.
 *
 * Access is decided by `workspaces/{id}.ownerUid` and `members/{uid}`, not by
 * the global `users/{uid}.role`: an account that runs one site has no business
 * opening another. R45 adds the one exception the product asks for — the
 * platform admin may administer every workspace — and settles the workspace
 * role first, so an owner or editor never depends on the global profile.
 *
 * A failed role read fails closed, and the rules enforce the same boundary for
 * anything this page could try to write.
 *
 * The gate is the route element for the whole `/w/<slug>/admin` family, so the
 * post list and the composer share one access decision and one resolved
 * workspace. R45 makes the page a writer: the list edits and deletes, and the
 * composer writes a new post. R47 gives those two sections the same shape the
 * platform dashboard has — a section nav with **All posts** and
 * **Add new blog** — so adding a post is a visible destination of its own, not
 * a link buried in a line of meta text.
 */

/** The resolved site and role every child of the gate receives. */
export interface WorkspaceAdminContext {
  workspace: Workspace;
  /** "admin" is the platform admin's override, not workspace ownership. */
  role: WorkspaceRole | "admin";
  /** `/w/<slug>` — the public base path for links inside this site. */
  basePath: string;
}

type GatePhase = "loading" | "ready" | "missing" | "denied" | "error";

export function WorkspaceAdminGate() {
  const { siteSlug = "" } = useParams();
  const auth = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [role, setRole] = useState<WorkspaceRole | "admin" | null>(null);
  const [phase, setPhase] = useState<GatePhase>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const uid = auth.user?.uid;

    if (!uid) return undefined;

    let active = true;

    setPhase("loading");
    setMessage("");
    setRole(null);

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

      if (
        access.ok &&
        (access.role === "owner" || access.role === "editor")
      ) {
        setRole(access.role);
        setPhase("ready");
        return;
      }

      // R45 — the platform admin may administer every workspace. This is read
      // only after the workspace role says no, so a tenant's own role always
      // wins, and a failed global read still fails closed.
      try {
        const globalRole = await fetchUserRole(uid);

        if (!active) return;

        if (isAdminRole(globalRole)) {
          setRole("admin");
          setPhase("ready");
          return;
        }
      } catch {
        if (!active) return;
        // Fall through: the workspace read's own answer decides.
      }

      if (!access.ok) {
        setMessage(access.message);
        setPhase("error");
        return;
      }

      setPhase("denied");
    })();

    return () => {
      active = false;
    };
  }, [auth.user?.uid, siteSlug]);

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

  if (phase === "denied" || !workspace || !role) {
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

  const value: WorkspaceAdminContext = {
    workspace,
    role,
    basePath: `/w/${workspace.slug}`,
  };

  return <WorkspaceAdminShell value={value} />;
}

/** The gate's context, typed for both children. */
function useWorkspaceAdmin(): WorkspaceAdminContext {
  return useOutletContext<WorkspaceAdminContext>();
}

/**
 * R47 — the site's admin shell.
 *
 * It carries the identity every section needs (the site, the role, the public
 * base path) and the two section links. The pattern mirrors
 * `/admin/dashboard`: the section a page belongs to is always one click away,
 * and adding a post is a named section rather than a one-off link.
 */
function WorkspaceAdminShell({ value }: { value: WorkspaceAdminContext }) {
  const { workspace, role, basePath } = value;
  const name = workspace.branding.title || workspace.name;
  const roleLabel =
    role === "admin" ? "Platform admin" : role === "owner" ? "Owner" : "Editor";

  return (
    <div className="container ws-admin">
      <header className="ws-admin__header">
        <p className="dashboard__eyebrow">Workspace admin</p>
        <h1 className="site-state__title">{name}</h1>
        <p className="ws-admin__meta">
          <span className="badge">{roleLabel}</span>
          {" · "}
          <Link to={basePath}>View public site</Link>
          {" · "}
          <Link to="/dashboard">All my sites</Link>
        </p>

        <nav className="ws-admin__nav" aria-label="Workspace admin sections">
          <NavLink
            to={`${basePath}/admin`}
            end
            className={({ isActive }) =>
              isActive
                ? "ws-admin__nav-link is-current"
                : "ws-admin__nav-link"
            }
          >
            <DocsIcon size={16} />
            <span>All posts</span>
          </NavLink>
          <NavLink
            to={`${basePath}/admin/new`}
            className={({ isActive }) =>
              isActive
                ? "ws-admin__nav-link ws-admin__nav-link--add is-current"
                : "ws-admin__nav-link ws-admin__nav-link--add"
            }
          >
            <PlusIcon size={16} />
            <span>Add new blog</span>
          </NavLink>
        </nav>
      </header>

      <Outlet context={value} />
    </div>
  );
}

/** The site's post list and editor. */
export function WorkspaceAdmin() {
  const { workspace, basePath } = useWorkspaceAdmin();

  return (
    <ManageBlogs
      workspaceId={workspace.id}
      basePath={basePath}
      includeRepository={false}
    />
  );
}

/** The composer, writing to the workspace the gate resolved. */
export function WorkspaceAdminComposer() {
  const { workspace, basePath } = useWorkspaceAdmin();

  return (
    <AddBlog
      workspaceId={workspace.id}
      basePath={basePath}
      workspaceName={workspace.branding.title || workspace.name}
    />
  );
}
