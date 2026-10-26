import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  DEFAULT_COVER,
  isoDate,
  mergePosts,
  savedBlogToPost,
  type SavedBlogRecord,
} from "../src/lib/blog-posts";
import { getLatestPosts } from "../src/data/posts";
import { renderMarkdown } from "../src/lib/markdown";
import { blockFirestore } from "./helpers/firestore";

/**
 * R37 — saved posts are visible to visitors. Maps to TC-3701 … TC-3703;
 * TC-3704 is the owner's manual walkthrough against the project's own data.
 *
 * The browser cases run on a dev-only fixture injected before the app loads
 * (`window.__savedBlogsFixture`), and the network is blocked: the suite proves
 * the visitor path without letting live content change a count. The document is
 * shaped exactly like the one the R33 composer writes, including fields the
 * reader must ignore (`authorEmail`, `published`).
 */

const RECORD: SavedBlogRecord = {
  id: "seo-guide",
  title: "  A Practical Guide to SEO for AI Blogs  ",
  slug: "seo-for-ai-blogs",
  category: "Guides",
  excerpt: "",
  tags: ["SEO", "guides", "seo"],
  content:
    "## Why search still matters\n\nSearch is the front door to a blog. **Structure** beats luck.\n\n- one clear title\n- one honest excerpt\n\n> Write for a reader first.\n\n<script>window.__pwned = true</script>",
  imageUrl: "",
  readingTime: 0,
  authorName: "Maya Iyer",
  authorEmail: "maya@example.com",
  createdAt: "2026-10-25T10:00:00.000Z",
  published: false,
};

const FIXTURE: SavedBlogRecord[] = [RECORD];

function read(relative: string): string {
  return readFileSync(path.resolve(relative), "utf8");
}

test.beforeEach(async ({ page }) => {
  await blockFirestore(page);
});

test.describe("R37 — the visitor surfaces show a saved post", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((records) => {
      (globalThis as unknown as { __savedBlogsFixture?: unknown })
        .__savedBlogsFixture = records;
    }, FIXTURE);
  });

  test("TC-3702: home, archive, filters and the article page", async ({
    page,
  }) => {
    // The home grid is the latest list, saved post included.
    await page.goto("/");

    const cards = page.locator(".blog-card");
    await expect(cards).toHaveCount(7);
    await expect(cards.first().locator(".blog-card__title")).toContainText(
      "A Practical Guide to SEO",
    );
    await expect(
      cards.first().locator(".blog-card__media img"),
    ).toHaveAttribute("src", DEFAULT_COVER);

    // The archive shows it too, newest first, and the count includes it.
    await page.goto("/blog");
    await expect(page.locator(".blog-card")).toHaveCount(7);
    await expect(page.locator(".blog-card").first().locator(".blog-card__title"))
      .toContainText("A Practical Guide to SEO");
    await expect(page.locator(".blog-list__count")).toHaveText("7 posts");

    // Search and tag filters see it (R2's filters were not saved-post blind).
    await page.goto("/blog?q=seo");
    await expect(page.locator(".blog-card")).toHaveCount(1);
    await expect(page.locator(".blog-list__count")).toHaveText("1 post");

    await page.goto("/blog?tag=seo");
    await expect(page.locator(".blog-card")).toHaveCount(1);

    // The saved post's own page: markdown, default cover, no email, no script.
    await page.goto("/blog/seo-for-ai-blogs");
    await expect(page.locator(".post-page__title")).toHaveText(
      "A Practical Guide to SEO for AI Blogs",
    );
    await expect(page.locator(".prose h2")).toHaveText("Why search still matters");
    await expect(page.locator(".prose ul li")).toHaveCount(2);
    await expect(page.locator(".prose blockquote")).toHaveCount(1);
    await expect(page.locator(".post-page__cover")).toHaveAttribute(
      "src",
      DEFAULT_COVER,
    );
    await expect(page.locator("body")).not.toContainText("maya@example.com");

    expect(
      await page.evaluate(
        () => (globalThis as unknown as { __pwned?: boolean }).__pwned,
      ),
    ).toBeUndefined();

    // An unknown slug is still "not found" once the read has settled.
    await page.goto("/blog/no-such-post");
    await expect(page.locator(".post-missing__title")).toHaveText(
      "Article not found",
    );
  });
});

