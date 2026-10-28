import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useWorkspaceRole } from "../hooks/useWorkspaceRole";
import { canEditWorkspace } from "../lib/workspaces";
import { useWorkspaceSite } from "./WorkspaceContext";
import { PlusIcon } from "./icons";

/**
 * R48 — the way back into a tenant's admin from its own public pages.
 *
 * R48 keeps every public tenant route public: a signed-in stranger, including
 * the platform operator, sees the site and nothing else. The site's own owner
 * or editor is not a stranger, though, and hiding the admin from them left the
 * demo owners with no visible route into their own panel after sign-in.
 *
 * The role is settled by `useWorkspaceRole` — the same `fetchWorkspaceRole`
 * seam the admin gate uses — so the bar appears only when the gate would admit
 * the account. It is rendered inside `WorkspaceLayout`, which means it follows
 * the owner across the site's home, archive and article pages. The header keeps
 * its public-only shape; this bar is the single, honest exception on a public
 * page, and it is scoped to the workspace being displayed.
 */
export function SiteAdminBar() {
  const site = useWorkspaceSite();
  const auth = useAuth();
  const { role } = useWorkspaceRole(
    site?.workspace.id ?? null,
    auth.user?.uid ?? null,
  );

  if (!site || !auth.user || !canEditWorkspace(role)) return null;

  const name =
    site.workspace.branding.title || site.workspace.name || "this site";
  const roleLabel = role === "owner" ? "Owner" : "Editor";

  return (
    <aside className="site-admin-bar" aria-label="Site administration">
      <div className="container site-admin-bar__inner">
        <p className="site-admin-bar__text">
          <span className="badge">{roleLabel}</span>
          {" "}You can edit {name}.
        </p>

        <div className="site-admin-bar__actions">
          <Link to={`${site.basePath}/admin`} className="btn btn--outline btn--sm">
            Site admin
          </Link>
          <Link
            to={`${site.basePath}/admin/new`}
            className="btn btn--primary btn--sm"
          >
            <PlusIcon size={16} />
            <span>Add new blog</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}
