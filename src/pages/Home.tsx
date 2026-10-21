import { Link } from "react-router-dom";
import { NetworkBackground } from "../components/hero/NetworkBackground";
import { TopicCard } from "../components/hero/TopicCard";
import "./Home.css";

/** R1 — home page hero (R1.1–R1.6). */
export function Home() {
  return (
    <section className="hero container">
      <NetworkBackground />

      <div className="hero__content">
        <div className="hero__text">
          <p className="hero__eyebrow">AI Pulse — an AI blog</p>
          <h1 className="hero__title">
            Explore the <span>Future of AI</span>
          </h1>
          <p className="hero__lead">
            Clear, practical coverage of the models, research, and tools shaping
            artificial intelligence — what changed, why it matters, and what to
            do about it.
          </p>
          <Link to="/blog" className="btn btn--primary hero__cta">
            Start Reading
          </Link>
        </div>

        <TopicCard />
      </div>
    </section>
  );
}
