import { marked, Renderer } from "marked";

marked.setOptions({ gfm: true, breaks: false });

/**
 * R23.5 / R37.8 — render article Markdown to HTML.
 *
 * The repository articles are authored here, but R37 also renders Markdown
 * stored in Firestore, which is remote input. `marked` does not sanitise, so the
 * renderer below is the boundary:
 *
 *   - raw HTML is escaped, never passed through;
 *   - a link or image URL is refused unless it is relative or uses
 *     `http:`, `https:` or `mailto:`, after entities and control characters are
 *     normalised (the `&#106;avascript:` and `java\tscript:` tricks);
 *   - all attribute values are escaped.
 *
 * The output still carries headings, paragraphs, lists, blockquotes, tables,
 * code and emphasis, because those are produced by marked's own renderers.
 */

const SAFE_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Numeric and the protocol-relevant named entities, decoded before checking. */
function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, decimal: string) =>
      String.fromCodePoint(Number(decimal)),
    )
    .replace(/&colon;/gi, ":")
    .replace(/&tab;/gi, "\t")
    .replace(/&newline;/gi, "\n")
    .replace(/&amp;/gi, "&");
}

function stripControlCharacters(value: string): string {
  return [...value]
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0;
      return code > 0x1f && code !== 0x7f;
    })
    .join("");
}

function safeUrl(value: string): string | null {
  const normalised = stripControlCharacters(decodeEntities(value)).trim();

  if (!normalised) return null;

  const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(normalised);

  if (!scheme) return normalised;

  return SAFE_PROTOCOLS.has(`${scheme[1].toLowerCase()}:`)
    ? normalised
    : null;
}

const renderer = new Renderer();

renderer.html = ({ text }) => escapeHtml(text);

renderer.link = ({ href, title, tokens }) => {
  const label = renderer.parser.parseInline(tokens);
  const url = safeUrl(href);
  const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";

  return url
    ? `<a href="${escapeHtml(url)}"${titleAttribute}>${label}</a>`
    : `<span>${label}</span>`;
};

renderer.image = ({ href, title, text }) => {
  const url = safeUrl(href);
  const alt = escapeHtml(text ?? "");

  if (!url) return alt;

  const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";

  return `<img src="${escapeHtml(url)}" alt="${alt}"${titleAttribute}>`;
};

export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false, renderer }) as string;
}
