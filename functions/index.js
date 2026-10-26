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
 * The admin check is therefore enforced server-side, by reading the same
 * `users/{uid}.role` the /admin guard reads. That is a stronger guarantee than
 * the rule it replaces: the client cannot bypass it, and Firestore's own rules
 * still stop anyone from granting themselves the role.
 *
 * Images are stored under `blog-images/<uid>/` and made publicly readable with
 * a per-object ACL (the bucket uses fine-grained ACLs, not uniform access), so
 * a published post can serve its cover without a signed URL that would expire.
 */
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

const MAX_BYTES = 5 * 1024 * 1024;
const IMAGE_DATA_URL = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i;

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

exports.uploadBlogImage = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in before uploading an image.");
  }

  const profile = await admin.firestore().doc(`users/${uid}`).get();
  const role = profile.exists ? profile.data().role : null;

  if (role !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "Only an admin account can upload blog images.",
    );
  }

  const payload = request.data ?? {};
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
  const path = `blog-images/${uid}/${Date.now()}-${safeName(payload.fileName)}`;
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

/** Removes an image the composer uploaded but could not attach to a post. */
exports.deleteBlogImage = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in first.");
  }

  const profile = await admin.firestore().doc(`users/${uid}`).get();
  const role = profile.exists ? profile.data().role : null;

  if (role !== "admin") {
    throw new HttpsError("permission-denied", "Only an admin account can do that.");
  }

  const path = String(request.data?.path ?? "");

  if (!path.startsWith(`blog-images/${uid}/`)) {
    throw new HttpsError("invalid-argument", "That path is not yours to delete.");
  }

  await admin.storage().bucket(bucketName()).file(path).delete({ ignoreNotFound: true });

  return { deleted: true };
});
