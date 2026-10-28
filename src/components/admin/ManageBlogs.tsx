import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link } from "react-router-dom";
import { formatDate, getLatestPosts } from "../../data/posts";
import { useSavedBlogs } from "../../hooks/useSavedBlogs";
import {
  SITE_WORKSPACE_ID,
  deleteBlogPost,
  updateBlogPost,
  type ImageChange,
} from "../../lib/blogs";
import {
  currentImage,
  draftFromRecord,
  managedBlogs,
  type ManagedBlog,
} from "../../lib/blog-admin";
import {
  MAX_IMAGE_BYTES,
  categoryOptions,
  validateDraft,
  validateImage,
  type BlogDraft,
  type DraftErrors,
} from "../../lib/blog-draft";
import "./ManageBlogs.css";

/**
 * R38 — the blog management view.
 *
 * This is the dashboard's **All Blogs** section, which R32.1 fixes as one of
 * exactly three sidebar items. It lists the repository articles and the
 * Firestore `blogs` documents as one archive, but only a Firestore post can be
 * changed from the browser: editing a repository article is a commit, so those
 * rows are View-only rather than offering a button that cannot work.
 *
 * Every write goes through `src/lib/blogs.ts` — `updateBlogPost` and
 * `deleteBlogPost`, which talk to the same `blogs/<id>` document the composer
 * writes. The page is behind the R31 guard and the rules keep the write
 * admin-only; this component only shapes the request.
 *
 * R45 — the same panel is a tenant's post manager. It takes the workspace and
 * the public base path as props, lists only that workspace's Firestore posts,
 * and passes the workspace to every write, so a tenant's Edit or Delete can
 * never reach another site. On the global site (`/admin/dashboard/blogs`) the
 * repository articles stay in the list as read-only rows.
 */

const CATEGORIES = categoryOptions();

export interface ManageBlogsProps {
  /** The workspace whose posts this panel manages. */
  workspaceId?: string;
  /** "" on the global site; `/w/<slug>` inside a tenant. */
  basePath?: string;
  /** The default site lists its repository articles too, read-only. */
  includeRepository?: boolean;
}
const IMAGE_LIMIT = `${MAX_IMAGE_BYTES / (1024 * 1024)} MB`;

function imageRuleMessage(file: File | null): string | null {
  if (!file) return null;

  return validateImage({ name: file.name, type: file.type, size: file.size });
}

/* The post row ------------------------------------------------------------- */

