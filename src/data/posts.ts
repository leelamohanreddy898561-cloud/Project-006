import type { Post } from "../types/post";
import { postBodies } from "./postBodies";

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

const basePosts: Omit<Post, "body">[] = [
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

/** Seed articles, each joined to its Markdown body (R23). */
export const posts: Post[] = basePosts.map((post) => ({
  ...post,
  body: postBodies[post.slug] ?? "",
}));

/** Newest first. */
export function getLatestPosts(): Post[] {
  return [...posts].sort((a, b) => b.date.localeCompare(a.date));
}

/** Single article by slug, or undefined when the slug is unknown. */
export function getPostBySlug(slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

/**
 * Up to `limit` other articles: same category first, then shared tags, then
 * newest. Never includes the current article (R23.18).
 */
export function getRelatedPosts(slug: string, limit = 3): Post[] {
  const current = getPostBySlug(slug);
  if (!current) return [];

  return posts
    .filter((post) => post.slug !== slug)
    .map((post) => ({
      post,
      score:
        (post.category === current.category ? 2 : 0) +
        post.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .sort(
      (a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date),
    )
    .slice(0, limit)
    .map((entry) => entry.post);
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

export interface Category {
  name: string;
  slug: string;
  count: number;
}

/** Every tag in use, alphabetical — the source for the /blog tag filter (R2). */
export function getTags(): string[] {
  return [...new Set(posts.flatMap((post) => post.tags))].sort((a, b) =>
    a.localeCompare(b),
  );
}

export interface PostFilters {
  /** Free-text search over title, excerpt, category and tags (R2.2). */
  query: string;
  /** Topic slug, or "" for every topic (R2.3). */
  topic: string;
  /** Exact tag, or "" for every tag (R2.4). */
  tag: string;
}

/**
 * R2 — the /blog filter pipeline. Search is case-insensitive and every term
 * must match; topic and tag narrow the set further, so all three combine.
 */
export function filterPosts(source: Post[], filters: PostFilters): Post[] {
  const terms = filters.query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  return source.filter((post) => {
    if (filters.topic && slugify(post.category) !== filters.topic) {
      return false;
    }

    if (
      filters.tag &&
      !post.tags.some(
        (tag) => tag.toLowerCase() === filters.tag.toLowerCase(),
      )
    ) {
      return false;
    }

    if (terms.length === 0) return true;

    const haystack = [
      post.title,
      post.excerpt,
      post.category,
      post.tags.join(" "),
    ]
      .join(" ")
      .toLowerCase();

    return terms.every((term) => haystack.includes(term));
  });
}

/** Post categories, most-used first — the single source for topic links. */
export function getCategories(): Category[] {
  const counts = new Map<string, number>();
  for (const post of posts) {
    counts.set(post.category, (counts.get(post.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, slug: slugify(name), count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
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
