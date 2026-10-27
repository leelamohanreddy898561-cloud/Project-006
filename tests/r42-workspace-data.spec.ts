import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { imagePathFromUrl, storedImagePath } from "../src/lib/blog-admin";

/**
 * R42 — the site's posts live in a workspace.
 *
 * The migration's proof is TC-4201 (the real script against the emulator). This
 * case proves the switch and the cover-path rule. The two Firebase seams are
 * read as source rather than imported: importing them pulls in
 * `src/lib/firebase.ts`, whose `import.meta.env` only exists inside Vite.
 */

const ROOT = path.resolve(".");
const SEAM = readFileSync(path.join(ROOT, "src", "lib", "blogs.ts"), "utf8");
const WORKSPACES = readFileSync(
  path.join(ROOT, "src", "lib", "workspaces.ts"),
  "utf8",
);
const FUNCTIONS = readFileSync(path.join(ROOT, "functions", "index.js"), "utf8");

test("TC-4202 — reads, writes and covers all name the workspace", () => {
  expect(WORKSPACES).toContain(
    'export const DEFAULT_WORKSPACE_ID = "signal-and-noise";',
  );
  expect(SEAM).toContain(
    "export const SITE_WORKSPACE_ID = DEFAULT_WORKSPACE_ID;",
  );

  // Every access to the posts goes through the workspace path, and the old
  // flat collection is no longer named by the seam.
  expect(SEAM).toContain("workspaceBlogsPath(SITE_WORKSPACE_ID)");
  expect(SEAM).not.toContain("collection(db, BLOGS_COLLECTION)");
  expect(SEAM).not.toContain("doc(db, BLOGS_COLLECTION");

  // The upload and delete calls tell the function which workspace this is.
  expect(
    (SEAM.match(/workspaceId: SITE_WORKSPACE_ID/g) ?? []).length,
    "both callables must name the workspace",
  ).toBe(2);

  // The function stores and checks the workspace path.
  expect(FUNCTIONS).toContain("workspaces/${workspaceId}/blog-images/${uid}");

  // A cover's path is recognised in both shapes, and nothing else is.
  const workspaceUrl =
    "https://storage.googleapis.com/bucket/workspaces/signal-and-noise/blog-images/uid-a/1700000000-cover.jpg";
  const legacyUrl =
    "https://storage.googleapis.com/bucket/blog-images/uid-a/1700000000-cover.jpg";

  expect(imagePathFromUrl(workspaceUrl)).toBe(
    "workspaces/signal-and-noise/blog-images/uid-a/1700000000-cover.jpg",
  );
  expect(imagePathFromUrl(legacyUrl)).toBe(
    "blog-images/uid-a/1700000000-cover.jpg",
  );

  expect(
    imagePathFromUrl("https://example.com/images/cover.jpg"),
    "an unrelated URL is never handed to the delete function",
  ).toBe("");

  expect(
    storedImagePath({
      id: "post",
      imagePath: "workspaces/signal-and-noise/blog-images/uid-a/cover.jpg",
    } as never),
  ).toBe("workspaces/signal-and-noise/blog-images/uid-a/cover.jpg");

  // A document that predates R42 still resolves its legacy path from the URL.
  expect(
    storedImagePath({ id: "post", imageUrl: legacyUrl } as never),
  ).toBe("blog-images/uid-a/1700000000-cover.jpg");
});
