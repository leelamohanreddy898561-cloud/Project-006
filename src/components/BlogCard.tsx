import { useState } from "react";
import { Link } from "react-router-dom";
import type { Post } from "../types/post";
import { formatDate, slugify } from "../data/posts";
import { BookmarkIcon, ClockIcon } from "./icons";
import { useWorkspaceSite } from "./WorkspaceContext";
import "./BlogCard.css";

type BlogCardProps = {
  post: Post;
  /** R2.1 — the /blog list also shows the publication date. */
  showDate?: boolean;
  /** R2.1 — the /blog list also shows its tags, each linking to that filter. */
  showTags?: boolean;
};

/**
 * R19.4–R19.8 — article card: cover image, category badge, title, read time,
 * author, and a bookmark toggle.
 *
 * The bookmark is a local UI toggle for now; persisting it needs an account
 * (Firebase Auth) and will be wired up with the auth requirement.
 */
export function BlogCard({ post, showDate = false, showTags = false }: BlogCardProps) {
  const [bookmarked, setBookmarked] = useState(false);

  // R43 — inside a tenant site every link stays on that site.
  const basePath = useWorkspaceSite()?.basePath ?? "";
  const postHref = `${basePath}/blog/${post.slug}`;
  const categoryHref = basePath
    ? `${basePath}/blog?topic=${slugify(post.category)}`
    : `/topics/${slugify(post.category)}`;

  return (
    <article className="blog-card">
      <Link
        to={postHref}
        className="blog-card__media"
        tabIndex={-1}
        aria-hidden="true"
      >
        <img
          src={post.coverImage}
          alt=""
          width={800}
          height={500}
          loading="lazy"
        />
      </Link>

      <div className="blog-card__body">
        <div className="blog-card__top">
          <Link
            to={categoryHref}
            className="badge"
          >
            {post.category}
          </Link>

          <button
            type="button"
            className={
              bookmarked ? "bookmark is-active" : "bookmark"
            }
            aria-pressed={bookmarked}
            aria-label={
              bookmarked
                ? `Remove bookmark: ${post.title}`
                : `Bookmark: ${post.title}`
            }
            onClick={() => setBookmarked((value) => !value)}
          >
            <BookmarkIcon filled={bookmarked} />
          </button>
        </div>

        <h3 className="blog-card__title">
          <Link to={postHref}>{post.title}</Link>
        </h3>

        <p className="blog-card__excerpt">{post.excerpt}</p>

        {showTags && (
          <ul className="blog-card__tags" aria-label={`Tags for ${post.title}`}>
            {post.tags.map((tag) => (
              <li key={tag}>
                <Link
                  to={`${basePath}/blog?tag=${encodeURIComponent(tag)}`}
                  className="blog-card__tag"
                >
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="blog-card__meta">
          <span className="author">
            <span className="author__avatar" aria-hidden="true">
              {post.author.initials}
            </span>
            <span className="author__name">{post.author.name}</span>
          </span>

          <span className="blog-card__meta-end">
            {showDate && (
              <time className="blog-card__date" dateTime={post.date}>
                {formatDate(post.date)}
              </time>
            )}
            <span className="blog-card__readtime">
              <ClockIcon />
              {post.readingTime} min read
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}
