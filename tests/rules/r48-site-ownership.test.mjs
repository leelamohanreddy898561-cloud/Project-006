/**
 * R48 — a workspace's admin belongs to the workspace, executed.
 *
 * R41 proved that a tenant is confined to its own workspace. R45 added a
 * platform-operator exception; R48 removes it. These cases run the real
 * `firestore.rules` in the Firestore emulator, so the boundary is proved by
 * execution rather than by reading the file: a global `"admin"` that is not the
 * workspace's owner or editor has no authority there, while the owner/editor
 * path and the public read are unchanged.
 *
 * Fixtures are written with rules disabled; every assertion goes through the
 * rule under test. The legacy flat `blogs` collection is not tenant data and is
 * covered by R37's own case, so it is not repeated here.
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

const OPERATOR = "platform-operator";
const OWNER_A = "owner-a";
const OWNER_B = "owner-b";
const EDITOR_A = "editor-a";
const VIEWER_A = "viewer-a";
const STRANGER = "stranger";
const CUSTOMER = "new-customer";

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-r48",
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

    // The role the rules read. Only the console can set this in production;
    // here it is a fixture, which is the point: the rule must ignore it for
    // every workspace the operator does not own or edit.
    await setDoc(doc(db, "users", OPERATOR), {
      email: "operator@example.com",
      role: "admin",
    });
    await setDoc(doc(db, "users", OWNER_A), {
      email: "owner-a@example.com",
      role: "student",
    });
    await setDoc(doc(db, "users", OWNER_B), {
      email: "owner-b@example.com",
      role: "student",
    });
    await setDoc(doc(db, "users", EDITOR_A), {
      email: "editor-a@example.com",
      role: "student",
    });
    await setDoc(doc(db, "users", VIEWER_A), {
      email: "viewer-a@example.com",
      role: "student",
    });

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
    // A workspace the operator does own: the global role grants nothing there
    // either, but ownership does.
    await setDoc(doc(db, "workspaces/operator-site"), {
      name: "Operator Site",
      slug: "operator-site",
      ownerUid: OPERATOR,
      branding: { title: "Operator Site", tagline: "" },
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
    await setDoc(doc(db, "workspaces/operator-site/blogs/post-op"), {
      title: "Operator's post",
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

describe("R48 — the platform admin has no authority in another tenant", () => {
  test("TC-4802: a global admin is a stranger to a workspace it does not own or edit", async () => {
    const operator = as(OPERATOR);

    // Posts: create, update and delete are refused in both tenants.
    await assertFails(
      updateDoc(doc(operator, "workspaces/a/blogs/post-a"), {
        title: "Edited by the operator",
      }),
    );
    await assertFails(
      updateDoc(doc(operator, "workspaces/b/blogs/post-b"), {
        title: "Edited by the operator",
      }),
    );
    await assertFails(
      setDoc(doc(operator, "workspaces/a/blogs/post-new"), {
        title: "Written by the operator",
        category: "News",
      }),
    );
    await assertFails(deleteDoc(doc(operator, "workspaces/a/blogs/post-a")));

    // Team and private state: neither read nor written for the operator.
    await assertFails(
      getDoc(doc(operator, `workspaces/a/members/${EDITOR_A}`)),
    );
    await assertFails(
      setDoc(doc(operator, "workspaces/a/members/operator-editor"), {
        role: "editor",
      }),
    );
    await assertFails(
      getDoc(doc(operator, "workspaces/a/private/billing")),
    );
    await assertFails(
      updateDoc(doc(operator, "workspaces/a/private/billing"), {
        plan: "pro",
      }),
    );

    // The public document cannot be edited or deleted by the operator.
    await assertFails(
      updateDoc(doc(operator, "workspaces/a"), { name: "Alpha, edited" }),
    );
    await assertFails(deleteDoc(doc(operator, "workspaces/a")));

    // Onboarding is not a browser power: the operator cannot create a
    // workspace owned by a customer, nor invent an ownerless one.
    await assertFails(
      setDoc(doc(operator, "workspaces/onboarded"), {
        name: "Onboarded",
        slug: "onboarded",
        ownerUid: CUSTOMER,
        branding: { title: "Onboarded", tagline: "" },
      }),
    );
    await assertFails(
      setDoc(doc(operator, "workspaces/ownerless"), {
        name: "Ownerless",
        slug: "ownerless",
        branding: { title: "Ownerless", tagline: "" },
      }),
    );

    // The site it does own is writable through ownership, not through the role.
    await assertSucceeds(
      updateDoc(doc(operator, "workspaces/operator-site"), {
        name: "Operator Site, edited",
      }),
    );
    await assertSucceeds(
      updateDoc(doc(operator, "workspaces/operator-site/blogs/post-op"), {
        title: "Edited by its owner",
      }),
    );
    await assertFails(
      updateDoc(doc(operator, "workspaces/operator-site"), {
        ownerUid: OWNER_A,
      }),
    );
    await assertFails(
      updateDoc(doc(operator, "workspaces/operator-site"), { plan: "pro" }),
    );

    // Public content is still public: the role never blocks a read that a
    // visitor could make.
    await assertSucceeds(getDoc(doc(operator, "workspaces/a")));
    await assertSucceeds(getDoc(doc(operator, "workspaces/a/blogs/post-a")));
  });
});

describe("R48 — the tenant boundary still holds for everyone else", () => {
  test("TC-4802: owner, editor, viewer, stranger and anonymous keep their R41 places", async () => {
    // The owner runs Alpha, and only Alpha.
    const ownerA = as(OWNER_A);

    await assertSucceeds(
      updateDoc(doc(ownerA, "workspaces/a"), { name: "Alpha, edited" }),
    );
    await assertSucceeds(
      updateDoc(doc(ownerA, "workspaces/a/blogs/post-a"), {
        title: "Owner edit",
      }),
    );
    await assertSucceeds(
      setDoc(doc(ownerA, "workspaces/a/members/new-editor"), {
        role: "editor",
      }),
    );
    await assertSucceeds(
      updateDoc(doc(ownerA, "workspaces/a/private/billing"), { plan: "pro" }),
    );
    await assertFails(
      updateDoc(doc(ownerA, "workspaces/b"), { name: "Mine now" }),
    );
    await assertFails(
      updateDoc(doc(ownerA, "workspaces/b/blogs/post-b"), {
        title: "Hijacked",
      }),
    );

    // An editor writes Alpha's posts, not its team, private state or document.
    const editor = as(EDITOR_A);

    await assertSucceeds(
      updateDoc(doc(editor, "workspaces/a/blogs/post-a"), {
        title: "Editor edit",
      }),
    );
    await assertFails(
      updateDoc(doc(editor, "workspaces/b/blogs/post-b"), {
        title: "Hijacked",
      }),
    );
    await assertFails(
      setDoc(doc(editor, "workspaces/a/members/mine"), { role: "editor" }),
    );
    await assertFails(
      getDoc(doc(editor, "workspaces/a/private/billing")),
    );
    await assertFails(
      updateDoc(doc(editor, "workspaces/a"), { name: "Editor edit" }),
    );

    // A viewer reads Alpha's posts but writes nothing.
    const viewer = as(VIEWER_A);

    await assertSucceeds(getDoc(doc(viewer, "workspaces/a/blogs/post-a")));
    await assertFails(
      updateDoc(doc(viewer, "workspaces/a/blogs/post-a"), {
        title: "Viewer edit",
      }),
    );

    // Owner B cannot reach Alpha, and cannot create a workspace owned by A.
    const ownerB = as(OWNER_B);

    await assertFails(
      updateDoc(doc(ownerB, "workspaces/a"), { name: "Mine now" }),
    );
    await assertFails(
      getDoc(doc(ownerB, "workspaces/a/private/billing")),
    );
    await assertFails(
      setDoc(doc(ownerB, "workspaces/not-mine"), {
        name: "Not Mine",
        slug: "not-mine",
        ownerUid: CUSTOMER,
        branding: { title: "Not Mine", tagline: "" },
      }),
    );

    // A signed-in stranger is still not a member of anything.
    const stranger = as(STRANGER);

    await assertSucceeds(getDoc(doc(stranger, "workspaces/a")));
    await assertSucceeds(getDoc(doc(stranger, "workspaces/a/blogs/post-a")));
    await assertFails(
      setDoc(doc(stranger, "workspaces/a/blogs/post-injected"), {
        title: "Injected",
        category: "News",
      }),
    );
    await assertFails(
      getDoc(doc(stranger, `workspaces/a/members/${EDITOR_A}`)),
    );

    // Anonymous writes stay refused; the public document and posts stay public.
    const visitor = env.unauthenticatedContext().firestore();

    await assertFails(
      setDoc(doc(visitor, "workspaces/a/blogs/post-anon"), {
        title: "Anonymous",
        category: "News",
      }),
    );
    await assertFails(getDoc(doc(visitor, `workspaces/a/members/${EDITOR_A}`)));

    await assertSucceeds(getDoc(doc(visitor, "workspaces/a")));
    await assertSucceeds(getDoc(doc(visitor, "workspaces/a/blogs/post-a")));

    const publicDoc = await assertSucceeds(getDoc(doc(visitor, "workspaces/a")));
    assert.equal(publicDoc.data().ownerUid, OWNER_A);
    assert.equal(publicDoc.data().plan, undefined);
  });
});
