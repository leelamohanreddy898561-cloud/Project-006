import { NavLink, Link, useLocation } from "react-router-dom";
import { AccountMenu } from "./AccountMenu";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { SearchIcon } from "./icons";
import { useAuth } from "../hooks/useAuth";
import "./Header.css";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/topics", label: "Topics" },
  { to: "/blog", label: "Blogs" },
  { to: "/about", label: "About" },
];

/**
 * R43 — inside a tenant site the header navigates that site, not the platform:
 * Home and Blogs both stay under `/w/<slug>`. Topics and About belong to the
 * global site, so they are not offered where they would leave the tenant (and
 * land on a placeholder that is not that company's).
 */
function navFor(sitePrefix: string) {
  if (!sitePrefix) return NAV_ITEMS;

  return [
    { to: sitePrefix, label: "Home" },
    { to: `${sitePrefix}/blog`, label: "Blogs" },
  ];
}

/** R18 — glassmorphism site header (supersedes the flat R15 header). */
export function Header() {
  const { status, user } = useAuth();
  const { pathname } = useLocation();
  const sitePrefix = /^\/w\/[^/]+/.exec(pathname)?.[0] ?? "";
  const homeHref = sitePrefix || "/";

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link
          to={homeHref}
          className="site-header__brand"
          aria-label="AI Pulse — home"
        >
          <Logo />
          <span className="site-header__title">AI Pulse</span>
        </Link>

        <nav className="site-header__nav" aria-label="Main navigation">
          {navFor(sitePrefix).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === homeHref}
              className={({ isActive }) =>
                isActive ? "site-nav__link is-active" : "site-nav__link"
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header__actions">
          <Link
            to={`${sitePrefix}/blog`}
            className="icon-btn"
            aria-label="Search posts"
            title="Search posts"
          >
            <SearchIcon />
          </Link>
          <ThemeToggle />
          {/* R29: the header tells the truth about the session as soon as
              Firebase answers; until then it shows the signed-out controls,
              which is also the correct state for a first-time visitor. */}
          {status === "signedIn" && user ? (
            <AccountMenu user={user} />
          ) : (
            <>
              <Link to="/signin" className="btn btn--primary btn--sm">
                Sign In
              </Link>
              <Link to="/signup" className="btn btn--outline btn--sm">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