function ManagedBlogRow({
  item,
  basePath,
  onEdit,
  onDelete,
}: {
  item: ManagedBlog;
  basePath: string;
  onEdit: (item: ManagedBlog) => void;
  onDelete: (item: ManagedBlog) => void;
}) {
  const title = item.post.title;
  const date = formatDate(item.post.date);

  return (
    <div className="manage-blogs__row">
      <div className="manage-blogs__media">
        <img src={item.post.coverImage} alt="" loading="lazy" />
      </div>

      <div className="manage-blogs__main">
        <div className="manage-blogs__heading">
          <h2 className="manage-blogs__title">
            <Link to={`${basePath}/blog/${item.post.slug}`}>{title}</Link>
          </h2>
          <span
            className={
              item.source === "Firestore"
                ? "admin-badge"
                : "admin-badge manage-blogs__badge--repo"
            }
          >
            {item.source}
          </span>
        </div>

        <p className="manage-blogs__meta">
          <span>{item.post.category}</span>
          <span>{date || "Undated"}</span>
          <span>{item.post.readingTime} min read</span>
          {item.post.tags.length > 0 && (
            <span>{item.post.tags.map((tag) => `#${tag}`).join(" ")}</span>
          )}
        </p>

        {item.source === "Repository" && (
          <p className="manage-blogs__readonly">
            A repository article — editable by committing the file.
          </p>
        )}
      </div>

      <div className="manage-blogs__actions">
        <Link
          to={`${basePath}/blog/${item.post.slug}`}
          className="btn btn--outline btn--sm"
        >
          View
        </Link>
        {item.record && (
          <>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={() => onEdit(item)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn--outline btn--sm manage-blogs__danger"
              onClick={() => onDelete(item)}
            >
              Delete
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* The inline editor -------------------------------------------------------- */

function BlogEditor({
  item,
  workspaceId,
  onCancel,
  onSaved,
}: {
  item: ManagedBlog;
  workspaceId: string;
  onCancel: () => void;
  onSaved: (message: string) => void;
}) {
  const record = item.record;

  const [draft, setDraft] = useState<BlogDraft>(() =>
    record ? draftFromRecord(record) : { title: "", category: "", excerpt: "", tags: "", content: "" },
  );
  const [errors, setErrors] = useState<DraftErrors>({});
  const [imageChange, setImageChange] = useState<ImageChange>({ kind: "keep" });
  const [imageError, setImageError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ name: string; url: string } | null>(
    null,
  );
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | null>(null);

  const headingId = useId();
  const titleId = useId();
  const categoryId = useId();
  const excerptId = useId();
  const tagsId = useId();
  const contentId = useId();
  const imageId = useId();

  useEffect(() => {
    // The editor opens under the row the admin clicked, so the title is the
    // first thing keyboard focus should reach.
    titleRef.current?.focus();
  }, []);

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

    if (fileRef.current) fileRef.current.value = "";
  }

  function update(key: keyof BlogDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) return;

    const problem = imageRuleMessage(file);

    setImageError(problem);

    if (problem) {
      clearPreview();
      setImageChange({ kind: "keep" });
      return;
    }

    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);

    const url = URL.createObjectURL(file);

    previewUrl.current = url;
    setPreview({ name: file.name, url });
    setImageChange({ kind: "replace", file });
  }

  function removeImage() {
    clearPreview();
    setImageError(null);
    setImageChange({ kind: "remove" });
  }

  function keepCurrentImage() {
    clearPreview();
    setImageError(null);
    setImageChange({ kind: "keep" });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!record) return;

    const found = validateDraft(draft);
    const problem =
      imageChange.kind === "replace"
        ? imageRuleMessage(imageChange.file)
        : null;

    setErrors(found);
    setImageError(problem);

    if (Object.keys(found).length > 0 || problem) {
      setStatus("Nothing was saved — fix the fields marked below.");
      return;
    }

    setSaving(true);
    setStatus(
      imageChange.kind === "replace"
        ? "Uploading the new image, then saving…"
        : "Saving the changes…",
    );

    const outcome = await updateBlogPost(
      workspaceId,
      record,
      draft,
      imageChange,
    );

    setSaving(false);

    if (!outcome.ok) {
      setStatus(outcome.message);
      return;
    }

    onSaved("The post was updated in Firestore.");
  }

  const current = record ? currentImage(record) : { url: "", path: "" };
  const hasImage = Boolean(current.url) && imageChange.kind !== "remove";
  const categories = CATEGORIES.includes(draft.category)
    ? CATEGORIES
    : [draft.category, ...CATEGORIES];

  return (
    <form
      className="admin-form manage-blogs__editor"
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby={headingId}
    >
      <h3 className="admin-block__title" id={headingId}>
        Edit “{item.post.title}”
      </h3>

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
            ref={titleRef}
            className="admin-field__input"
            type="text"
            autoComplete="off"
            value={draft.title}
            aria-invalid={errors.title ? true : undefined}
            aria-describedby={errors.title ? `${titleId}-error` : undefined}
            onChange={(event) => update("title", event.target.value)}
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
        <div
          className="admin-field__control"
          data-invalid={errors.category ? "true" : undefined}
        >
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
            {categories.map((category) => (
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

      <fieldset className="manage-blogs__image">
        <legend className="admin-field__label">
          {hasImage ? "Replace image" : "Add image"}
        </legend>

        <div className="manage-blogs__image-preview">
          {imageChange.kind === "replace" && preview ? (
            <>
              <img src={preview.url} alt="Preview of the new cover" />
              <span className="manage-blogs__image-name">{preview.name}</span>
            </>
          ) : imageChange.kind === "remove" ? (
            <p className="admin-field__hint">
              The cover will be removed when you save.
            </p>
          ) : current.url ? (
            <img src={item.post.coverImage} alt="Current cover" />
          ) : (
            <p className="admin-field__hint">No featured image yet.</p>
          )}
        </div>

        <input
          id={imageId}
          ref={fileRef}
          className="manage-blogs__file-input"
          type="file"
          accept="image/*"
          aria-label={hasImage ? "Replace image" : "Add image"}
          aria-describedby={`${imageId}-hint`}
          onChange={chooseImage}
        />
        <p className="admin-field__hint" id={`${imageId}-hint`}>
          Choose a file to add or replace the cover — PNG, JPEG, WebP, GIF, AVIF
          or SVG, up to {IMAGE_LIMIT}. It uploads through the admin-gated
          function.
        </p>
        {imageError && (
          <p className="admin-field__error" role="alert">
            {imageError}
          </p>
        )}

        <div className="manage-blogs__image-actions">
          {hasImage && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={removeImage}
            >
              Remove image
            </button>
          )}
          {imageChange.kind !== "keep" && (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={keepCurrentImage}
            >
              Keep current image
            </button>
          )}
        </div>
      </fieldset>

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
            onChange={(event) => update("excerpt", event.target.value)}
          />
        </div>
        <p className="admin-field__hint" id={`${excerptId}-hint`}>
          One line for listings. Empty means the opening of the content is used.
        </p>
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
            onChange={(event) => update("tags", event.target.value)}
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
              errors.content ? `${contentId}-error` : undefined
            }
            onChange={(event) => update("content", event.target.value)}
          />
        </div>
        {errors.content && (
          <p className="admin-field__error" id={`${contentId}-error`} role="alert">
            {errors.content}
          </p>
        )}
      </div>

      <div className="manage-blogs__editor-actions">
        <button type="submit" className="btn btn--primary" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          className="btn btn--outline"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
      </div>

      <p className="admin-form__status" role="status" aria-live="polite">
        {status}
      </p>
    </form>
  );
}

/* The page ----------------------------------------------------------------- */

export function ManageBlogs({
  workspaceId = SITE_WORKSPACE_ID,
  basePath = "",
  includeRepository = true,
}: ManageBlogsProps = {}) {
  const { records, status, reload } = useSavedBlogs(workspaceId);

  // A confirmed delete must leave the list immediately, even if the re-read
  // that follows is slow or fails; the id stays hidden for this session.
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const items = useMemo(
    () =>
      managedBlogs(
        includeRepository ? getLatestPosts() : [],
        records,
      ).filter(
        (item) => !item.record || !removedIds.includes(item.record.id),
      ),
    [includeRepository, records, removedIds],
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  const confirmLabelId = useId();

  const editing = items.find(
    (item) => item.record !== null && item.record.id === editingId,
  );
  const confirming = items.find(
    (item) => item.record !== null && item.record.id === confirmId,
  );

  const savedCount = items.filter((item) => item.source === "Firestore").length;
  const repositoryCount = items.length - savedCount;
  const empty = status === "ready" && items.length === 0;

  function startEdit(item: ManagedBlog) {
    if (!item.record) return;

    setEditingId(item.record.id);
    setConfirmId(null);
    setMessage("");
  }

  function startDelete(item: ManagedBlog) {
    if (!item.record) return;

    setConfirmId(item.record.id);
    setEditingId(null);
    setMessage("");
  }

  async function confirmDelete(item: ManagedBlog) {
    const record = item.record;

    if (!record) return;

    setDeleting(true);
    setMessage("Deleting the post…");

    const outcome = await deleteBlogPost(workspaceId, record);

    setDeleting(false);
    setConfirmId(null);

    if (!outcome.ok) {
      setMessage(outcome.message);
      return;
    }

    setEditingId(null);
    setRemovedIds((current) => [...current, record.id]);
    setMessage(`Deleted “${item.post.title}” from Firestore.`);
    reload();
  }

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <h1 className="admin-panel__title">
          {includeRepository ? "Manage blogs" : "Posts"}
        </h1>
        <p className="admin-panel__count">
          {savedCount} {savedCount === 1 ? "saved post" : "saved posts"}
          {includeRepository && (
            <> · {repositoryCount} in the repository</>
          )}
        </p>
      </header>
      <p className="admin-panel__lead">
        {includeRepository ? (
          <>
            Every written post, newest first. A post saved in Firestore can be
            edited, given a new cover or deleted here — the change is written to
            the same document the site reads. Repository articles are changed by
            committing their file.
          </>
        ) : (
          <>
            Every post this site has published, newest first. Edit it, give it a
            new cover, or delete it here — the change is written to this
            site&apos;s own workspace and appears on its public pages on the next
            read.
          </>
        )}
      </p>

      {status === "loading" && (
        <p className="admin-form__status" role="status" aria-live="polite">
          Loading saved posts…
        </p>
      )}
      {status === "error" && (
        <p className="manage-blogs__notice" role="status" aria-live="polite">
          The saved posts could not be loaded
          {includeRepository ? ", so only repository articles are shown" : ""}.
          Check the connection, then reload the page.
        </p>
      )}

      <p className="admin-form__status" role="status" aria-live="polite">
        {message}
      </p>

      {empty && (
        <div className="dashboard__empty" role="status">
          <h2 className="dashboard__empty-title">No posts yet</h2>
          <p>
            This site has not published anything. Write the first post from the
            site admin.
          </p>
        </div>
      )}

      <ul className="manage-blogs">
        {items.map((item) => {
          const recordId = item.record?.id ?? null;
          const isEditing = recordId !== null && recordId === editingId;
          const isConfirming = recordId !== null && recordId === confirmId;

          return (
            <li className="manage-blogs__item" key={recordId ?? item.post.slug}>
              <ManagedBlogRow
                item={item}
                basePath={basePath}
                onEdit={startEdit}
                onDelete={startDelete}
              />

              {isEditing && editing && (
                <BlogEditor
                  key={recordId}
                  item={editing}
                  workspaceId={workspaceId}
                  onCancel={() => setEditingId(null)}
                  onSaved={(saved) => {
                    setEditingId(null);
                    setMessage(saved);
                    reload();
                  }}
                />
              )}

              {isConfirming && confirming?.record && (
                <div
                  className="manage-blogs__confirm"
                  role="group"
                  aria-labelledby={confirmLabelId}
                >
                  <p id={confirmLabelId}>
                    Delete “{confirming.post.title}” permanently? The Firestore
                    document and its cover image are removed. This cannot be
                    undone.
                  </p>
                  <div className="manage-blogs__confirm-actions">
                    <button
                      type="button"
                      className="btn btn--sm manage-blogs__danger"
                      onClick={() => confirmDelete(confirming)}
                      disabled={deleting}
                    >
                      {deleting ? "Deleting…" : "Delete permanently"}
                    </button>
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => setConfirmId(null)}
                      disabled={deleting}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="admin-note">
        <strong>Live on save.</strong> A post in this workspace&apos;s{" "}
        <code>blogs</code> collection is published content (R37). Editing or
        deleting it here updates that document directly, so the site home, the{" "}
        <Link to={`${basePath}/blog`}>blog archive</Link> and the article page
        show the change on their next read. The site&apos;s owner or an editor
        may write here; the platform admin may write to every site. That is
        enforced by <code>firestore.rules</code> and the image function rather
        than by this page.
      </p>
    </section>
  );
}
