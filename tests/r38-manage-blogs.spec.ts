import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  currentImage,
  draftFromRecord,
  imagePathFromUrl,
  managedBlogs,
  storedImagePath,
} from "../src/lib/blog-admin";
import {
  buildBlogDocument,
  type BlogAuthor,
  type BlogDraft,
} from "../src/lib/blog-draft";
import { DEFAULT_COVER, FALLBACK_CATEGORY, type SavedBlogRecord } from "../src/lib/blog-posts";
import { getLatestPosts } from "../src/data/posts";

/**
 * R38 — the admin manages blogs. Maps to TC-3801 … TC-3803; TC-3804 is the
 * owner's live walkthrough against the project's own admin account.
 *
 * The management view sits behind the R31 guard, so — like the R32 and R33
 * admin cases — the rendered page cannot be opened without a console-promoted
 * account. The suite proves the guard in a browser, executes the merge and
 * pre-filled draft directly, and reads the wiring back: the panel's controls,
 * the seam's writes, and the rules that keep them admin-only.
 */

const AUTHOR: BlogAuthor = { uid: "uid-admin-1", name: "Maya Iyer" };

const DRAFT: BlogDraft = {
  title: "A Saved Post",
  category: "Guides",
  excerpt: "One line.",
  tags: "seo, guides",
  content: "Some **markdown** content.",
};

const IMAGE_URL =
  "https://storage.googleapis.com/project-006.appspot.com/blog-images/uid-1/cover.jpg";

const RECORD: SavedBlogRecord = {
  id: "doc-saved",
  title: "A Saved Post",
  slug: "a-saved-post",
  category: "Guides",
  excerpt: "One line.",
  tags: ["SEO", "Guides"],
  content: "Some **markdown** content.",
  imageUrl: IMAGE_URL,
  imagePath: "blog-images/uid-1/cover.jpg",
  readingTime: 1,
  authorName: "Maya Iyer",
  authorUid: "uid-1",
  createdAt: "2026-12-31T10:00:00.000Z",
};

const NO_IMAGE: SavedBlogRecord = {
  id: "doc-no-image",
  title: "A Post Without a Cover",
  slug: "a-post-without-a-cover",
  category: "Research",
  tags: [],
  content: "Body only.",
  imageUrl: "",
  createdAt: null,
};

function read(relative: string): string {
  return readFileSync(path.resolve(relative), "utf8");
}

test.describe("R38 — the management view is behind the R31 guard", () => {
  test("TC-3801: a signed-out visitor cannot manage anything", async ({
    page,
  }) => {
    await page.goto("/admin/dashboard/blogs");

    await expect(page).toHaveURL(/\/signin$/);
    await expect(
      page.getByRole("heading", { level: 1 }),
      "no management heading may render signed out",
    ).not.toHaveText(/Manage blogs/i);
    await expect(page.getByRole("button", { name: "Edit" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
    await expect(page.locator("form.admin-form")).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Save changes/ })).toHaveCount(
      0,
    );
  });
});

test.describe("R38 — the list, the draft and the image path", () => {
  test("TC-3802: saved posts join the repository list and pre-fill the editor", () => {
    const seed = getLatestPosts();
    const items = managedBlogs(seed, [RECORD, NO_IMAGE]);

    // One list: both sources, once each.
    expect(items).toHaveLength(seed.length + 2);

    const saved = items[0];
    expect(saved.source).toBe("Firestore");
    expect(saved.post.slug).toBe("a-saved-post");
    expect(saved.record?.id).toBe("doc-saved");
    expect(saved.post.title).toBe("A Saved Post");
    expect(saved.post.coverImage).toBe(RECORD.imageUrl);

    // A missing image falls back to the site's default cover, never a broken
    // `src`; an undated post sorts last.
    const last = items.at(-1);
    expect(last?.post.slug).toBe("a-post-without-a-cover");
    expect(last?.post.coverImage).toBe(DEFAULT_COVER);

    const repository = items.find((item) => item.source === "Repository");
    expect(repository).toBeDefined();
    expect(repository?.record).toBeNull();

    // A slug collision keeps the saved post, exactly as the visitor merge does.
    const collision = managedBlogs(seed, [
      { ...RECORD, slug: seed[0].slug, title: "Saved wins" },
    ]);
    expect(collision).toHaveLength(seed.length);
    expect(
      collision.find((item) => item.post.slug === seed[0].slug)?.source,
    ).toBe("Firestore");

    // The editor starts from the document, not from invented values.
    const draft = draftFromRecord(RECORD);
    expect(draft).toEqual({
      title: "A Saved Post",
      category: "Guides",
      excerpt: "One line.",
      tags: "SEO, Guides",
      content: "Some **markdown** content.",
    });

    const blank = draftFromRecord({ id: "doc-empty" });
    expect(blank.title).toBe("");
    expect(blank.category).toBe(FALLBACK_CATEGORY);

    // R38.5 — the Storage object behind a cover, and nothing else.
    expect(imagePathFromUrl(RECORD.imageUrl)).toBe(
      "blog-images/uid-1/cover.jpg",
    );
    expect(
      imagePathFromUrl(
        "https://storage.googleapis.com/bucket/blog-images/uid-1/my%20cover.png",
      ),
    ).toBe("blog-images/uid-1/my cover.png");
    expect(
      imagePathFromUrl(
        "https://firebasestorage.googleapis.com/v0/b/bucket/o/blog-images%2Fuid-1%2Fcover.jpg?alt=media&token=abc",
      ),
    ).toBe("blog-images/uid-1/cover.jpg");
    expect(imagePathFromUrl(DEFAULT_COVER)).toBe("");
    expect(imagePathFromUrl("https://example.test/cover.jpg")).toBe("");
    expect(imagePathFromUrl("")).toBe("");

    // A stored path wins; a legacy document derives it from its URL.
    expect(storedImagePath(RECORD)).toBe("blog-images/uid-1/cover.jpg");
    expect(
      storedImagePath({
        id: "legacy",
        imageUrl:
          "https://storage.googleapis.com/bucket/blog-images/uid-2/old.jpg",
      }),
    ).toBe("blog-images/uid-2/old.jpg");
    expect(storedImagePath(NO_IMAGE)).toBe("");

    expect(currentImage(RECORD)).toEqual({
      url: RECORD.imageUrl,
      path: "blog-images/uid-1/cover.jpg",
    });

    // R38.6 — the document an edit writes carries the path the delete needs.
    const document = buildBlogDocument(
      DRAFT,
      AUTHOR,
      IMAGE_URL,
      "blog-images/uid-1/cover.jpg",
    );
    expect(document.imagePath).toBe("blog-images/uid-1/cover.jpg");
    expect(
      buildBlogDocument(DRAFT, AUTHOR, "", "blog-images/uid-1/cover.jpg")
        .imagePath,
      "an image path without an image is not stored",
    ).toBe("");
  });
});

