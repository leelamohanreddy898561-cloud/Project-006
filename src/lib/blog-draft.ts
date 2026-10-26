import { getCategories, slugify } from "../data/posts";

/**
 * R33 — the blog draft: what is valid, and what it becomes.
 *
 * Everything here is a plain function with no React and no Firebase, for two
 * reasons:
 *
 *   1. The composer is behind the R31 guard, so a browser test cannot reach it
 *      without an account promoted in the Firebase console. Keeping the rules
 *      and the document shape in one importable module means the suite can
 *      execute them directly instead of trusting a screen it cannot open.
 *   2. A save that fails validation must never reach Firestore, so the check
 *      belongs in one place both the form and the tests call.
 *
 * `src/lib/blogs.ts` is the only module that talks to Firebase on this page's
 * behalf; this one decides what is worth sending.
 */

/** Largest featured image the form accepts, in bytes (5 MB). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Content types the featured-image field accepts. */
export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/svg+xml",
] as const;

/** Reading time is derived at ≈200 words per minute (R13.2). */
export const WORDS_PER_MINUTE = 200;

export interface BlogDraft {
  title: string;
  category: string;
  excerpt: string;
  tags: string;
  content: string;
}

/** The signed-in account, as it is recorded on the document. */
export interface BlogAuthor {
  uid: string;
  name: string;
  email: string | null;
}

export type DraftErrors = Partial<Record<keyof BlogDraft, string>>;

/** The document one submission writes to the `blogs` collection. */
export interface BlogDocument {
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  tags: string[];
  content: string;
  /** The Storage download URL, or "" when no image was chosen. */
  imageUrl: string;
  /** Minutes, at `WORDS_PER_MINUTE`. */
  readingTime: number;
  authorName: string;
  authorEmail: string | null;
  authorUid: string;
  /** No page reads `blogs` yet (R13 is not built) — stored, not live. */
  published: false;
}

/**
 * Category names for the dropdown, from the same source the rest of the site
 * reads (R20.7). A category that exists on the site is therefore choosable
 * here without this page being edited.
 */
export function categoryOptions(): string[] {
  return getCategories().map((category) => category.name);
}

/** Comma- or space-separated tags become a trimmed, de-duplicated list. */
export function parseTags(value: string): string[] {
  const seen = new Set<string>();

  for (const raw of value.split(/[,\n]+/)) {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-");

    if (tag) seen.add(tag);
  }

  return [...seen];
}

/** Minutes to read `content`, rounded, and never less than one. */
export function readingTimeFrom(content: string): number {
  const words = content.trim().split(/\s+/).filter(Boolean).length;

  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** A URL-safe slug, with a fallback for a title of pure punctuation. */
export function slugFrom(title: string): string {
  return slugify(title) || "post";
}

/** The inline errors for a draft. An empty object means it may be submitted. */
export function validateDraft(draft: BlogDraft): DraftErrors {
  const errors: DraftErrors = {};

  if (!draft.title.trim()) errors.title = "Give the post a title.";
  if (!draft.category.trim()) errors.category = "Choose a category.";
  if (!draft.content.trim()) errors.content = "Add the post content.";

  return errors;
}

/** The shape a file exposes, so the check runs without a DOM `File`. */
export interface ImageCandidate {
  name: string;
  type: string;
  size: number;
}

/**
 * Why this file cannot be a featured image, or null when it can.
 *
 * The rules mirror what `storage.rules` will enforce anyway (AC33.11), so a
 * rejected file never spends an upload on a request the server would refuse.
 */
export function validateImage(file: ImageCandidate | null): string | null {
  if (!file) return null;

  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    return "Choose an image file — PNG, JPEG, WebP, GIF, AVIF or SVG.";
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return "That image is larger than 5 MB. Choose a smaller one.";
  }

  return null;
}

/**
 * The document the form writes. Deliberately free of Firebase types so it can
 * be asserted directly: the timestamp is added by `blogs.ts`, which owns the
 * server value.
 */
export function buildBlogDocument(
  draft: BlogDraft,
  author: BlogAuthor,
  imageUrl: string,
): BlogDocument {
  const title = draft.title.trim();

  return {
    title,
    slug: slugFrom(title),
    category: draft.category.trim(),
    excerpt: draft.excerpt.trim(),
    tags: parseTags(draft.tags),
    content: draft.content.trim(),
    imageUrl,
    readingTime: readingTimeFrom(draft.content),
    authorName: author.name,
    authorEmail: author.email,
    authorUid: author.uid,
    published: false,
  };
}
