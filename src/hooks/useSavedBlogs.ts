import { useEffect, useMemo, useState } from "react";
import { savedBlogToPost, type SavedBlogRecord } from "../lib/blog-posts";
import { listSavedBlogs } from "../lib/blogs";
import type { Post } from "../types/post";

/**
 * R37 — the saved posts, for the visitor pages.
 *
 * The repository articles render immediately; this hook adds the Firestore
 * posts when they arrive. A failed read leaves `status` as `"error"` and the
 * pages keep their seed content, so a visitor never sees an empty archive
 * because the network or a rule is down (AC37.6).
 */

export type SavedBlogsStatus = "loading" | "ready" | "error";

export interface SavedBlogsState {
  posts: Post[];
  status: SavedBlogsStatus;
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

export function useSavedBlogs(): SavedBlogsState {
  const [records, setRecords] = useState<SavedBlogRecord[]>([]);
  const [status, setStatus] = useState<SavedBlogsStatus>("loading");

  useEffect(() => {
    let active = true;
    let settled = false;

    const timer = window.setTimeout(() => {
      if (active && !settled) setStatus("error");
    }, READ_TIMEOUT_MS);

    listSavedBlogs().then((outcome) => {
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
  }, []);

  const posts = useMemo(() => records.map(savedBlogToPost), [records]);

  return { posts, status };
}
