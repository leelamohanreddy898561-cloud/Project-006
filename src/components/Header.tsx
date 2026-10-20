import { NavLink } from "react-router-dom";
import "./Header.css";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/blog", label: "AI Updates" },
  { to: "/categories", label: "Categories" },
  { to: "/about", label: "About" },
];

/** R15 — persistent site header with brand and primary navigation. */
export function Header() {
  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <NavLink to="/" className="site-header__brand" end>
          <span className="site-header__mark" aria-hidden="true">
            S&amp;N
          </span>
          <span className="site-header__title">Signal &amp; Noise</span>
        </NavLink>

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
      </div>
    </header>
  );
}
