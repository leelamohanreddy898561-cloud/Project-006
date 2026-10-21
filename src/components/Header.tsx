import { NavLink, Link } from "react-router-dom";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { SearchIcon } from "./icons";
import "./Header.css";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/topics", label: "Topics" },
  { to: "/blog", label: "Blogs" },
  { to: "/about", label: "About" },
];

/** R18 — glassmorphism site header (supersedes the flat R15 header). */
export function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Link to="/" className="site-header__brand" aria-label="AI Pulse — home">
          <Logo />
          <span className="site-header__title">AI Pulse</span>
        </Link>

        <nav className="site-header__nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
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
            to="/blog"
            className="icon-btn"
            aria-label="Search posts"
            title="Search posts"
          >
            <SearchIcon />
          </Link>
          <ThemeToggle />
          <Link to="/signin" className="btn btn--primary btn--sm">
            Sign In
          </Link>
          <Link to="/signup" className="btn btn--outline btn--sm">
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
