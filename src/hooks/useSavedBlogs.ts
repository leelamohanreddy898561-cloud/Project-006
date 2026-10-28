import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { savedBlogToPost, type SavedBlogRecord } from "../lib/blog-posts";
import { SITE_WORKSPACE_ID, listSavedBlogs } from "../lib/blogs";
import type { Post } from "../types/post";

/**
 * R37 — the saved posts, for the visitor pages.
 *
 * The repository articles render immediately; this hook adds the Firestore
 * posts when they arrive. A failed read leaves `status` as `"error"` and the
 * pages keep their seed content, so a visitor never sees an empty archive
 * because the network or a rule is down (AC37.6).
 *
 * R38 — the admin management view needs the raw records (the document id is
 * what Edit and Delete act on) and a way to re-read after a write, so both are
 * exposed alongside the mapped posts. Visitor callers ignore them.
 */

export type SavedBlogsStatus = "loading" | "ready" | "error";

export interface SavedBlogsState {
  posts: Post[];
  /** The documents as Firestore returned them, in the same order. */
  records: SavedBlogRecord[];
  status: SavedBlogsStatus;
  /** Re-runs the read — used after the admin edits or deletes a post. */
  reload: () => void;
}

/**
 * How long the pages wait before they stop calling the read "in flight".
 *
 * The repository articles never wait. A read that has not answered in this
 * window is treated as failed — the archive says so and an unknown slug shows
 * its not-found state — but the request is not cancelled: if it lands later,
 * the saved posts still appear and the notice clears.
 */
const READ_TIMEOUT_MS = 4000;

export function useSavedBlogs(workspaceId?: string | null): SavedBlogsState {
  const [records, setRecords] = useState<SavedBlogRecord[]>([]);
  const [status, setStatus] = useState<SavedBlogsStatus>("loading");
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  // R45 — `undefined` is the global site (the default workspace); `null` is
  // "the workspace is not resolved yet". A tenant page always passes an id, so
  // its read can never fall back to the default site's posts.
  const target = workspaceId === undefined ? SITE_WORKSPACE_ID : workspaceId;

  // A different workspace is a different archive. Clearing the previous
  // records means a slow or failed tenant read can never leave another site's
  // posts on screen.
  const loadedTarget = useRef<string | null>(null);

  useEffect(() => {
    if (target === null) return undefined;

    let active = true;
    let settled = false;

    if (loadedTarget.current !== target) {
      loadedTarget.current = target;
      setRecords([]);
    }

    setStatus("loading");

    const timer = window.setTimeout(() => {
      if (active && !settled) setStatus("error");
    }, READ_TIMEOUT_MS);

    listSavedBlogs(target).then((outcome) => {
      if (!active) return;

      settled = true;
      window.clearTimeout(timer);

      if (outcome.ok) {
        setRecords(outcome.records);
        setStatus("ready");
        return;
      }

      // The visitor gets the short notice in the archive; the detail belongs in
      // the console, where it can be acted on.
      console.warn("Saved blog posts could not be loaded.", outcome.message);
      setStatus("error");
    });

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [reloadToken, target]);

  const posts = useMemo(() => records.map(savedBlogToPost), [records]);

  return { posts, records, status, reload };
}
