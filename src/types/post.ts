export interface Author {
  name: string;
  /** Two-letter monogram used by the avatar. */
  initials: string;
  role: string;
}

export interface Post {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
  category: string;
  tags: string[];
  /** Estimated reading time in minutes. */
  readingTime: number;
  author: Author;
  /** Cover image path, e.g. /covers/cover-1.svg */
  coverImage: string;
  featured: boolean;
  /** Article body in Markdown, rendered by the detail page (R23). */
  body: string;
}
