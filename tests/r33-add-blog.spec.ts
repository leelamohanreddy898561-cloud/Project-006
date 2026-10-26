import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
  buildBlogDocument,
  categoryOptions,
  parseTags,
  readingTimeFrom,
  slugFrom,
  validateDraft,
  validateImage,
  type BlogAuthor,
  type BlogDraft,
} from "../src/lib/blog-draft";

/**
 * R33 — the composer at /admin/add-blog. Maps to TC-3301 … TC-3304.
 *
 * The composer only renders for an account promoted in the Firebase console,
 * for the reason TC-3103 and TC-3203 stay manual. What that leaves is proved
 * here three ways:
 *
 *   TC-3301  the route is really guarded, in a browser, signed out;
 *   TC-3302  the wiring — route, labelled fields, seam and rules — read back;
 *   TC-3303  the draft module executed directly, so the validation and the
 *            document shape are proven rather than described.
 */

const AUTHOR: BlogAuthor = {
  uid: "uid-admin-1",
  name: "Maya Iyer",
  email: "maya@example.com",
};

const DRAFT: BlogDraft = {
  title: "  Mixture-of-Experts, Explained  ",
  category: "Research",
  excerpt: "  Routing lets models grow.  ",
  tags: " Models , architecture , models ",
  content: "One two three four five six seven eight nine ten.",
};

function read(relative: string): string {
  return readFileSync(path.resolve(relative), "utf8");
}

test.describe("R33 — the composer is behind the R31 guard", () => {
  test("TC-3301: a signed-out visitor is sent to sign in", async ({ page }) => {
    await page.goto("/admin/add-blog");

    await expect(page).toHaveURL(/\/signin$/);

    // No composer, no form control, no submit button.
    await expect(
      page.getByRole("heading", { level: 1 }),
      "no composer heading may render signed out",
    ).not.toHaveText(/Add new blog/i);
    await expect(page.locator("form.admin-form")).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Save post|Saving/ }),
    ).toHaveCount(0);
  });
});

test.describe("R33 — the composer is wired to the right places", () => {
  test("TC-3302: route, fields, seam and rules agree", () => {
    const app = read("src/App.tsx");
    const composer = read("src/pages/AddBlog.tsx");
    const seam = read("src/lib/blogs.ts");

    // The route exists and the guard wraps it, exactly as /admin does.
    const guarded = app.slice(
      app.indexOf('path="/admin/add-blog"'),
      app.indexOf('path="/admin/dashboard"'),
    );

    expect(guarded, "the route must be declared").toContain(
      'path="/admin/add-blog"',
    );
    expect(guarded, "the R31 guard must wrap the page").toContain(
      "<RequireAdmin>",
    );
    expect(guarded, "the composer must be the guarded element").toContain(
      "<AddBlog />",
    );

    // The four controls the requirement asks for, each with a real label.
    expect(composer, "a blog title input").toContain('htmlFor={titleId}');
    expect(composer).toMatch(/<input[\s\S]*?type="text"/);
    expect(composer, "a category dropdown").toContain("<select");
    expect(composer, "a featured image file input").toContain('type="file"');
    expect(composer, "the file input accepts images").toContain('accept="image/*"');
    expect(composer, "a content textarea").toContain("<textarea");

    // Every control is labelled through useId, not by position.
    for (const id of [
      "titleId",
      "categoryId",
      "imageId",
      "excerptId",
      "tagsId",
      "contentId",
    ]) {
      expect(composer, `${id} must have its own label`).toContain(`htmlFor={${id}}`);
    }

    // The category options come from the site's shared taxonomy (R20.7).
    expect(composer).toContain("categoryOptions");
    expect(categoryOptions().length).toBeGreaterThan(0);

    // Storage and Firestore for blogs are reached through one seam.
    expect(seam).toContain('import("firebase/storage")');
    expect(seam).toContain('import("firebase/firestore")');
    expect(seam).toContain('"blogs"');

    const root = path.resolve("src");
    const allowed = new Set([
      "src/lib/blogs.ts",
      "src/lib/firebase.ts",
      "src/lib/users.ts",
    ]);
    const offenders: string[] = [];

    const walk = (directory: string): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const full = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          walk(full);
        } else if (/\.(ts|tsx)$/.test(entry.name)) {
          const relative = path
            .relative(path.resolve("."), full)
            .replace(/\\/g, "/");

          if (allowed.has(relative)) continue;

          const source = readFileSync(full, "utf8");

          if (/"firebase\/(storage|firestore)"/.test(source)) offenders.push(relative);
        }
      }
    };

    walk(root);

    expect(
      offenders,
      "only the blogs seam may reach Storage and Firestore (R24.15 pattern)",
    ).toEqual([]);

    // The rules that make the guard real.
    const firestore = read("firestore.rules");
    const storage = read("storage.rules");
    const config = read("firebase.json");

    expect(firestore, "blogs must be admin-only").toMatch(
      /match \/blogs\/\{blogId\} \{[\s\S]*?allow read, write: if isAdmin\(\);/,
    );
    expect(firestore, "admin comes from the user's own profile").toMatch(
      /documents\/users\/\$\(request\.auth\.uid\)\)\.data\.role == 'admin'/,
    );

    expect(storage, "the image folder must be namespaced by uid").toContain(
      "match /blog-images/{uid}/{fileName}",
    );
    expect(storage, "only the owner's own folder").toContain(
      "request.auth.uid == uid",
    );
    expect(storage, "images only").toContain("contentType.matches('image/.*')");
    expect(storage, "5 MB cap").toContain("5 * 1024 * 1024");
    expect(storage, "admin only").toContain("isOwnerAdmin()");

    expect(config, "the storage rules must be deployed").toMatch(
      /"storage":\s*\{\s*"rules":\s*"storage\.rules"/,
    );

    const scripts = JSON.parse(read("package.json")).scripts as Record<
      string,
      string
    >;

    expect(scripts["deploy:rules"], "both rule files publish together").toContain(
      "firestore:rules,storage:rules",
    );
  });
});

