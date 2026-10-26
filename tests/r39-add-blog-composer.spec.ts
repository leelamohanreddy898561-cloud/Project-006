import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

/**
 * R39 — the dashboard's Add New Blog is the Firestore composer.
 *
 * The composer renders only for an account promoted in the Firebase console, so
 * the rendered save is the owner's walkthrough (TC-3903). What the suite can
 * prove without that account is the wiring — that both routes reach the one
 * composer and that the second, markdown-only form is gone — and the order of
 * the fields, read from the component itself.
 */

function read(relative: string): string {
  return readFileSync(path.resolve(relative), "utf8");
}

/** Every `.ts`/`.tsx` file under `src`, as repo-relative POSIX paths. */
function sources(): Array<{ file: string; source: string }> {
  const found: Array<{ file: string; source: string }> = [];

  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        walk(full);
      } else if (/\.(ts|tsx)$/.test(entry.name)) {
        found.push({
          file: path.relative(path.resolve("."), full).replace(/\\/g, "/"),
          source: readFileSync(full, "utf8"),
        });
      }
    }
  };

  walk(path.resolve("src"));

  return found;
}

test.describe("R39 — one composer serves both routes", () => {
  test("TC-3901: the dashboard's Add New Blog renders the Firestore composer", () => {
    const app = read("src/App.tsx");
    const panels = read("src/components/admin/AdminPanels.tsx");
    const shell = read("src/pages/AdminDashboard.tsx");

    // The dashboard section and the R33 page render the same element, and both
    // sit inside the R31 guard.
    expect(app, "the dashboard section must render the composer").toContain(
      '<Route path="blogs/new" element={<AddBlog />} />',
    );

    const guarded = app.slice(
      app.indexOf('path="/admin/add-blog"'),
      app.indexOf('path="/admin/dashboard"'),
    );

    expect(guarded, "the R33 route stays guarded").toContain("<RequireAdmin>");
    expect(guarded, "the R33 route stays the same composer").toContain(
      "<AddBlog />",
    );

    // The second form is gone, not merely unlinked.
    expect(panels, "AdminPanels must not export a markdown composer").not.toMatch(
      /AdminBlogEditor/,
    );

    const leftovers = sources().filter((entry) =>
      /Compose markdown/.test(entry.source),
    );

    expect(
      leftovers.map((entry) => entry.file),
      "no markdown composer may remain in the app",
    ).toEqual([]);

    // One form, reached from the sidebar item that opens it.
    expect(
      read("src/pages/AddBlog.tsx").match(/<form className="admin-form"/g),
      "the composer must be a single form",
    ).toHaveLength(1);
    expect(shell, "the sidebar keeps its Add New Blog item").toContain(
      'path: "/admin/dashboard/blogs/new"',
    );

    const declared = [...shell.matchAll(/label: "([^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(declared, "the sidebar stays at exactly three sections").toEqual([
      "All Blogs",
      "Add New Blog",
      "Manage Users",
    ]);
  });
});

test.describe("R39 — the fields appear in the requested order", () => {
  test("TC-3902: the featured image sits directly before Tags", () => {
    const composer = read("src/pages/AddBlog.tsx");

    const order = [
      "titleId",
      "categoryId",
      "excerptId",
      "imageId",
      "tagsId",
      "contentId",
    ].map((id) => {
      const index = composer.indexOf(`htmlFor={${id}}`);

      expect(index, `${id} must keep its own label`).toBeGreaterThan(-1);

      return { id, index };
    });

    const sorted = [...order].sort((a, b) => a.index - b.index);

    expect(
      sorted.map((entry) => entry.id),
      "order must be title, category, excerpt, featured image, tags, content",
    ).toEqual(order.map((entry) => entry.id));

    // The image control is the same one R33/R35 proved: images only, uploaded
    // through the admin-gated function, with the shared taxonomy above it.
    expect(composer).toContain('type="file"');
    expect(composer).toContain('accept="image/*"');
    expect(composer).toContain("validateImage");
    expect(composer).toContain("categoryOptions");
    expect(composer).toContain("saveBlogPost");
  });
});
