import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { BLOGS_COLLECTION, saveBlogPost } from "../lib/blogs";
import {
  MAX_IMAGE_BYTES,
  categoryOptions,
  validateDraft,
  validateImage,
  type BlogDraft,
} from "../lib/blog-draft";
import "./AddBlog.css";

/**
 * R33 — the composer at `/admin/add-blog`.
 *
 * R32's "Add New Blog" panel used to compose a markdown file for a
 * `content/posts/` directory this repository does not have. R39 retires that
 * second form: the dashboard's **Add New Blog** section renders this page, so an
 * admin reaches one composer with a title, a category, an excerpt, the featured
 * image (directly above Tags) and the content, and a save writes a document to
 * the Firestore `blogs` collection.
 *
 * The page is behind the R31 guard (see `src/App.tsx`), so it only renders for
 * an account whose role is `"admin"`. It reaches Firebase only through
 * `src/lib/blogs.ts`, and the rules that back the write are the ones that make
 * the guard real (AC33.10, AC33.11).
 */

const CATEGORIES = categoryOptions();

function emptyDraft(): BlogDraft {
  return {
    title: "",
    category: CATEGORIES[0] ?? "",
    excerpt: "",
    tags: "",
    content: "",
  };
}

/** The signed-in account, as the document records it. */
function authorFrom(user: {
  uid: string;
  displayName: string | null;
  email: string | null;
}) {
  // R37 — the post is public, so the email is not recorded; the name is all a
  // visitor needs and all the document keeps.
  return {
    uid: user.uid,
    name: user.displayName ?? user.email ?? "AI Pulse",
  };
}

