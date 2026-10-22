import { useState } from "react";
import { BookmarkIcon, HeartIcon, ShareIcon } from "./icons";
import "./ShareRail.css";

type ShareRailProps = {
  title: string;
  url: string;
};

/** Illustrative starting count — there is no server behind the like yet. */
const BASE_LIKES = 128;

/**
 * R23.8–R23.13 — the floating action rail beside the article.
 *
 * Sticky on desktop (follows the reader down the body) and a sticky horizontal
 * bar on narrow screens. Like and bookmark are local UI state; persisting them
 * needs accounts, which do not exist yet.
 */
export function ShareRail({ title, url }: ShareRailProps) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [status, setStatus] = useState("");

  async function handleShare() {
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, url });
        setStatus("Shared.");
        return;
      }
      await navigator.clipboard.writeText(url);
      setStatus("Link copied to your clipboard.");
    } catch {
      // Clipboard blocked (permissions, insecure context) — show it instead.
      setStatus(`Copy this link: ${url}`);
    }
  }

  return (
    <aside className="share-rail" aria-label="Article actions">
      <button
        type="button"
        className={liked ? "share-rail__btn is-active" : "share-rail__btn"}
        aria-pressed={liked}
        aria-label={liked ? "Remove your like" : "Like this article"}
        onClick={() => setLiked((value) => !value)}
      >
        <HeartIcon filled={liked} size={18} />
        <span className="share-rail__count">
          {BASE_LIKES + (liked ? 1 : 0)}
        </span>
      </button>

      <button
        type="button"
        className="share-rail__btn"
        aria-label="Share this article"
        onClick={handleShare}
      >
        <ShareIcon size={18} />
      </button>

      <button
        type="button"
        className={
          bookmarked ? "share-rail__btn is-active" : "share-rail__btn"
        }
        aria-pressed={bookmarked}
        aria-label={bookmarked ? "Remove bookmark" : "Bookmark this article"}
        onClick={() => setBookmarked((value) => !value)}
      >
        <BookmarkIcon filled={bookmarked} size={18} />
      </button>

      <p
        className="share-rail__status"
        role="status"
        aria-live="polite"
        data-visible={status ? "true" : "false"}
      >
        {status}
      </p>
    </aside>
  );
}
