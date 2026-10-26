import { getFirebase, isFirebaseConfigured } from "./firebase";
import {
  buildBlogDocument,
  validateDraft,
  validateImage,
  type BlogAuthor,
  type BlogDraft,
} from "./blog-draft";

/**
 * R33 — the single seam between the composer and Firebase.
 *
 * `src/pages/AddBlog.tsx` imports nothing else Firebase-related, exactly as
 * `AuthPage` reaches authentication only through `src/lib/auth.ts` (R24.15).
 * Every function resolves to an outcome rather than throwing, and never reports
 * a save that Firebase did not confirm (AC33.6).
 *
 * `firebase/firestore` and `firebase/storage` are imported on demand, so the
 * SDK stays out of the initial bundle (R14.1, AC29.6).
 */

/** Storage folder for featured images: `blog-images/<uid>/<file>`. */
const IMAGE_FOLDER = "blog-images";

/** The Firestore collection a submission writes to. */
export const BLOGS_COLLECTION = "blogs";

export type ImageUpload =
  | { ok: true; url: string; path: string }
  | { ok: false; message: string };

export type SaveOutcome =
  | { ok: true; id: string; imageUrl: string }
  | { ok: false; message: string };

/** Firebase error codes in plain English. Anything unmapped keeps its code. */
const MESSAGES: Record<string, string> = {
  "storage/unauthorized":
    "Storage refused the upload — the account needs the admin role, and the storage rules must be deployed (npm run deploy:rules).",
  "storage/canceled": "The upload was cancelled.",
  "storage/retry-limit-exceeded":
    "The upload timed out — check your connection and try again.",
  "storage/quota-exceeded":
    "The project's storage quota is full, so the image could not be stored.",
  "storage/invalid-format":
    "Storage refused that file. Choose a different image format.",
  "permission-denied":
    "Firestore refused the write — the blogs rules must be deployed (npm run deploy:rules).",
  unavailable: "Firestore is unreachable — check your connection and try again.",
  "auth/argument-error": "The image could not be uploaded. Try another file.",
};

function friendly(error: unknown, fallback: string): string {
  const code = (error as { code?: string })?.code;

  if (code && MESSAGES[code]) return MESSAGES[code];

  const detail = (error as { message?: string })?.message;

  return detail ? `${fallback} (${detail})` : fallback;
}

/** A file name that is safe to use as a Storage path segment. */
function safeName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || "image";
}

/**
 * Uploads the featured image and returns its download URL.
 *
 * The path is namespaced by the uploader's uid so `storage.rules` can grant an
 * admin access to their own folder and nothing else (AC33.7, AC33.11).
 */
export async function uploadBlogImage(
  uid: string,
  file: File,
): Promise<ImageUpload> {
  const problem = validateImage({
    name: file.name,
    type: file.type,
    size: file.size,
  });

  if (problem) return { ok: false, message: problem };

  if (!isFirebaseConfigured()) {
    return {
      ok: false,
      message:
        "Firebase is not configured — copy .env.example to .env and add the project values.",
    };
  }

  try {
    const [{ storage }, { ref, uploadBytes, getDownloadURL }] = await Promise.all(
      [getFirebase(), import("firebase/storage")],
    );

    const path = `${IMAGE_FOLDER}/${uid}/${Date.now()}-${safeName(file.name)}`;
    const target = ref(storage, path);

    await uploadBytes(target, file, { contentType: file.type });

    return { ok: true, url: await getDownloadURL(target), path };
  } catch (error) {
    return {
      ok: false,
      message: friendly(error, "The image could not be uploaded."),
    };
  }
}

/** Removes an uploaded image — used when the document write then fails. */
async function removeBlogImage(path: string): Promise<void> {
  try {
    const [{ storage }, { ref, deleteObject }] = await Promise.all([
      getFirebase(),
      import("firebase/storage"),
    ]);

    await deleteObject(ref(storage, path));
  } catch {
    // An orphaned image is a cost, not a failure; the write error is what the
    // admin needs to see.
  }
}

/**
 * Writes one document to `blogs`.
 *
 * Called only after `validateDraft` passes, so an empty form never reaches
 * Firestore (AC33.8). The document shape comes from `blog-draft.ts`; the
 * creation timestamp is a server value, so it is added here.
 */
export async function createBlogPost(
  draft: BlogDraft,
  author: BlogAuthor,
  imageUrl: string,
): Promise<SaveOutcome> {
  if (!isFirebaseConfigured()) {
    return {
      ok: false,
      message:
        "Firebase is not configured — copy .env.example to .env and add the project values.",
    };
  }

  try {
    const [{ db }, { addDoc, collection, serverTimestamp }] = await Promise.all([
      getFirebase(),
      import("firebase/firestore"),
    ]);

    const document = buildBlogDocument(draft, author, imageUrl);
    const created = await addDoc(collection(db, BLOGS_COLLECTION), {
      ...document,
      createdAt: serverTimestamp(),
    });

    return { ok: true, id: created.id, imageUrl };
  } catch (error) {
    return {
      ok: false,
      message: friendly(error, "The post could not be saved."),
    };
  }
}

/**
 * Upload, then write — and clean up the image if the write fails.
 *
 * The image goes first because the document carries its URL. If Firestore then
 * refuses, the image is removed again so a failed save does not leave a file
 * behind that no document points at.
 */
export async function saveBlogPost(
  draft: BlogDraft,
  author: BlogAuthor,
  file: File | null,
): Promise<SaveOutcome> {
  // The page owns the inline field errors; this is the seam's own guard, so a
  // caller that skips validation still cannot write an incomplete post.
  if (Object.keys(validateDraft(draft)).length > 0) {
    return { ok: false, message: "The post is missing a required field." };
  }

  const upload = file ? await uploadBlogImage(author.uid, file) : null;

  if (upload && !upload.ok) return { ok: false, message: upload.message };

  const saved = await createBlogPost(draft, author, upload?.url ?? "");

  if (!saved.ok && upload?.ok) await removeBlogImage(upload.path);

  return saved;
}