export function AddBlog() {
  const { user } = useAuth();

  const [draft, setDraft] = useState<BlogDraft>(emptyDraft);
  const [errors, setErrors] = useState<
    Partial<Record<keyof BlogDraft, string>>
  >({});
  const [imageError, setImageError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(
    null,
  );
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{ id: string; imageUrl: string } | null>(
    null,
  );

  const fileRef = useRef<HTMLInputElement>(null);

  const titleId = useId();
  const categoryId = useId();
  const imageId = useId();
  const excerptId = useId();
  const tagsId = useId();
  const contentId = useId();

  // A workspace page says which one it is, the same contract R24.3 sets.
  useEffect(() => {
    const previous = document.title;

    document.title = "Add new blog — AI Pulse Admin";

    return () => {
      document.title = previous;
    };
  }, []);

  // The object URL is revoked when it is replaced and when the page unmounts,
  // so a long session does not accumulate previews of images never uploaded.
  const previewUrl = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    [],
  );

  function clearPreview() {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);

    previewUrl.current = null;
    setPreview(null);
  }

  function update(key: keyof BlogDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setSaved(null);
  }

  function field(key: keyof BlogDraft) {
    return {
      value: draft[key],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        update(key, event.target.value),
    };
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);

    const url = file ? URL.createObjectURL(file) : null;

    previewUrl.current = url;
    setPreview(file && url ? { name: file.name, url } : null);
    setImageError(validateImage(file));
    setSaved(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validateDraft(draft);
    const image = fileRef.current?.files?.[0] ?? null;
    const imageProblem = validateImage(image);

    setErrors(found);
    setImageError(imageProblem);

    // Nothing is written while a field is missing or the image is unusable
    // (AC33.4, AC33.5, AC33.8).
    if (Object.keys(found).length > 0 || imageProblem || !user) {
      setStatus(
        user
          ? "The post was not saved — fix the fields marked below."
          : "The post was not saved — no account is signed in.",
      );
      setSaved(null);
      return;
    }

    setSaving(true);
    setStatus(image ? "Uploading the featured image…" : "Saving the post…");
    setSaved(null);

    const outcome = await saveBlogPost(draft, authorFrom(user), image);

    setSaving(false);

    if (!outcome.ok) {
      setStatus(outcome.message);
      return;
    }

    setStatus(
      `Saved to ${BLOGS_COLLECTION} as ${outcome.id}. It is live now — the home page and the blog archive read this collection.`,
    );
    setSaved({ id: outcome.id, imageUrl: outcome.imageUrl });
    setDraft(emptyDraft());
    clearPreview();

    if (fileRef.current) fileRef.current.value = "";
  }

  const limit = `${MAX_IMAGE_BYTES / (1024 * 1024)} MB`;

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <h1 className="admin-panel__title">Add new blog</h1>
        <p className="admin-panel__count">Writes to Firestore</p>
      </header>
      <p className="admin-panel__lead">
        Write the post, choose a featured image, and save it as a document in the{" "}
        <code>{BLOGS_COLLECTION}</code> collection. The image is uploaded to
        Firebase Storage and its URL is stored on the post.
      </p>

      <form className="admin-form" onSubmit={handleSubmit} noValidate>
        <div className="admin-field">
          <label className="admin-field__label" htmlFor={titleId}>
            Blog title
          </label>
          <div
            className="admin-field__control"
            data-invalid={errors.title ? "true" : undefined}
          >
            <input
              id={titleId}
              className="admin-field__input"
              type="text"
              autoComplete="off"
              value={draft.title}
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? `${titleId}-error` : undefined}
              onChange={field("title").onChange}
            />
          </div>
          {errors.title && (
            <p className="admin-field__error" id={`${titleId}-error`} role="alert">
              {errors.title}
            </p>
          )}
        </div>

        <div className="admin-field">
          <label className="admin-field__label" htmlFor={categoryId}>
            Category
          </label>
          <div className="admin-field__control">
            <select
              id={categoryId}
              className="admin-field__input"
              value={draft.category}
              aria-invalid={errors.category ? true : undefined}
              aria-describedby={
                errors.category ? `${categoryId}-error` : undefined
              }
              onChange={(event) => update("category", event.target.value)}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          {errors.category && (
            <p
              className="admin-field__error"
              id={`${categoryId}-error`}
              role="alert"
            >
              {errors.category}
            </p>
          )}
        </div>

        <div className="admin-field">
          <label className="admin-field__label" htmlFor={excerptId}>
            Excerpt <span className="admin-field__optional">(optional)</span>
          </label>
          <div className="admin-field__control">
            <textarea
              id={excerptId}
              className="admin-field__input admin-field__input--area"
              rows={2}
              value={draft.excerpt}
              aria-describedby={`${excerptId}-hint`}
              onChange={field("excerpt").onChange}
            />
          </div>
          <p className="admin-field__hint" id={`${excerptId}-hint`}>
            One line for listings. Leave it empty and the opening of the content
            is used instead.
          </p>
        </div>

        <div className="admin-field">
          <label className="admin-field__label" htmlFor={imageId}>
            Featured image
          </label>
          <div
            className="add-blog__file"
            data-invalid={imageError ? "true" : undefined}
          >
            <input
              id={imageId}
              ref={fileRef}
              className="add-blog__file-input"
              type="file"
              accept="image/*"
              aria-invalid={imageError ? true : undefined}
              aria-describedby={
                imageError ? `${imageId}-hint ${imageId}-error` : `${imageId}-hint`
              }
              onChange={chooseImage}
            />
          </div>
          <p className="admin-field__hint" id={`${imageId}-hint`}>
            Optional. PNG, JPEG, WebP, GIF, AVIF or SVG, up to {limit}. It is
            uploaded to Storage under <code>blog-images/</code> and the download
            URL is stored on the post.
          </p>
          {imageError && (
            <p
              className="admin-field__error"
              id={`${imageId}-error`}
              role="alert"
            >
              {imageError}
            </p>
          )}
          {preview && (
            <div className="add-blog__preview">
              <img src={preview.url} alt={`Preview of ${preview.name}`} />
              <span className="add-blog__preview-name">{preview.name}</span>
            </div>
          )}
        </div>

        <div className="admin-field">
          <label className="admin-field__label" htmlFor={tagsId}>
            Tags <span className="admin-field__optional">(optional)</span>
          </label>
          <div className="admin-field__control">
            <input
              id={tagsId}
              className="admin-field__input"
              type="text"
              value={draft.tags}
              aria-describedby={`${tagsId}-hint`}
              onChange={field("tags").onChange}
            />
          </div>
          <p className="admin-field__hint" id={`${tagsId}-hint`}>
            Comma-separated, for example <code>prompting, guides</code>.
          </p>
        </div>

        <div className="admin-field">
          <label className="admin-field__label" htmlFor={contentId}>
            Content
          </label>
          <div
            className="admin-field__control"
            data-invalid={errors.content ? "true" : undefined}
          >
            <textarea
              id={contentId}
              className="admin-field__input admin-field__input--area"
              rows={12}
              value={draft.content}
              aria-invalid={errors.content ? true : undefined}
              aria-describedby={
                errors.content ? `${contentId}-hint ${contentId}-error` : `${contentId}-hint`
              }
              onChange={field("content").onChange}
            />
          </div>
          <p className="admin-field__hint" id={`${contentId}-hint`}>
            Markdown, the same format the rest of the site renders.
          </p>
          {errors.content && (
            <p
              className="admin-field__error"
              id={`${contentId}-error`}
              role="alert"
            >
              {errors.content}
            </p>
          )}
        </div>

        <div className="add-blog__actions">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save post"}
          </button>
          <Link to="/admin/dashboard" className="btn btn--outline">
            Back to the dashboard
          </Link>
        </div>

        <p className="admin-form__status" role="status" aria-live="polite">
          {status}
        </p>
      </form>

      {saved && (
        <div className="admin-output">
          <p className="admin-output__file">
            Saved as <code>{saved.id}</code> in the{" "}
            <code>{BLOGS_COLLECTION}</code> collection
          </p>
          {saved.imageUrl && (
            <p className="admin-output__file">
              Featured image URL: <code>{saved.imageUrl}</code>
            </p>
          )}
        </div>
      )}

      <p className="admin-note">
        <strong>Live on save.</strong> Every document in the{" "}
        <code>{BLOGS_COLLECTION}</code> collection is part of the published
        archive — the home page, the <Link to="/blog">blog archive</Link> and the
        article pages read it (R37). Only an account with{" "}
        <code>role: "admin"</code> can write here, enforced by{" "}
        <code>firestore.rules</code> and <code>storage.rules</code> rather than
        by this page.
      </p>
    </section>
  );
}
