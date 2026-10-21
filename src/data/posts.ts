import type { Post } from "../types/post";

/**
 * Seed article data.
 *
 * PLACEHOLDER: the content model (R13) will load posts from markdown files
 * with frontmatter. This module mirrors the final `Post` shape so the UI
 * components will not need to change when the real source lands — only this
 * file gets replaced.
 *
 * Cover images are locally authored abstract SVGs (public/covers) rather than
 * external photos, so they always load, carry no licensing questions, and cost
 * a few kB each. Swap for real artwork or Firebase Storage later.
 */

const AUTHORS = {
  maya: { name: "Maya Iyer", initials: "MI", role: "ML engineer" },
  dev: { name: "Dev Sharma", initials: "DS", role: "Research writer" },
  ana: { name: "Ana Costa", initials: "AC", role: "Applied AI lead" },
} as const;

export const posts: Post[] = [
  {
    slug: "mixture-of-experts",
    title:
      "Mixture-of-Experts: Why the Biggest Models Aren't Using All Their Parameters",
    excerpt:
      "Routing lets models grow without a matching rise in compute per token. How it works, and what it costs.",
    date: "2026-10-18",
    category: "Research",
    tags: ["models", "architecture"],
    readingTime: 8,
    author: AUTHORS.maya,
    coverImage: "/covers/cover-1.svg",
    featured: true,
  },
  {
    slug: "ai-updates-october-2026",
    title: "AI Updates: October 2026 Roundup",
    excerpt:
      "The month's most consequential AI news — releases, benchmark shifts, and two policy decisions that shape 2027.",
    date: "2026-10-14",
    category: "News",
    tags: ["news", "models"],
    readingTime: 6,
    author: AUTHORS.dev,
    coverImage: "/covers/cover-2.svg",
    featured: true,
  },
  {
    slug: "prompting-small-language-models",
    title: "A Practical Guide to Prompting Small Language Models",
    excerpt:
      "Small local models are cheap and private, but they reward precision. Six techniques that consistently improve output.",
    date: "2026-10-09",
    category: "Guides",
    tags: ["prompting", "guides"],
    readingTime: 11,
    author: AUTHORS.ana,
    coverImage: "/covers/cover-3.svg",
    featured: false,
  },
  {
    slug: "evaluating-llm-output",
    title: "Evaluating LLM Output Without a PhD",
    excerpt:
      "A small, honest eval set beats any leaderboard. How to build one in an afternoon and actually trust it.",
    date: "2026-10-03",
    category: "Guides",
    tags: ["evaluation", "guides"],
    readingTime: 7,
    author: AUTHORS.maya,
    coverImage: "/covers/cover-4.svg",
    featured: false,
  },
  {
    slug: "multimodal-models-got-cheap",
    title: "Multimodal Models Finally Got Cheap",
    excerpt:
      "Vision and audio understanding are now bundled into general-purpose APIs at no premium. What that unlocks.",
    date: "2026-09-27",
    category: "News",
    tags: ["multimodal", "models"],
    readingTime: 4,
    author: AUTHORS.dev,
    coverImage: "/covers/cover-5.svg",
    featured: false,
  },
  {
    slug: "long-context-architectures",
    title: "Inside the New Long-Context Architectures",
    excerpt:
      "Million-token windows are shipping, but attention is not the whole story. Where the memory actually goes.",
    date: "2026-09-20",
    category: "Research",
    tags: ["architecture", "evaluation"],
    readingTime: 9,
    author: AUTHORS.ana,
    coverImage: "/covers/cover-6.svg",
    featured: false,
  },
];

/** Newest first. */
export function getLatestPosts(): Post[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

export interface TrendingTopic {
  name: string;
  slug: string;
  count: number;
}

/** Topics ranked by how many posts carry the tag. */
export function getTrendingTopics(limit = 5): TrendingTopic[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export type QuickFilter = "all" | "latest" | "quick" | "featured";

export const QUICK_FILTERS: Array<{ id: QuickFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "latest", label: "Latest" },
  { id: "quick", label: "Quick reads" },
  { id: "featured", label: "Featured" },
];

/** Applies the sidebar search + quick filter to the article list. */
export function selectPosts(
  source: Post[],
  query: string,
  filter: QuickFilter,
): Post[] {
  let result = source;

  if (filter === "latest") {
    const cutoff = "2026-10-01";
    result = result.filter((post) => post.date >= cutoff);
  } else if (filter === "quick") {
    result = result.filter((post) => post.readingTime <= 5);
  } else if (filter === "featured") {
    result = result.filter((post) => post.featured);
  }

  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length > 0) {
    result = result.filter((post) => {
      const haystack = [
        post.title,
        post.excerpt,
        post.category,
        post.tags.join(" "),
        post.author.name,
      ]
        .join(" ")
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }

  return result;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(`${iso}T00:00:00`));
}
