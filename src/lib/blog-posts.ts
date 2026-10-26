import type { Post } from "../types/post";
import { slugify } from "../data/posts";
import { readingTimeFrom } from "./blog-draft";

/**
 * R37 — the bridge from a Firestore `blogs` document to the `Post` the site
 * already renders.
 *
 * Everything here is a plain function with no React and no Firebase, so the
 * suite can execute it directly. The document is written by
 * `src/lib/blog-draft.ts` (R33), but this reader is deliberately tolerant: an
 * older document, a hand-edited field or a missing optional value must not
 * break the archive. Every fallback below is visible and honest — a missing
 * cover becomes the site's default cover, never a broken image.
 */

/** The `blogs` document as Firestore hands it back: an id plus its fields. */
export interface SavedBlogRecord {
  id: string;
  [field: string]: unknown;
}

/** R37 — what a saved post shows when it has no featured image. */
export const DEFAULT_COVER = "/covers/cover-default.svg";

/** The fallbacks the public page uses when a document is incomplete. */
export const UNTITLED_TITLE = "Untitled post";
export const FALLBACK_CATEGORY = "Uncategorised";
export const FALLBACK_AUTHOR = "AI Pulse";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function tagList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();

  for (const entry of value) {
    const tag = text(entry).toLowerCase().replace(/\s+/g, "-");
    if (tag) seen.add(tag);
  }

  return [...seen];
}

/**
 * Only a public image address is used. A Storage download URL is https; a
 * repository cover is root-relative. Anything else falls back to the default,
 * so a stored `javascript:` or malformed value never reaches an `src`.
 */
function safeImageUrl(value: unknown): string {
  const url = text(value);

  if (/^https?:\/\//i.test(url) || url.startsWith("/")) return url;

  return DEFAULT_COVER;
}

/** Two letters for the avatar, from the author's name. */
function initialsFor(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "AI";

  const first = parts[0][0] ?? "";
  const second = parts.length > 1 ? (parts[1][0] ?? "") : "";

  return `${first}${second}`.toUpperCase();
}

/**
 * A `YYYY-MM-DD` date from the shapes a Firestore timestamp can arrive in:
 * a `Timestamp` (with `toDate()` or `seconds`), a Date, or an ISO string.
 * Unknown values become "", which sorts last and is not rendered.
 */
export function isoDate(value: unknown): string {
  if (typeof value === "string") {
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(value.trim());
    return match ? match[1] : "";
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (value && typeof value === "object") {
    const candidate = value as {
      toDate?: () => Date;
      seconds?: number;
    };

    if (typeof candidate.toDate === "function") {
      const date = candidate.toDate();
      if (date instanceof Date && !Number.isNaN(date.getTime())) {
        return date.toISOString().slice(0, 10);
      }
    }

    if (typeof candidate.seconds === "number") {
      return new Date(candidate.seconds * 1000).toISOString().slice(0, 10);
    }
  }

  return "";
}

/** The opening of the content, used when the author left the excerpt empty. */
function excerptFrom(content: string): string {
  const plain = content
    .replace(/[#>*_`[\]()!-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (plain.length <= 180) return plain;

  const cut = plain.slice(0, 180);
  const lastSpace = cut.lastIndexOf(" ");

  return `${cut.slice(0, lastSpace > 80 ? lastSpace : 180).trim()}…`;
}

/**
 * One document, as the visitor-facing `Post`.
 *
 * The document's stored `slug` is authoritative — it is what the composer
 * wrote and what the archive links to. It falls back to a slug derived from the
 * title, then to the document id, so a post is always reachable.
 */
export function savedBlogToPost(record: SavedBlogRecord): Post {
  const title = text(record.title) || UNTITLED_TITLE;
  const content = text(record.content);
  const authorName = text(record.authorName) || FALLBACK_AUTHOR;
  const readingTime =
    typeof record.readingTime === "number" &&
    Number.isFinite(record.readingTime) &&
    record.readingTime > 0
      ? Math.round(record.readingTime)
      : readingTimeFrom(content);

  return {
    slug: text(record.slug) || slugify(title) || record.id,
    title,
    excerpt: text(record.excerpt) || excerptFrom(content),
    date: isoDate(record.createdAt),
    category: text(record.category) || FALLBACK_CATEGORY,
    tags: tagList(record.tags),
    readingTime,
    author: {
      name: authorName,
      initials: initialsFor(authorName),
      role: "Contributor",
    },
    coverImage: safeImageUrl(record.imageUrl),
    // The composer does not feature a saved post; the home grid still shows it
    // in the latest list (R37.4).
    featured: false,
    body: content,
  };
}

/**
 * R37.3 — saved posts and repository articles are one archive.
 *
 * A saved post wins a slug collision, so the same article never appears twice.
 * Newest first; a post with no readable date sorts last, then by title.
 */
export function mergePosts(seed: Post[], saved: Post[]): Post[] {
  const bySlug = new Map<string, Post>();

  for (const post of seed) bySlug.set(post.slug, post);
  for (const post of saved) bySlug.set(post.slug, post);

  return [...bySlug.values()].sort(
    (a, b) =>
      b.date.localeCompare(a.date) || a.title.localeCompare(b.title),
  );
}
