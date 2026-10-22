import { marked } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/**
 * R23.5 — render article Markdown to HTML.
 *
 * The source is authored in this repository (`src/data/postBodies.ts`), so it is
 * trusted and no HTML sanitiser is applied. If posts ever come from user input,
 * this function must sanitise before returning.
 */
export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}
