import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { NetworkBackground } from "../components/hero/NetworkBackground";
import { TopicCard } from "../components/hero/TopicCard";
import { BlogCard } from "../components/BlogCard";
import { Sidebar } from "../components/Sidebar";
import { useSavedBlogs } from "../hooks/useSavedBlogs";
import { mergePosts } from "../lib/blog-posts";
import {
  getLatestPosts,
  getTrendingTopics,
  selectPosts,
  type QuickFilter,
} from "../data/posts";
import "./Home.css";

/** R1 (hero) + R19 (main content layout) + R37 (saved posts in the grid). */
export function Home() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QuickFilter>("all");
  const saved = useSavedBlogs();

  // R37 — the repository articles render immediately; saved posts join them
  // when Firestore answers, and a failed read simply leaves the seed grid.
  const latest = useMemo(
    () => mergePosts(getLatestPosts(), saved.posts),
    [saved.posts],
  );
  const topics = useMemo(() => getTrendingTopics(5, latest), [latest]);
  const visible = useMemo(
    () => selectPosts(latest, query, filter),
    [latest, query, filter],
  );

  return (
    <>
      <section className="hero container">
        <NetworkBackground />

        <div className="hero__content">
          <div className="hero__text">
            <p className="hero__eyebrow">AI Pulse — an AI blog</p>
            <h1 className="hero__title">
              Explore the <span>Future of AI</span>
            </h1>
            <p className="hero__lead">
              Clear, practical coverage of the models, research, and tools
              shaping artificial intelligence — what changed, why it matters,
              and what to do about it.
            </p>
            <Link to="/blog" className="btn btn--primary hero__cta">
              Start Reading
            </Link>
          </div>

          <TopicCard />
        </div>
      </section>

      <section className="home-main container" aria-labelledby="latest-heading">
        <div className="home-main__articles">
          <div className="home-main__header">
            <h2 className="home-main__title" id="latest-heading">
              Latest articles
            </h2>
            <Link to="/blog" className="home-main__link">
              View all
            </Link>
          </div>

          {visible.length > 0 ? (
            <div className="post-grid">
              {visible.map((post) => (
                <BlogCard key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <p className="post-grid__empty">
              No articles match your search. Try a different keyword or clear
              the filters.
            </p>
          )}
        </div>

        <Sidebar
          topics={topics}
          query={query}
          onQueryChange={setQuery}
          filter={filter}
          onFilterChange={setFilter}
          resultCount={visible.length}
        />
      </section>
    </>
  );
}
