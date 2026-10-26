import type { Post } from "../types/post";
import {
  FALLBACK_CATEGORY,
  savedBlogToPost,
  type SavedBlogRecord,
} from "./blog-posts";
import type { BlogDraft } from "./blog-draft";

/**
 * R38 — the admin management view's model.
 *
 * The panel lists two kinds of post in one place: the repository articles the
 * site has always rendered, and the documents in the Firestore `blogs`
 * collection the composer writes. Only the second kind can be edited or deleted
 * from the browser, so the list keeps the record that identifies it; a
 * repository article is carried with `record: null`.
 *
 * Everything here is a plain function with no React and no Firebase, so the
 * suite can execute the merge, the pre-filled draft and the Storage-path rule
 * directly — the page itself sits behind the R31 guard, which the suite cannot
 * open without a console-promoted account (the same reason R32 and R33's admin
 * cases are static).
 */

export type BlogSource = "Firestore" | "Repository";

export interface ManagedBlog {
  /** The post as the visitor pages render it. */
  post: Post;
  /** The `blogs` document, or null for a repository article. */
  record: SavedBlogRecord | null;
  source: BlogSource;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * R38.1 — one list, newest first, a saved post winning a slug collision.
 *
 * This mirrors `mergePosts` on the visitor side (R37.3) on purpose: the admin
 * must see the same archive a visitor does, with the same post standing in for
 * a duplicated slug. Undated posts sort last, then by title.
 */
export function managedBlogs(
  seed: Post[],
  records: SavedBlogRecord[],
): ManagedBlog[] {
  const bySlug = new Map<string, ManagedBlog>();

  for (const post of seed) {
    bySlug.set(post.slug, { post, record: null, source: "Repository" });
  }

  for (const record of records) {
    const post = savedBlogToPost(record);

    bySlug.set(post.slug, { post, record, source: "Firestore" });
  }

  return [...bySlug.values()].sort(
    (a, b) =>
      b.post.date.localeCompare(a.post.date) ||
      a.post.title.localeCompare(b.post.title),
  );
}

/**
 * The editor's starting values, taken from the document.
 *
 * A field the document does not have is left empty rather than invented: the
 * admin sees what is stored, and the validation decides whether it can be
 * saved. The category falls back to the shared label only so the required
 * select is not blank on a hand-edited document.
 */
export function draftFromRecord(record: SavedBlogRecord): BlogDraft {
  const tags = Array.isArray(record.tags)
    ? record.tags.map(text).filter(Boolean)
    : [];

  return {
    title: text(record.title),
    category: text(record.category) || FALLBACK_CATEGORY,
    excerpt: text(record.excerpt),
    tags: tags.join(", "),
    content: text(record.content),
  };
}

/**
 * R38.6 — the Storage object a cover URL points at, or "" when it is not one
 * of ours.
 *
 * The upload function returns
 * `https://storage.googleapis.com/<bucket>/blog-images/<uid>/<file>`; the
 * browser Storage SDK's own download URL has the object under `/o/`. Both are
 * decoded, because an uploaded file name may contain an escaped character, and
 * only a path inside `blog-images/` is returned — so a cover that points at a
 * seed asset, or at anything else, is never sent to the delete function.
 */
export function imagePathFromUrl(value: unknown): string {
  const url = text(value);

  if (!url) return "";

  let raw = "";

  const gcs = /^https?:\/\/storage\.googleapis\.com\/[^/]+\/([^?#]+)/i.exec(url);
  const sdk =
    /^https?:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/([^?#]+)/i.exec(
      url,
    );

  if (gcs) raw = gcs[1];
  else if (sdk) raw = sdk[1];

  if (!raw) return "";

  let decoded = raw;

  try {
    decoded = decodeURIComponent(raw);
  } catch {
    // A malformed escape is not a path we should hand to the function.
    return "";
  }

  return /^blog-images\/[^/]+\/[^/]+/.test(decoded) ? decoded : "";
}

/**
 * The path to delete for this document.
 *
 * R38 documents carry `imagePath`, which is authoritative. A document written
 * before R38 — or one a human edited — derives it from `imageUrl` instead. An
 * underivable path is "" and the edit still succeeds: an orphaned cover is a
 * cost, not a reason to refuse the change.
 */
export function storedImagePath(record: SavedBlogRecord): string {
  const stored = text(record.imagePath);

  if (/^blog-images\/[^/]+\/[^/]+/.test(stored)) return stored;

  return imagePathFromUrl(record.imageUrl);
}

/** The cover shown in the editor before anything is changed. */
export function currentImage(record: SavedBlogRecord): {
  url: string;
  path: string;
} {
  return {
    url: text(record.imageUrl),
    path: storedImagePath(record),
  };
}
