import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { BlogCard } from "../components/BlogCard";
import { CloseIcon, SearchIcon } from "../components/icons";
import { useSavedBlogs } from "../hooks/useSavedBlogs";
import { mergePosts } from "../lib/blog-posts";
import {
  filterPosts,
  getCategories,
  getLatestPosts,
  getTags,
} from "../data/posts";
import "./BlogList.css";

/**
 * R2 — the blog index: every post, newest first, searchable by text and
 * narrowable by topic and tag. All three filters live in the URL (`q`, `topic`,
 * `tag`) so a filtered view can be shared or bookmarked (AC2.4).
 *
 * R37 — saved posts are part of the same list, and a failed read leaves the
 * repository articles in place with a short notice.
 */
export function BlogList() {
  const [params, setParams] = useSearchParams();
  const saved = useSavedBlogs();

  const query = params.get("q") ?? "";
  const topic = params.get("topic") ?? "";
  const tag = params.get("tag") ?? "";

  const allPosts = useMemo(
    () => mergePosts(getLatestPosts(), saved.posts),
    [saved.posts],
  );
  const topics = useMemo(() => getCategories(allPosts), [allPosts]);
  const tags = useMemo(() => getTags(allPosts), [allPosts]);
  const visible = useMemo(
    () => filterPosts(allPosts, { query, topic, tag }),
    [allPosts, query, topic, tag],
  );

  const activeTopic = topics.find((item) => item.slug === topic);
  const activeTag = tags.find((item) => item === tag);
  const hasFilters = query !== "" || topic !== "" || tag !== "";

  function setFilter(key: "q" | "topic" | "tag", value: string) {
    const next = new URLSearchParams(params);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    // Typing must not fill the history stack with one entry per keystroke.
    setParams(next, { replace: true });
  }

  function clearFilters() {
    setParams(new URLSearchParams(), { replace: true });
  }

  return (
    <div className="container blog-list">
      <header className="blog-list__intro">
        <p className="blog-list__eyebrow">The archive</p>
        <h1 className="blog-list__title">Blogs</h1>
        <p className="blog-list__lead">
          Every article on AI Pulse — sort by topic or tag, or search the full
          text to find exactly what you need.
        </p>
      </header>

      <div className="blog-list__toolbar">
        {/* R40 — a <label>, not a <div>: the whole field is the tap target,
            not just the 18px input inside it. */}
        <label className="blog-list__search">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(event) => setFilter("q", event.target.value)}
            placeholder="Search title, excerpt, topic, or tag…"
            aria-label="Search blogs"
          />
          {query && (
            <button
              type="button"
              className="blog-list__search-clear"
              onClick={() => setFilter("q", "")}
              aria-label="Clear search"
            >
              <CloseIcon size={12} />
            </button>
          )}
        </label>

        <p className="blog-list__count" role="status" aria-live="polite">
          {visible.length} {visible.length === 1 ? "post" : "posts"}
        </p>
      </div>

      {saved.status === "error" && (
        <p className="blog-list__notice" role="status">
          Saved posts could not be loaded right now — showing the site archive.
        </p>
      )}

      <div
        className="blog-list__filters"
        role="group"
        aria-label="Filter by topic"
      >
        <span className="blog-list__filter-label" aria-hidden="true">
          Topic
        </span>
        <button
          type="button"
          className={topic ? "filter-chip" : "filter-chip is-active"}
          aria-pressed={topic === ""}
          onClick={() => setFilter("topic", "")}
        >
          All
        </button>
        {topics.map((item) => (
          <button
            key={item.slug}
            type="button"
            className={
              topic === item.slug ? "filter-chip is-active" : "filter-chip"
            }
            aria-pressed={topic === item.slug}
            onClick={() =>
              setFilter("topic", topic === item.slug ? "" : item.slug)
            }
          >
            {item.name}
            <span className="filter-chip__count" aria-hidden="true">
              {item.count}
            </span>
          </button>
        ))}
      </div>

      <div
        className="blog-list__filters"
        role="group"
        aria-label="Filter by tag"
      >
        <span className="blog-list__filter-label" aria-hidden="true">
          Tag
        </span>
        {tags.map((item) => (
          <button
            key={item}
            type="button"
            className={
              tag === item ? "filter-chip is-active" : "filter-chip"
            }
            aria-pressed={tag === item}
            onClick={() => setFilter("tag", tag === item ? "" : item)}
          >
            #{item}
          </button>
        ))}
      </div>

      {hasFilters && (
        <p className="blog-list__summary">
          Showing
          {activeTopic ? <> in <strong>{activeTopic.name}</strong></> : null}
          {activeTag ? <> tagged <strong>#{activeTag}</strong></> : null}
          {query ? <> matching “{query}”</> : null}
          <button
            type="button"
            className="blog-list__clear"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </p>
      )}

      {visible.length > 0 ? (
        <div className="post-grid blog-list__grid">
          {visible.map((post) => (
            <BlogCard key={post.slug} post={post} showDate showTags />
          ))}
        </div>
      ) : (
        <div className="blog-list__empty" role="status">
          <h2 className="blog-list__empty-title">No posts match those filters</h2>
          <p>
            Try a different keyword, or clear the filters to see every article.
          </p>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
