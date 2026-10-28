/**
 * R35 — the admin-gated upload endpoint.
 *
 * Why this exists: the project's Cloud Storage bucket does not apply Firebase
 * Storage Security Rules (a bucket created outside Firebase Storage's own
 * provisioning; `allow read, write: if true` at the root is still refused for
 * every non-IAM caller), so the browser SDK cannot write to it no matter what
 * `storage.rules` says. The Admin SDK is not subject to those rules, so the
 * upload moves here.
 *
 * The check is enforced server-side, by reading the same role the /admin guard
 * reads. That is a stronger guarantee than the rule it replaces: the client
 * cannot bypass it, and Firestore's own rules still stop anyone from granting
 * themselves the role.
 *
 * R41 adds the tenant path. A caller that names a workspace is checked against
 * that workspace's owner and members, and its image is stored under
 * `workspaces/<id>/blog-images/<uid>/`, so one customer's upload can never land
 * in another customer's folder. A caller that names no workspace keeps the
 * R35 behaviour for the legacy path.
 *
 * R48 removes the platform operator's workspace override: a global admin may
 * not upload to, or delete a cover from, a workspace it does not own or edit.
 * The tenant's own owner/editor check is the only answer. The legacy
 * `blog-images/` path keeps its R35 global-admin check because it is not
 * tenant data.
 *
 * Images are stored under the caller's own folder and made publicly readable
 * with a per-object ACL (the bucket uses fine-grained ACLs, not uniform
 * access), so a published post can serve its cover without a signed URL that
 * would expire.
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

const MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_DATA_URL = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i;

/** A Firestore document id is a path segment, so it may not contain a slash. */
const WORKSPACE_ID = /^[A-Za-z0-9_-]{1,80}$/;

/** Roles that may write this blog's content. */
const CAN_EDIT = new Set(["owner", "editor"]);

/** The project's Storage bucket, as Cloud Functions reports it. */
function bucketName() {
  try {
    return JSON.parse(process.env.FIREBASE_CONFIG ?? "{}").storageBucket;
  } catch {
    return undefined;
  }
}

function safeName(name) {
  const cleaned = String(name || "image")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || "image";
}

/**
 * R35 — the global admin role, used only by the legacy (no-workspace) path.
 */
async function isGlobalAdmin(uid) {
  const profile = await admin.firestore().doc(`users/${uid}`).get();

  return profile.exists && profile.data().role === "admin";
}

/**
 * R41 — the caller's role in one workspace: "owner", "editor", "viewer" or null.
 *
 * Owner is `ownerUid` on the workspace document, not a member document, so the
 * same source of truth backs both this check and `firestore.rules`.
 */
async function workspaceRole(uid, workspaceId) {
  const [workspace, member] = await Promise.all([
    admin.firestore().doc(`workspaces/${workspaceId}`).get(),
    admin.firestore().doc(`workspaces/${workspaceId}/members/${uid}`).get(),
  ]);

  if (!workspace.exists) return null;
  if (workspace.data().ownerUid === uid) return "owner";

  return member.exists ? member.data().role : null;
}

/** The folder this caller may write to, for the workspace or the legacy path. */
function imageFolder(uid, workspaceId) {
  return workspaceId
    ? `workspaces/${workspaceId}/blog-images/${uid}`
    : `blog-images/${uid}`;
}

exports.uploadBlogImage = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in before uploading an image.");
  }

  const payload = request.data ?? {};
  const workspaceId =
    typeof payload.workspaceId === "string" && payload.workspaceId
      ? payload.workspaceId
      : "";

  if (workspaceId) {
    if (!WORKSPACE_ID.test(workspaceId)) {
      throw new HttpsError("invalid-argument", "That workspace id is not valid.");
    }

    // R48 — the workspace role is the only answer; a global admin is not a
    // member unless it is that workspace's owner or an editor.
    const role = await workspaceRole(uid, workspaceId);

    if (!CAN_EDIT.has(role)) {
      throw new HttpsError(
        "permission-denied",
        "Only this blog's owner or an editor can upload blog images.",
      );
    }
  } else if (!(await isGlobalAdmin(uid))) {
    throw new HttpsError(
      "permission-denied",
      "Only an admin account can upload blog images.",
    );
  }

  const match =
    typeof payload.dataUrl === "string"
      ? payload.dataUrl.match(IMAGE_DATA_URL)
      : null;

  if (!match) {
    throw new HttpsError(
      "invalid-argument",
      "Send the image as an image data URL.",
    );
  }

  const contentType = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], "base64");

  if (buffer.length === 0) {
    throw new HttpsError("invalid-argument", "That image is empty.");
  }

  if (buffer.length > MAX_BYTES) {
    throw new HttpsError("invalid-argument", "That image is larger than 5 MB.");
  }

  const bucket = admin.storage().bucket(bucketName());
  const path = `${imageFolder(uid, workspaceId)}/${Date.now()}-${safeName(payload.fileName)}`;
  const file = bucket.file(path);

  await file.save(buffer, {
    contentType,
    resumable: false,
    metadata: { contentType },
  });

  // Fine-grained ACL: this object is a public cover, the rest of the bucket is not.
  await file.makePublic();

  return {
    url: `https://storage.googleapis.com/${bucket.name}/${encodeURI(path)}`,
    path,
    size: buffer.length,
  };
});

/**
 * Removes an image the composer uploaded but could not attach to a post.
 *
 * The path decides which check applies: a workspace path needs edit rights in
 * that workspace (R48: no platform-admin override), and the legacy path needs
 * the global admin role. A caller may only remove an object in its own folder.
 */
exports.deleteBlogImage = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in first.");
  }

  const path = String(request.data?.path ?? "");
  const workspacePath = path.match(
    /^workspaces\/([A-Za-z0-9_-]{1,80})\/blog-images\/([^/]+)\//,
  );
  const legacyPath = /^blog-images\/[^/]+\/[^/]+/.test(path);
  const coverPath = Boolean(workspacePath) || legacyPath;

  let allowed = false;

  if (workspacePath) {
    // R48 — the workspace role decides, and only in the caller's own folder.
    allowed =
      workspacePath[2] === uid &&
      CAN_EDIT.has(await workspaceRole(uid, workspacePath[1]));
  } else if (coverPath) {
    // R35 legacy path: not tenant data, so the global admin still owns it.
    allowed = await isGlobalAdmin(uid);
  }

  if (!allowed) {
    throw new HttpsError(
      "permission-denied",
      "That image is not yours to delete.",
    );
  }

  await admin.storage().bucket(bucketName()).file(path).delete({ ignoreNotFound: true });

  return { deleted: true };
});
