import { Link } from "react-router-dom";
import "./Home.css";

/** R1 (partial) — home page hero with the primary call-to-action button. */
export function Home() {
  return (
    <section className="hero container">
      <p className="hero__eyebrow">AI Pulse — an AI blog</p>
      <h1 className="hero__title">
        Making sense of AI, <span>one pulse at a time</span>.
      </h1>
      <p className="hero__lead">
        We track what actually matters in artificial intelligence — model
        releases, research worth reading, and practical guides. No hype, no
        endless takes.
      </p>
      <Link to="/blog" className="btn btn--primary hero__cta">
        Read Blogs
      </Link>
    </section>
  );
}