test.describe("R38 — the panel, the seam and the rules agree", () => {
  test("TC-3803: controls, writes and access", () => {
    const app = read("src/App.tsx");
    const shell = read("src/pages/AdminDashboard.tsx");
    const panel = read("src/components/admin/ManageBlogs.tsx");
    const seam = read("src/lib/blogs.ts");
    const rules = read("firestore.rules");
    const functions = read("functions/index.js");

    // The route is a guarded dashboard child, and the sidebar stays the three
    // items R32.1 fixed — this is the All Blogs section, not a fourth item.
    const guarded = app.slice(
      app.indexOf('path="/admin/dashboard"'),
      app.indexOf('path="/privacy"'),
    );
    expect(guarded).toContain('path="/admin/dashboard"');
    expect(guarded).toContain("<RequireAdmin>");
    expect(guarded).toContain('<Route path="blogs" element={<ManageBlogs />} />');

    const labels = [...shell.matchAll(/label: "([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(labels).toEqual(["All Blogs", "Add New Blog", "Manage Users"]);

    // The controls the requirement asks for.
    expect(panel).toMatch(/>\s*Edit\s*</);
    expect(panel).toMatch(/>\s*Delete\s*</);
    expect(panel).toContain('type="file"');
    expect(panel).toContain('accept="image/*"');
    expect(panel).toMatch(/Replace image/);
    expect(panel).toMatch(/Add image/);
    expect(panel).toContain("Remove image");
    expect(panel).toContain("Keep current image");
    expect(panel).toContain("Save changes");
    expect(panel).toContain("Delete permanently");
    expect(panel).toContain('role="status"');
    expect(panel).toContain('aria-live="polite"');

    // Repository articles are View-only; only a Firestore record has actions.
    expect(panel).toContain('item.source === "Repository"');
    expect(panel).toContain("{item.record && (");
    expect(panel).toContain("draftFromRecord");

    // The panel never reaches Firebase itself.
    expect(panel).not.toMatch(/from "firebase\//);
    expect(panel).toContain("updateBlogPost");
    expect(panel).toContain("deleteBlogPost");

    // The seam writes to the same document the composer created — now inside
    // the workspace (R42), and R45 makes the workspace an argument so the
    // tenant panel can never write the default site by accident.
    expect(seam).toContain("export async function updateBlogPost");
    expect(seam).toContain(
      "updateDoc(doc(db, workspaceBlogsPath(workspaceId), record.id)",
    );
    expect(seam).toContain("serverTimestamp()");
    expect(seam).toContain("export async function deleteBlogPost");
    expect(seam).toContain(
      "deleteDoc(doc(db, workspaceBlogsPath(workspaceId), record.id))",
    );
    expect(seam).toContain("uploadBlogImage(change.file, workspaceId)");
    expect(seam).toContain("storedImagePath(record)");
    expect(seam).toContain("removeBlogImage(oldPath, workspaceId)");
    expect(seam).toContain("removeBlogImage(imagePath, workspaceId)");

    // The panel passes the workspace to both writes.
    expect(panel).toContain("updateBlogPost(\n      workspaceId,");
    expect(panel).toContain("deleteBlogPost(workspaceId, record)");

    // Access is unchanged: public read, admin-only write.
    expect(rules, "only an admin may write blogs").toMatch(
      /match \/blogs\/\{blogId\} \{[\s\S]*?allow write: if isAdmin\(\);/,
    );
    expect(rules, "the admin check reads the user's own profile").toMatch(
      /documents\/users\/\$\(request\.auth\.uid\)\)\.data\.role == 'admin'/,
    );

    // Cover deletion stays behind the admin-gated function. R41 added a
    // workspace path, so the gate is asserted rather than its old wording: the
    // legacy folder still needs the global admin role, the workspace folder
    // needs edit rights there, and either way it must be the caller's own.
    expect(functions).toContain("exports.deleteBlogImage");
    expect(functions).toContain("isGlobalAdmin(uid)");
    expect(functions).toContain("workspaceRole(uid, workspacePath[1])");
    expect(functions).toContain("blog-images/${uid}");
    expect(functions).toContain("const coverPath =");
  });
});
