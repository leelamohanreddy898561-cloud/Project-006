import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "../icons";
import "./TopicCard.css";

/**
 * R1.3 — live floating "popular AI topic" card.
 *
 * Cycles through a small list of topics so the card feels live. Rotation
 * stops under `prefers-reduced-motion`; the float animation itself is
 * neutralised by the global reduced-motion rule in base.css.
 *
 * Post counts are placeholders until the content model (R13) lands.
 */

const TOPICS = [
  { name: "Mixture-of-Experts", posts: 12, tags: ["models", "architecture"] },
  { name: "Prompt Engineering", posts: 9, tags: ["prompting", "guides"] },
  { name: "AI Benchmarks", posts: 7, tags: ["evaluation", "news"] },
  { name: "Multimodal Models", posts: 5, tags: ["vision", "models"] },
];

const ROTATE_MS = 4500;

export function TopicCard() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(
      () => setIndex((current) => (current + 1) % TOPICS.length),
      ROTATE_MS,
    );
    return () => window.clearInterval(id);
  }, []);

  const topic = TOPICS[index];

  return (
    <aside className="topic-card" aria-label="Popular AI topics">
      <div className="topic-card__sheen" aria-hidden="true" />
      <div className="topic-card__head">
        <span className="topic-card__live">
          <span className="topic-card__dot" aria-hidden="true" />
          Live
        </span>
        <span className="topic-card__label">Popular topic</span>
      </div>

      <p className="topic-card__name" key={topic.name}>
        {topic.name}
      </p>

      <p className="topic-card__meta">
        {topic.posts} posts · {topic.tags.map((tag) => `#${tag}`).join(" ")}
      </p>

      <Link to="/topics" className="topic-card__link">
        Explore topics
        <ArrowRightIcon size={14} />
      </Link>
    </aside>
  );
}
