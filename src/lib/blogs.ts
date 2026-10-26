import { getFirebase, isFirebaseConfigured } from "./firebase";
import {
  buildBlogDocument,
  validateDraft,
  validateImage,
  type BlogAuthor,
  type BlogDraft,
} from "./blog-draft";

/**
 * R33 / R35 — the single seam between the composer and Firebase.
 *
 * Two services are used, each where it actually works:
 *
 *   - **Storage goes through a Cloud Function** (`uploadBlogImage`). The
 *     project's bucket does not apply Storage Security Rules, so the browser
 *     SDK cannot write to it whatever `storage.rules` says (see R35). The Admin
 *     SDK is not subject to those rules, and the function checks the caller's
 *     `users/{uid}.role` itself, so admin-only is enforced server-side.
 *   - **Firestore is written directly** (`blogs`), because its rules do work —
 *     `blogs` is admin-only there, read from the same profile.
 *
 * `src/pages/AddBlog.tsx` imports nothing Firebase-related except this module.
 * Every function resolves to an outcome rather than throwing, and never reports
 * a save that Firebase did not confirm (R33 AC6).
 */

/** The Firestore collection a submission writes to. */
export const BLOGS_COLLECTION = "blogs";

/** Longest edge kept when an image is downscaled before upload. */
const MAX_IMAGE_EDGE = 1600;

export type ImageUpload =
  | { ok: true; url: string; path: string }
  | { ok: false; message: string };

export type SaveOutcome =
  | { ok: true; id: string; imageUrl: string }
  | { ok: false; message: string };

/** Firebase error codes in plain English. Anything unmapped keeps its text. */
const MESSAGES: Record<string, string> = {
  "storage/unauthorized":
    "Storage refused the upload — the account needs the admin role.",
  "permission-denied":
    "Firestore refused the write — the blogs rules must be deployed (npm run deploy:rules).",
  "functions/permission-denied": "Only an admin account can upload blog images.",
  "functions/unauthenticated": "Sign in before uploading an image.",
  "functions/unavailable":
    "The upload service is unreachable — check your connection and try again.",
  "functions/deadline-exceeded":
    "The upload timed out — check your connection and try again.",
  "functions/internal": "The upload service failed. Try again.",
  unavailable: "Firestore is unreachable — check your connection and try again.",
};

function friendly(error: unknown, fallback: string): string {
  const code = (error as { code?: string })?.code;

  if (code && MESSAGES[code]) return MESSAGES[code];

  const detail = (error as { message?: string })?.message;

  return detail ? `${fallback} (${detail})` : fallback;
}

/** Reads a file as a data URL, the transport the callable accepts. */
function rawDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

/**
 * Downscales and re-encodes the image before it leaves the browser.
 *
 * The function caps the decoded payload at 5 MB, and a cover has no business
 * being that large: 1600px on the long edge at JPEG quality 0.85 keeps a
 * photograph in the low hundreds of kB. Formats the canvas cannot decode (SVG,
 * animated GIF) fall back to the original bytes.
 */
async function imageDataUrl(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(
      1,
      MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height),
    );
    const canvas = document.createElement("canvas");

    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));

    const context = canvas.getContext("2d");
    if (!context) throw new Error("no 2d context");

    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();

    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return rawDataUrl(file);
  }
}

/**
 * Uploads the featured image through the admin-gated function and returns its
 * public URL. The path is namespaced by the caller's uid, and the function
 * refuses a caller whose role is not "admin" (R35).
 */
export async function uploadBlogImage(file: File): Promise<ImageUpload> {
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
    const [{ app }, { getFunctions, httpsCallable }] = await Promise.all([
      getFirebase(),
      import("firebase/functions"),
    ]);

    const dataUrl = await imageDataUrl(file);
    const call = httpsCallable(getFunctions(app), "uploadBlogImage");
    const result = await call({ dataUrl, fileName: file.name });
    const data = result.data as { url?: string; path?: string };

    if (!data?.url || !data.path) {
      return { ok: false, message: "The upload returned no URL." };
    }

    return { ok: true, url: data.url, path: data.path };
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
    const [{ app }, { getFunctions, httpsCallable }] = await Promise.all([
      getFirebase(),
      import("firebase/functions"),
    ]);

    await httpsCallable(getFunctions(app), "deleteBlogImage")({ path });
  } catch {
    // An orphaned image is a cost, not a failure; the write error is what the
    // admin needs to see.
  }
}

/**
 * Writes one document to `blogs`.
 *
 * Called only after `validateDraft` passes, so an empty form never reaches
 * Firestore (R33 AC8). The document shape comes from `blog-draft.ts`; the
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

  const upload = file ? await uploadBlogImage(file) : null;

  if (upload && !upload.ok) return { ok: false, message: upload.message };

  const saved = await createBlogPost(draft, author, upload?.url ?? "");

  if (!saved.ok && upload?.ok) await removeBlogImage(upload.path);

  return saved;
}