test.describe("R37 — the reader, the rules and the failure path", () => {
  test("TC-3701: document mapping, merging and sanitised Markdown", () => {
    const post = savedBlogToPost(RECORD);

    expect(post.title).toBe("A Practical Guide to SEO for AI Blogs");
    expect(post.slug).toBe("seo-for-ai-blogs");
    expect(post.category).toBe("Guides");
    expect(post.tags).toEqual(["seo", "guides"]);
    expect(post.excerpt, "empty excerpt falls back to the content").toMatch(
      /^Why search still matters/,
    );
    expect(post.readingTime).toBeGreaterThanOrEqual(1);
    expect(post.author.name).toBe("Maya Iyer");
    expect(post.author.initials).toBe("MI");
    expect(post.coverImage).toBe(DEFAULT_COVER);
    expect(post.date).toBe("2026-10-25");
    expect(post.body).toContain("## Why search still matters");
    expect(JSON.stringify(post)).not.toContain("maya@example.com");
    expect(post).not.toHaveProperty("authorEmail");

    // A saved image is kept; an unsafe one falls back to the default cover.
    expect(
      savedBlogToPost({
        ...RECORD,
        imageUrl: "https://example.test/cover.jpg",
      }).coverImage,
    ).toBe("https://example.test/cover.jpg");
    expect(
      savedBlogToPost({ ...RECORD, imageUrl: "javascript:alert(1)" }).coverImage,
    ).toBe(DEFAULT_COVER);

    // Every timestamp shape a document can carry.
    expect(isoDate("2026-08-02T12:00:00Z")).toBe("2026-08-02");
    expect(isoDate(new Date("2026-08-03T12:00:00Z"))).toBe("2026-08-03");
    expect(
      isoDate({ toDate: () => new Date("2026-08-04T12:00:00Z") }),
    ).toBe("2026-08-04");
    expect(isoDate({ seconds: Date.parse("2026-08-05T12:00:00Z") / 1000 })).toBe(
      "2026-08-05",
    );
    expect(isoDate(null)).toBe("");

    // The archive: saved joins seed, newest first, and a slug collision is one
    // card showing the saved post rather than two.
    const seed = getLatestPosts();
    const merged = mergePosts(seed, [post]);
    expect(merged).toHaveLength(seed.length + 1);
    expect(merged[0].slug).toBe("seo-for-ai-blogs");

    const collision = mergePosts(seed, [
      { ...post, slug: seed[0].slug, title: "Saved wins" },
    ]);
    expect(collision).toHaveLength(seed.length);
    expect(collision.find((item) => item.slug === seed[0].slug)?.title).toBe(
      "Saved wins",
    );

    // An undated saved post still appears, at the end.
    const undated = savedBlogToPost({
      ...RECORD,
      id: "undated",
      slug: "undated",
      createdAt: null,
    });
    expect(undated.date).toBe("");
    expect(mergePosts(seed, [undated]).at(-1)?.slug).toBe("undated");

    // R37.8 — remote Markdown cannot inject HTML or a script URL.
    const html = renderMarkdown(
      [
        "## Heading",
        "",
        "A paragraph with **bold** and a [safe link](https://example.com/docs).",
        "",
        "- one",
        "- two",
        "",
        "> a quote",
        "",
        "<script>window.__pwned = true</script>",
        "",
        "<img src=x onerror=alert(1)>",
        "",
        "[bad](javascript:alert(1))",
        "",
        "[entity](&#106;avascript:alert(1))",
        "",
        "![bad](javascript:alert(1))",
        "",
        "![safe](/covers/cover-1.svg)",
      ].join("\n"),
    );

    expect(html).toContain("<h2");
    expect(html).toContain("<ul>");
    expect(html).toContain("<blockquote>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain('href="https://example.com/docs"');
    expect(html).toContain('src="/covers/cover-1.svg"');
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script");
    // The raw HTML is escaped text, so the word may appear; no real tag does.
    expect(html).not.toMatch(/<img[^>]*onerror/i);
    expect(html).not.toMatch(/<img[^>]*src="x"/i);
    expect(html).not.toMatch(/href="javascript:/i);
    expect(html).not.toMatch(/src="javascript:/i);
  });

  test("TC-3703: the archive survives a failed read, and the rule is public-read/admin-write", async ({
    page,
  }) => {
    // No fixture: the blocked host makes the read fail.
    await page.goto("/blog");

    await expect(page.locator(".blog-card")).toHaveCount(6);
    await expect(page.locator(".blog-list__notice")).toContainText(
      /saved posts could not be loaded/i,
      { timeout: 10_000 },
    );

    const rules = read("firestore.rules");
    const seam = read("src/lib/blogs.ts");

    expect(rules, "a visitor may read blogs").toMatch(
      /match \/blogs\/\{blogId\} \{[\s\S]*?allow read: if true;/,
    );
    expect(rules, "only an admin may write blogs").toMatch(
      /match \/blogs\/\{blogId\} \{[\s\S]*?allow write: if isAdmin\(\);/,
    );
    expect(rules, "the admin check still reads the user's profile").toMatch(
      /documents\/users\/\$\(request\.auth\.uid\)\)\.data\.role == 'admin'/,
    );

    expect(seam, "the read lives in the one Firebase seam").toContain(
      "listSavedBlogs",
    );
    expect(seam).toContain("getDocsFromServer");
    expect(seam).toContain("BLOGS_COLLECTION");

    for (const surface of ["BlogList", "Home", "PostDetail"]) {
      const source = read(`src/pages/${surface}.tsx`);
      expect(source, `${surface} must merge saved posts`).toContain(
        "useSavedBlogs",
      );
      expect(source).toContain("mergePosts");
    }

    const hook = read("src/hooks/useSavedBlogs.ts");
    expect(hook).toContain("listSavedBlogs");
    expect(hook).toContain("savedBlogToPost");

    // The composer no longer promises a non-existent draft state (R37).
    const composer = read("src/pages/AddBlog.tsx");
    expect(composer).toContain("Live on save");
    expect(composer).not.toContain("Stored, not published");
  });
});