test.describe("R33 — the draft module decides what is written", () => {
  test("TC-3303: validation, the image rules and the document", () => {
    // AC33.4 — nothing is submitted while a required field is missing.
    const empty = validateDraft({
      title: "",
      category: "",
      excerpt: "",
      tags: "",
      content: "",
    });

    expect(Object.keys(empty).sort()).toEqual(["category", "content", "title"]);
    expect(empty.title).toMatch(/title/i);
    expect(empty.category).toMatch(/category/i);
    expect(empty.content).toMatch(/content/i);

    expect(validateDraft(DRAFT)).toEqual({});

    // AC33.5 — the image rules, and the cap the hint quotes.
    expect(validateImage(null)).toBeNull();
    expect(validateImage({ name: "a.png", type: "image/png", size: 1024 })).toBeNull();

    for (const type of ACCEPTED_IMAGE_TYPES) {
      expect(
        validateImage({ name: "a", type, size: 1024 }),
        `${type} must be accepted`,
      ).toBeNull();
    }

    expect(validateImage({ name: "a.pdf", type: "application/pdf", size: 1024 }))
      .toMatch(/image file/i);
    expect(
      validateImage({ name: "a.png", type: "image/png", size: MAX_IMAGE_BYTES + 1 }),
    ).toMatch(/5 MB/);

    // AC33.8 — one submission, one document, with the derived fields.
    const document = buildBlogDocument(DRAFT, AUTHOR, "https://example.test/x.png");

    expect(document.title).toBe("Mixture-of-Experts, Explained");
    expect(document.slug).toBe(slugFrom(DRAFT.title));
    expect(document.slug).toBe("mixture-of-experts-explained");
    expect(document.category).toBe("Research");
    expect(document.excerpt).toBe("Routing lets models grow.");
    expect(document.tags).toEqual(["models", "architecture"]);
    expect(document.content).toBe(DRAFT.content.trim());
    expect(document.imageUrl).toBe("https://example.test/x.png");
    expect(document.readingTime).toBe(readingTimeFrom(DRAFT.content));
    expect(document.authorName).toBe(AUTHOR.name);
    expect(document.authorEmail).toBe(AUTHOR.email);
    expect(document.authorUid).toBe(AUTHOR.uid);

    // AC33.9 — stored, not live.
    expect(document.published).toBe(false);

    // A missing image is stored as an empty URL, not omitted.
    expect(buildBlogDocument(DRAFT, AUTHOR, "").imageUrl).toBe("");

    // The helpers behind the derived fields.
    expect(parseTags("one, two,,two , three")).toEqual(["one", "two", "three"]);
    expect(readingTimeFrom(Array.from({ length: 400 }, () => "word").join(" "))).toBe(2);
    expect(slugFrom("???")).toBe("post");
  });
});
