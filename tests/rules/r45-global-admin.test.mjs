/**
 * R45 — the platform operator's write authority, executed.
 *
 * R41 proved that a tenant is confined to its own workspace. R45 adds one
 * exception the product asks for: `users/{uid}.role == "admin"` may write every
 * workspace — posts, team, private state and the workspace document — while the
 * tenant boundary is otherwise unchanged. A rule can only be proved by running
 * it, so these cases execute the real `firestore.rules` in the emulator via
 * `npm run test:rules`.
 *
 * Fixtures are written with rules disabled; every assertion goes through the
 * rule under test.
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
const CUSTOMER = "new-customer";

let env;

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-r45",
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
    // here it is a fixture, which is the point: the rule consults it.
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

describe("R45 global admin", () => {
  test("TC-4501 — the platform admin writes every workspace, but does not own it", async () => {
    const operator = as(OPERATOR);

    // Posts: create, update and delete, in both tenants.
    await assertSucceeds(
      updateDoc(doc(operator, "workspaces/a/blogs/post-a"), {
        title: "Edited by the operator",
      }),
    );
    await assertSucceeds(
      updateDoc(doc(operator, "workspaces/b/blogs/post-b"), {
        title: "Edited by the operator",
      }),
    );
    await assertSucceeds(
      setDoc(doc(operator, "workspaces/b/blogs/post-new"), {
        title: "Written by the operator",
        category: "News",
      }),
    );
    await assertSucceeds(deleteDoc(doc(operator, "workspaces/b/blogs/post-b")));

    // Team and private state: readable and writable for the operator.
    await assertSucceeds(
      getDoc(doc(operator, `workspaces/a/members/${EDITOR_A}`)),
    );
    await assertSucceeds(
      setDoc(doc(operator, "workspaces/a/members/operator-editor"), {
        role: "editor",
      }),
    );
    await assertSucceeds(
      getDoc(doc(operator, "workspaces/a/private/billing")),
    );
    await assertSucceeds(
      updateDoc(doc(operator, "workspaces/a/private/billing"), {
        plan: "pro",
      }),
    );

    // The public document may be edited, but ownership and billing stay out.
    await assertSucceeds(
      updateDoc(doc(operator, "workspaces/a"), { name: "Alpha, edited" }),
    );
    await assertFails(
      updateDoc(doc(operator, "workspaces/a"), { ownerUid: OPERATOR }),
    );
    await assertFails(
      updateDoc(doc(operator, "workspaces/a"), { plan: "pro" }),
    );

    // The operator can onboard a workspace for a customer, but never invent an
    // ownerless one.
    await assertSucceeds(
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
  });

  test("TC-4501 — the tenant boundary still holds for everyone else", async () => {
    // An editor of A stays inside A even though an operator exists elsewhere.
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
      setDoc(doc(editor, "workspaces/b/blogs/post-injected"), {
        title: "Injected",
        category: "News",
      }),
    );
    await assertFails(deleteDoc(doc(editor, "workspaces/b/blogs/post-b")));

    // A signed-in non-admin cannot use the operator's overrides.
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

    // The operator's member write still cannot hand out ownership.
    await assertFails(
      setDoc(doc(as(OPERATOR), "workspaces/a/members/forged-owner"), {
        role: "owner",
      }),
    );

    // Anonymous writes stay refused.
    const visitor = env.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(visitor, "workspaces/a/blogs/post-anon"), {
        title: "Anonymous",
        category: "News",
      }),
    );
    await assertFails(getDoc(doc(visitor, `workspaces/a/members/${EDITOR_A}`)));

    // A non-admin cannot read the private state, but the public document and
    // posts remain public.
    await assertSucceeds(getDoc(doc(visitor, "workspaces/a")));
    await assertSucceeds(getDoc(doc(visitor, "workspaces/a/blogs/post-a")));

    const publicDoc = await assertSucceeds(getDoc(doc(visitor, "workspaces/a")));
    assert.equal(publicDoc.data().ownerUid, OWNER_A);
    assert.equal(publicDoc.data().plan, undefined);
  });
});
