import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { Logo } from "../components/Logo";
import { DocsIcon, PlusIcon, UsersIcon } from "../components/icons";
import "./AdminDashboard.css";

/**
 * R32 — the admin dashboard shell.
 *
 * `/admin/dashboard` and everything under it renders inside this layout: a
 * sidebar that switches sections, and the panel for the section on screen. The
 * R31 guard wraps the whole route family in `App.tsx`, so this component only
 * ever renders for an account whose role is `"admin"`.
 *
 * The active item is computed with an exact path comparison rather than
 * `NavLink`'s prefix matching, so `/admin/dashboard/blogs/new` marks only
 * "Add New Blog" — never "All Blogs" as well.
 */

const SECTIONS = [
  {
    path: "/admin/dashboard/blogs",
    label: "All Blogs",
    icon: DocsIcon,
  },
  {
    path: "/admin/dashboard/blogs/new",
    label: "Add New Blog",
    icon: PlusIcon,
  },
  {
    path: "/admin/dashboard/users",
    label: "Manage Users",
    icon: UsersIcon,
  },
] as const;

const OVERVIEW_PATH = "/admin/dashboard";

export function AdminDashboard() {
  const { pathname } = useLocation();

  // A dashboard is a workspace, so the document title says which section is
  // open — the same contract R24.3 sets for the auth pages.
  useEffect(() => {
    const section = SECTIONS.find((entry) => entry.path === pathname);
    const previous = document.title;

    document.title = section
      ? `${section.label} — AI Pulse Admin`
      : "Dashboard — AI Pulse Admin";

    return () => {
      document.title = previous;
    };
  }, [pathname]);

  return (
    <div className="container admin-shell">
      <div className="admin-shell__aside">
        <Link to={OVERVIEW_PATH} className="admin-shell__brand">
          <Logo />
          <span className="admin-shell__brand-text">
            <span className="admin-shell__brand-name">AI Pulse</span>
            <span className="admin-shell__brand-sub">Administration</span>
          </span>
        </Link>

        <nav className="admin-nav" aria-label="Admin sections">
          <ul className="admin-nav__list">
            {SECTIONS.map(({ path, label, icon: Icon }) => {
              const current = pathname === path;

              return (
                <li key={path}>
                  <Link
                    to={path}
                    className={
                      current ? "admin-nav__link is-current" : "admin-nav__link"
                    }
                    aria-current={current ? "page" : undefined}
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <Link to="/" className="admin-shell__back">
          <span aria-hidden="true">←</span> Back to the site
        </Link>
      </div>

      <div className="admin-shell__content">
        <Outlet />
      </div>
    </div>
  );
}
