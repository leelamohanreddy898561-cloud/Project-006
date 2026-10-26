import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { BlogCard } from "../components/BlogCard";
import { CommentSection } from "../components/CommentSection";
import { ShareRail } from "../components/ShareRail";
import { useSavedBlogs } from "../hooks/useSavedBlogs";
import { mergePosts } from "../lib/blog-posts";
import {
  formatDate,
  getLatestPosts,
  getRelatedPostsFrom,
} from "../data/posts";
import { renderMarkdown } from "../lib/markdown";
import "./PostDetail.css";

/**
 * R23 — article detail page: header image, prose body with a floating action
 * rail, then comments and related articles.
 *
 * R37 — a saved post opens here too. An unknown slug waits for the saved posts
 * to finish loading before it says "not found", so a deep link to a saved post
 * never shows a false 404.
 */
export function PostDetail() {
  const { slug = "" } = useParams();
  const saved = useSavedBlogs();

  const posts = useMemo(
    () => mergePosts(getLatestPosts(), saved.posts),
    [saved.posts],
  );
  const post = useMemo(
    () => posts.find((item) => item.slug === slug),
    [posts, slug],
  );

  useEffect(() => {
    if (!post) return undefined;
    const previous = document.title;
    document.title = `${post.title} — AI Pulse`;
    return () => {
      document.title = previous;
    };
  }, [post]);

  const html = useMemo(
    () => (post ? renderMarkdown(post.body) : ""),
    [post],
  );

  if (!post) {
    if (saved.status === "loading") {
      return (
        <div className="container post-missing" aria-busy="true">
          <p role="status">Loading article…</p>
        </div>
      );
    }

    return (
      <div className="container post-missing">
        <p className="post-missing__code">404</p>
        <h1 className="post-missing__title">Article not found</h1>
        <p className="post-missing__text">
          There is no article at this address. It may have been renamed, or the
          link may be mistyped.
        </p>
        <div className="post-missing__actions">
          <Link to="/blog" className="btn btn--primary">
            Browse all articles
          </Link>
          <Link to="/" className="btn">
            Back home
          </Link>
        </div>
      </div>
    );
  }

  const related = getRelatedPostsFrom(posts, post.slug, 3);
  const published = formatDate(post.date);
  const shareUrl = typeof window === "undefined" ? "" : window.location.href;

  return (
    <article className="post-page">
      <header className="container post-page__header">
        <nav className="post-page__crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/blog">Blogs</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{post.category}</span>
        </nav>

        <h1 className="post-page__title">{post.title}</h1>
        <p className="post-page__excerpt">{post.excerpt}</p>

        <div className="post-page__meta">
          <span className="author">
            <span className="author__avatar" aria-hidden="true">
              {post.author.initials}
            </span>
            <span>
              <span className="post-page__author-name">{post.author.name}</span>
              <span className="post-page__author-role">
                {" · "}
                {post.author.role}
              </span>
            </span>
          </span>

          <span className="post-page__stat">
            {published ? `${published} · ` : ""}
            {post.readingTime} min read
          </span>
        </div>
      </header>

      {/* R23.4 — header image at the top of the article */}
      <div className="container">
        <img
          className="post-page__cover"
          src={post.coverImage}
          alt=""
          width={800}
          height={500}
        />
      </div>

      <div className="container post-page__layout">
        <ShareRail title={post.title} url={shareUrl} />

        <div className="post-page__body">
          <div
            className="prose"
            // Trusted, repository-authored Markdown — see src/lib/markdown.ts.
            dangerouslySetInnerHTML={{ __html: html }}
          />
          <CommentSection />
        </div>
      </div>

      {related.length > 0 && (
        <section
          className="container post-page__related"
          aria-labelledby="related-heading"
        >
          <h2 className="post-page__related-title" id="related-heading">
            Related articles
          </h2>
          <div className="post-grid">
            {related.map((item) => (
              <BlogCard key={item.slug} post={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
