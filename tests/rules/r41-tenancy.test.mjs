/**
 * R41 — the tenancy boundary, executed.
 *
 * These cases run the real `firestore.rules` in the Firestore emulator, not a
 * copy of its logic: the point of the requirement is that one customer's
 * account is refused another customer's data, and only an executed rule proves
 * that. They are run by `npm run test:rules`, which starts the emulator (see
 * `scripts/run-rules-tests.mjs`); a browser cannot reach this surface, so they
 * live outside the Playwright suite.
 *
 * Fixtures are written with rules disabled, then every assertion goes through
 * the rule under test.
 */

import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const RULES = readFileSync(
  new URL("../../firestore.rules", import.meta.url),
  "utf8",
);

const OWNER_A = "owner-a";
const EDITOR_A = "editor-a";
const VIEWER_A = "viewer-a";
const OWNER_B = "owner-b";
const STRANGER = "stranger";

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-r41",
    firestore: { rules: RULES },
  });
});

after(async () => {
  await env?.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();

  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();

    await setDoc(doc(db, "workspaces/a"), {
      name: "Alpha",
      slug: "alpha",
      ownerUid: OWNER_A,
      branding: { title: "Alpha", tagline: "" },
    });
    await setDoc(doc(db, "workspaces/b"), {
      name: "Beta",
      slug: "beta",
      ownerUid: OWNER_B,
      branding: { title: "Beta", tagline: "" },
    });

    await setDoc(doc(db, `workspaces/a/members/${EDITOR_A}`), {
      role: "editor",
    });
    await setDoc(doc(db, `workspaces/a/members/${VIEWER_A}`), {
      role: "viewer",
    });

    await setDoc(doc(db, "workspaces/a/blogs/post-a"), {
      title: "A public post",
      category: "News",
    });
    await setDoc(doc(db, "workspaces/b/blogs/post-b"), {
      title: "B public post",
      category: "News",
    });
    await setDoc(doc(db, "workspaces/a/private/billing"), {
      plan: "free",
    });
  });
});

/** A Firestore client acting as `uid`, subject to the rules. */
function as(uid) {
  return env.authenticatedContext(uid).firestore();
}

function anonymous() {
  return env.unauthenticatedContext().firestore();
}

describe("R41 tenancy", () => {
  test("TC-4101 — a member of one workspace cannot write another workspace's posts", async () => {
    const editor = as(EDITOR_A);

    // The editor's own workspace: allowed.
    await assertSucceeds(
      updateDoc(doc(editor, "workspaces/a/blogs/post-a"), {
        title: "A public post, edited",
      }),
    );
    await assertSucceeds(
      setDoc(doc(editor, "workspaces/a/blogs/post-new"), {
        title: "A new post",
        category: "News",
      }),
    );

    // The other workspace: refused, on update, create and delete.
    await assertFails(
      updateDoc(doc(editor, "workspaces/b/blogs/post-b"), {
        title: "Hijacked",
      }),
    );
    await assertFails(
      setDoc(doc(editor, "workspaces/b/blogs/post-injected"), {
        title: "Injected",
        category: "News",
      }),
    );
    await assertFails(deleteDoc(doc(editor, "workspaces/b/blogs/post-b")));

    // An account with no membership at all is refused as well.
    const stranger = as(STRANGER);
    await assertFails(
      updateDoc(doc(stranger, "workspaces/a/blogs/post-a"), {
        title: "Hijacked",
      }),
    );

    // A viewer may read but not write.
    const viewer = as(VIEWER_A);
    await assertSucceeds(getDoc(doc(viewer, "workspaces/a/blogs/post-a")));
    await assertFails(
      updateDoc(doc(viewer, "workspaces/a/blogs/post-a"), {
        title: "Viewer edit",
      }),
    );
  });

  test("TC-4102 — posts are publicly readable, the team list is not", async () => {
    const visitor = anonymous();

    // A published blog is public, in either workspace.
    await assertSucceeds(getDoc(doc(visitor, "workspaces/a/blogs/post-a")));
    await assertSucceeds(getDoc(doc(visitor, "workspaces/b/blogs/post-b")));

    // Anonymous writes are refused.
    await assertFails(
      setDoc(doc(visitor, "workspaces/a/blogs/post-anon"), {
        title: "Anonymous",
        category: "News",
      }),
    );

    // The team list is never public.
    await assertFails(getDoc(doc(visitor, `workspaces/a/members/${EDITOR_A}`)));

    // A member of A sees A's team and not B's.
    const editor = as(EDITOR_A);
    await assertSucceeds(getDoc(doc(editor, `workspaces/a/members/${VIEWER_A}`)));
    await assertFails(getDoc(doc(editor, `workspaces/b/members/${EDITOR_A}`)));

    // Only the owner manages the team, and never hands out ownership.
    const owner = as(OWNER_A);
    await assertSucceeds(
      setDoc(doc(owner, `workspaces/a/members/${STRANGER}`), {
        role: "viewer",
      }),
    );
    await assertFails(
      setDoc(doc(owner, "workspaces/a/members/forged-owner"), {
        role: "owner",
      }),
    );
    await assertFails(
      setDoc(doc(editor, "workspaces/a/members/forged-viewer"), {
        role: "viewer",
      }),
    );
  });

  test("TC-4103 — billing state stays private and out of the public document", async () => {
    const owner = as(OWNER_A);

    // Owner-only, in a subcollection the public never reads.
    await assertSucceeds(getDoc(doc(owner, "workspaces/a/private/billing")));
    await assertFails(getDoc(doc(as(EDITOR_A), "workspaces/a/private/billing")));
    await assertFails(getDoc(doc(anonymous(), "workspaces/a/private/billing")));

    // A plan field cannot be written into the public workspace document.
    await assertFails(
      updateDoc(doc(owner, "workspaces/a"), { plan: "pro" }),
    );

    // Ownership cannot be transferred from the browser.
    await assertFails(
      updateDoc(doc(owner, "workspaces/a"), { ownerUid: OWNER_B }),
    );
    await assertFails(updateDoc(doc(as(OWNER_B), "workspaces/a"), { name: "Mine" }));

    // Self-serve creation: your own workspace, a real slug, no billing field.
    const creator = as("new-customer");
    await assertSucceeds(
      setDoc(doc(creator, "workspaces/new-customer-blog"), {
        name: "New Customer Blog",
        slug: "new-customer-blog",
        ownerUid: "new-customer",
        branding: { title: "New Customer Blog", tagline: "" },
      }),
    );
    await assertFails(
      setDoc(doc(creator, "workspaces/not-mine"), {
        name: "Not Mine",
        slug: "not-mine",
        ownerUid: OWNER_A,
        branding: { title: "Not Mine", tagline: "" },
      }),
    );
    await assertFails(
      setDoc(doc(creator, "workspaces/bad-slug"), {
        name: "Bad Slug",
        slug: "Not A Slug",
        ownerUid: "new-customer",
        branding: { title: "Bad Slug", tagline: "" },
      }),
    );
    await assertFails(
      setDoc(doc(creator, "workspaces/paid"), {
        name: "Paid",
        slug: "paid",
        ownerUid: "new-customer",
        plan: "pro",
        branding: { title: "Paid", tagline: "" },
      }),
    );

    // The public document itself is readable, so the site can render the name.
    const publicDoc = await assertSucceeds(
      getDoc(doc(anonymous(), "workspaces/a")),
    );
    assert.equal(publicDoc.data().slug, "alpha");
    assert.equal(publicDoc.data().plan, undefined);
  });
});
