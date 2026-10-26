import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * R40 — a route change starts the reader at the top of the new page.
 *
 * A single-page app keeps the document's scroll position across a navigation,
 * so tapping a card halfway down `/blog` opened the article halfway down the
 * article: the reader landed under the header with the featured image cut off
 * at the bottom of the screen, and the opening of the post was never seen.
 *
 * `useLayoutEffect` rather than `useEffect`, so the reset happens before the
 * browser paints and the reader never sees the new page at the old offset.
 *
 * Only the pathname counts. A filter change on `/blog` (`?q=`, `?topic=`,
 * `?tag=`) is the same page, and jumping there would fight the reader typing
 * in the search box (R2).
 */
export function ScrollToTop() {
  const { pathname } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
