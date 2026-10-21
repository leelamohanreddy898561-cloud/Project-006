import { useState } from "react";
import { Link } from "react-router-dom";
import type { Post } from "../types/post";
import { slugify } from "../data/posts";
import { BookmarkIcon, ClockIcon } from "./icons";
import "./BlogCard.css";

type BlogCardProps = {
  post: Post;
};

/**
 * R19.4–R19.8 — article card: cover image, category badge, title, read time,
 * author, and a bookmark toggle.
 *
 * The bookmark is a local UI toggle for now; persisting it needs an account
 * (Firebase Auth) and will be wired up with the auth requirement.
 */
export function BlogCard({ post }: BlogCardProps) {
  const [bookmarked, setBookmarked] = useState(false);

  return (
    <article className="blog-card">
      <Link
        to={`/blog/${post.slug}`}
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
            to={`/topics/${slugify(post.category)}`}
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
          <Link to={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>

        <p className="blog-card__excerpt">{post.excerpt}</p>

        <div className="blog-card__meta">
          <span className="author">
            <span className="author__avatar" aria-hidden="true">
              {post.author.initials}
            </span>
            <span className="author__name">{post.author.name}</span>
          </span>

          <span className="blog-card__readtime">
            <ClockIcon />
            {post.readingTime} min read
          </span>
        </div>
      </div>
    </article>
  );
}
