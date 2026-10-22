import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { Newsletter } from "./Newsletter";
import { SITE } from "../data/site";
import { getCategories } from "../data/posts";
import { GitHubIcon, LinkedInIcon, XIcon } from "./icons";
import "./Footer.css";

const SOCIAL_ICONS = {
  x: XIcon,
  github: GitHubIcon,
  linkedin: LinkedInIcon,
} as const;

/**
 * R20.5–R20.10 — newsletter box above a four-column footer and a legal bar.
 * Rendered site-wide, below `<main>`, so every route ends the same way.
 */
export function Footer() {
  const year = new Date().getFullYear();
  const categories = getCategories();

  return (
    <>
      <Newsletter />

      <footer className="site-footer">
        <div className="container site-footer__inner">
          <div className="site-footer__col site-footer__brand">
            <Link
              to="/"
              className="site-footer__brand-link"
            >
              <Logo />
              <span className="site-footer__brand-name">{SITE.name}</span>
            </Link>
            <p className="site-footer__intro">{SITE.intro}</p>
          </div>

          <nav className="site-footer__col" aria-labelledby="footer-links-heading">
            <h2 className="site-footer__heading" id="footer-links-heading">
              Quick links
            </h2>
            <ul className="site-footer__list">
              {SITE.quickLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav
            className="site-footer__col"
            aria-labelledby="footer-topics-heading"
          >
            <h2 className="site-footer__heading" id="footer-topics-heading">
              AI categories
            </h2>
            <ul className="site-footer__list">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link to={`/topics/${category.slug}`}>{category.name}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-footer__col">
            <h2 className="site-footer__heading" id="footer-social-heading">
              Social
            </h2>
            <ul
              className="site-footer__social"
              aria-labelledby="footer-social-heading"
            >
              {SITE.socials.map((social) => {
                const Icon = SOCIAL_ICONS[social.id];
                return (
                  <li key={social.id}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.ariaLabel}
                      title={social.label}
                    >
                      <Icon size={18} />
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="container site-footer__bottom">
          <p className="site-footer__copy">
            © {year} {SITE.name}. All rights reserved.
          </p>
          <ul className="site-footer__legal">
            {SITE.legal.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      </footer>
    </>
  );
}
