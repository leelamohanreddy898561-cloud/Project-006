/**
 * R42 — the migration, executed.
 *
 * The migration runs with the Admin SDK, which bypasses security rules, so the
 * rules emulator is also the right Firestore for it: the real script module is
 * imported and run against a seeded flat `blogs` collection, and the result is
 * read back. That proves the copy, the id, the timestamps, the idempotency and
 * the dry run without touching the project.
 *
 * Run by `npm run test:rules` (same launcher as R41).
 */

import { after, before, beforeEach, describe, test } from "node:test";
import assert from "node:assert/strict";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import {
  migrateWorkspace,
  resolveOwner,
} from "../../scripts/migrate-workspace.mjs";

const APP = "r42-migration";
const WORKSPACE = "signal-and-noise";

let db;
let app;

before(() => {
  app = initializeApp({ projectId: "demo-r42" }, APP);
  db = getFirestore(app);
});

after(async () => {
  await db?.terminate();
  await deleteApp(app);
});

beforeEach(async () => {
  await db.recursiveDelete(db.collection("blogs"));
  await db.recursiveDelete(db.collection("workspaces"));
  await db.recursiveDelete(db.collection("users"));
});

async function seedBlog(id, values) {
  await db.collection("blogs").doc(id).set(values);
}

function created(seconds) {
  return new Timestamp(seconds, 0);
}

describe("R42 migration", () => {
  test("TC-4201 — copies every post once, keeps ids and timestamps, and never overwrites", async () => {
    const stamp = created(1_700_000_000);

    await seedBlog("post-one", {
      title: "One",
      slug: "one",
      category: "News",
      createdAt: stamp,
      imagePath: "blog-images/uid-a/one.jpg",
    });
    await seedBlog("post-two", {
      title: "Two",
      slug: "two",
      category: "News",
      createdAt: created(1_700_000_100),
      updatedAt: created(1_700_000_200),
    });
    // A document saved before R38 has no imagePath and no updatedAt.
    await seedBlog("post-three", {
      title: "Three",
      slug: "three",
      category: "News",
      createdAt: created(1_700_000_300),
    });

    const first = await migrateWorkspace({
      db,
      workspaceId: WORKSPACE,
      ownerUid: "owner-uid",
    });

    assert.equal(first.total, 3);
    assert.equal(first.copied.length, 3);
    assert.equal(first.skipped.length, 0);
    assert.equal(first.workspaceCreated, true);

    const workspace = await db.doc(`workspaces/${WORKSPACE}`).get();
    assert.equal(workspace.exists, true);
    assert.equal(workspace.data().ownerUid, "owner-uid");
    assert.equal(workspace.data().slug, WORKSPACE);
    assert.ok(workspace.data().createdAt, "the workspace gets a creation time");

    for (const id of ["post-one", "post-two", "post-three"]) {
      const destination = await db
        .doc(`workspaces/${WORKSPACE}/blogs/${id}`)
        .get();

      assert.equal(destination.exists, true, `${id} must be copied`);
      assert.equal(destination.id, id, "the document id must be kept");
    }

    const one = (
      await db.doc(`workspaces/${WORKSPACE}/blogs/post-one`).get()
    ).data();
    assert.equal(one.title, "One");
    assert.equal(one.imagePath, "blog-images/uid-a/one.jpg");
    assert.equal(
      one.createdAt.seconds,
      stamp.seconds,
      "the creation timestamp must survive the copy",
    );

    const two = (
      await db.doc(`workspaces/${WORKSPACE}/blogs/post-two`).get()
    ).data();
    assert.equal(two.updatedAt.seconds, 1_700_000_200);

    // The source collection is not touched: retiring it is a later decision.
    assert.equal((await db.collection("blogs").get()).size, 3);

    // A live edit after the migration must not be reverted by a second run.
    await db.doc(`workspaces/${WORKSPACE}/blogs/post-two`).update({
      title: "Two, edited",
    });

    const second = await migrateWorkspace({
      db,
      workspaceId: WORKSPACE,
      ownerUid: "owner-uid",
    });

    assert.equal(second.copied.length, 0, "a second run copies nothing");
    assert.equal(second.skipped.length, 3);
    assert.equal(second.workspaceCreated, false);
    assert.equal(
      (await db.doc(`workspaces/${WORKSPACE}/blogs/post-two`).get()).data()
        .title,
      "Two, edited",
      "an existing destination document is never overwritten",
    );

    // A dry run over one new document writes nothing.
    await seedBlog("post-four", {
      title: "Four",
      slug: "four",
      category: "News",
      createdAt: created(1_700_000_400),
    });

    const dry = await migrateWorkspace({
      db,
      workspaceId: WORKSPACE,
      ownerUid: "owner-uid",
      dryRun: true,
    });

    assert.equal(dry.copied.length, 1);
    assert.equal(
      (await db.doc(`workspaces/${WORKSPACE}/blogs/post-four`).get()).exists,
      false,
      "a dry run must not write",
    );
  });

  test("TC-4201 — an owner is required before a workspace is invented", async () => {
    await seedBlog("post-one", { title: "One", createdAt: created(1) });

    // No users at all, and no explicit owner: the run must refuse.
    await assert.rejects(
      migrateWorkspace({ db, workspaceId: "no-owner-workspace" }),
      /no owner could be determined/i,
    );

    // An existing admin profile is picked up instead.
    await db.collection("users").doc("admin-uid").set({ role: "admin" });
    assert.equal(await resolveOwner(db, ""), "admin-uid");

    const report = await migrateWorkspace({
      db,
      workspaceId: "admin-workspace",
    });

    assert.equal(report.workspaceCreated, true);
    assert.equal(
      (await db.doc("workspaces/admin-workspace").get()).data().ownerUid,
      "admin-uid",
    );
  });
});
