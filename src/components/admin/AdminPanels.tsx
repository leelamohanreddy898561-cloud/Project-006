import { useId, useState, type ChangeEvent, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  formatDate,
  getCategories,
  getLatestPosts,
  getTags,
  slugify,
} from "../../data/posts";
import { useAuth } from "../../hooks/useAuth";
import "./AdminPanels.css";

/**
 * R32 — the four panels behind the admin dashboard sidebar.
 *
 * Two of them are honest about what the browser can actually do, because the
 * alternative is a control that lies:
 *
 *   - **Add New Blog** composes the markdown file a post really is, and says so.
 *     Committing that file is the publish step (R13 is not built), so the panel
 *     never claims a post went live.
 *   - **Manage Users** shows the signed-in account and the console steps. The
 *     committed rules let an account read only its own `users/{uid}` document
 *     and forbid a client from writing `role: "admin"` on it (R31.8), so there
 *     is no user list to render and no role change to offer.
 */

/* Overview ----------------------------------------------------------------- */

export function AdminOverview() {
  const posts = getLatestPosts();
  const featured = posts.filter((post) => post.featured).length;

  const stats = [
    { label: "Posts", value: posts.length },
    { label: "Topics", value: getCategories().length },
    { label: "Tags", value: getTags().length },
    { label: "Featured", value: featured },
  ];

  return (
    <section className="admin-panel">
      <h1 className="admin-panel__title">Dashboard</h1>
      <p className="admin-panel__lead">
        Everything published on AI Pulse, at a glance. Pick a section in the
        sidebar to work on it.
      </p>

      <dl className="admin-stats">
        {stats.map((stat) => (
          <div className="admin-stat" key={stat.label}>
            <dt>{stat.label}</dt>
            <dd>{stat.value}</dd>
          </div>
        ))}
      </dl>

      <section className="admin-block" aria-labelledby="admin-recent-heading">
        <h2 className="admin-block__title" id="admin-recent-heading">
          Recently published
        </h2>
        <ul className="admin-recent">
          {posts.slice(0, 3).map((post) => (
            <li className="admin-recent__item" key={post.slug}>
              <Link to={`/blog/${post.slug}`} className="admin-recent__title">
                {post.title}
              </Link>
              <span className="admin-recent__date">
                {formatDate(post.date)}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

/* All Blogs ---------------------------------------------------------------- */

export function AdminBlogs() {
  const posts = getLatestPosts();

  return (
    <section className="admin-panel">
      <header className="admin-panel__head">
        <h1 className="admin-panel__title">All blogs</h1>
        <p className="admin-panel__count">
          {posts.length} {posts.length === 1 ? "post" : "posts"}
        </p>
      </header>
      <p className="admin-panel__lead">
        Every post on the site, newest first. Open one to read it as a visitor
        does.
      </p>

      <ul className="admin-blogs">
        {posts.map((post) => (
          <li className="admin-blogs__row" key={post.slug}>
            <div className="admin-blogs__main">
              <Link
                to={`/blog/${post.slug}`}
                className="admin-blogs__title"
                aria-label={`Open ${post.title}`}
              >
                {post.title}
              </Link>
              <p className="admin-blogs__meta">
                <span className="admin-badge">{post.category}</span>
                <span>{formatDate(post.date)}</span>
                <span>{post.readingTime} min read</span>
                <span>{post.tags.map((tag) => `#${tag}`).join(" ")}</span>
              </p>
            </div>
            <Link
              to={`/blog/${post.slug}`}
              className="btn btn--outline btn--sm"
              aria-label={`View ${post.title}`}
            >
              View
            </Link>
          </li>
        ))}
      </ul>

      <p className="admin-note">
        Posts are markdown files in <code>content/posts/</code> with frontmatter,
        so editing one is a repository change rather than a form in the browser.
        Use <strong>Add New Blog</strong> to compose a new file.
      </p>
    </section>
  );
}

/* Add New Blog ------------------------------------------------------------- */

const CATEGORIES = getCategories();

type Draft = {
  title: string;
  category: string;
  tags: string;
  excerpt: string;
  body: string;
  featured: boolean;
};

type DraftErrors = {
  title?: string;
  category?: string;
  excerpt?: string;
  body?: string;
};

function quote(value: string): string {
  return value.replace(/"/g, '\\"');
}

/** Today, as the frontmatter `date` — the day the file is written. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * The file a post really is: R13.1 frontmatter plus the markdown body. This is
 * the whole reason the composer exists — it produces something a human can
 * commit, instead of pretending to save.
 */
function buildMarkdown(draft: Draft): string {
  const tags = draft.tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return [
    "---",
    `title: "${quote(draft.title.trim())}"`,
    `excerpt: "${quote(draft.excerpt.trim())}"`,
    `date: "${today()}"`,
    `category: "${quote(draft.category.trim())}"`,
    `tags: [${tags.map((tag) => `"${quote(tag)}"`).join(", ")}]`,
    `featured: ${draft.featured}`,
    "---",
    "",
    draft.body.trim(),
    "",
  ].join("\n");
}

export function AdminBlogEditor() {
  const [draft, setDraft] = useState<Draft>({
    title: "",
    category: CATEGORIES[0]?.name ?? "",
    tags: "",
    excerpt: "",
    body: "",
    featured: false,
  });
  const [errors, setErrors] = useState<DraftErrors>({});
  const [status, setStatus] = useState("");
  const [file, setFile] = useState<{ name: string; markdown: string } | null>(
    null,
  );

  const titleId = useId();
  const categoryId = useId();
  const tagsId = useId();
  const excerptId = useId();
  const bodyId = useId();

  function field(key: "title" | "category" | "tags" | "excerpt" | "body") {
    return {
      value: draft[key],
      onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { value } = event.target;
        setDraft((current) => ({ ...current, [key]: value }));
        setErrors((current) => ({ ...current, [key]: undefined }));
      },
    };
  }

  function validate(): DraftErrors {
    const found: DraftErrors = {};

    if (!draft.title.trim()) found.title = "Give the post a title.";
    if (!draft.category.trim()) found.category = "Choose a category.";
    if (!draft.excerpt.trim()) found.excerpt = "Write a one-line excerpt.";
    if (!draft.body.trim()) found.body = "Add the post body.";

    return found;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validate();
    setErrors(found);

    if (Object.keys(found).length > 0) {
      setStatus("");
      setFile(null);
      return;
    }

    const name = `${slugify(draft.title) || "untitled"}.md`;

    setFile({ name, markdown: buildMarkdown(draft) });
    setStatus(
      `Draft composed as ${name}. Copy it into content/posts/ and commit it — committing is the publish step, so nothing is live yet.`,
    );
  }

  async function handleCopy() {
    if (!file) return;

    try {
      await navigator.clipboard.writeText(file.markdown);
      setStatus(`Markdown for ${file.name} copied to the clipboard.`);
    } catch {
      setStatus(
        "The clipboard is unavailable — select the text above and copy it.",
      );
    }
  }

  return (
    <section className="admin-panel">
      <h1 className="admin-panel__title">Add new blog</h1>
      <p className="admin-panel__lead">
        Compose a post, then take the markdown it produces into the repository.
      </p>

      <form className="admin-form" onSubmit={handleSubmit} noValidate>
        <div className="admin-field">
          <label className="admin-field__label" htmlFor={titleId}>
            Title
          </label>
          <div
            className="admin-field__control"
            data-invalid={errors.title ? "true" : undefined}
          >
            <input
              id={titleId}
              className="admin-field__input"
              type="text"
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
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  category: event.target.value,
                }));
                setErrors((current) => ({ ...current, category: undefined }));
              }}
            >
              {CATEGORIES.map((category) => (
                <option key={category.slug} value={category.name}>
                  {category.name}
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
          <label className="admin-field__label" htmlFor={tagsId}>
            Tags
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
          <label className="admin-field__label" htmlFor={excerptId}>
            Excerpt
          </label>
          <div
            className="admin-field__control"
            data-invalid={errors.excerpt ? "true" : undefined}
          >
            <textarea
              id={excerptId}
              className="admin-field__input admin-field__input--area"
              rows={2}
              value={draft.excerpt}
              aria-invalid={errors.excerpt ? true : undefined}
              aria-describedby={
                errors.excerpt ? `${excerptId}-error` : undefined
              }
              onChange={field("excerpt").onChange}
            />
          </div>
          {errors.excerpt && (
            <p
              className="admin-field__error"
              id={`${excerptId}-error`}
              role="alert"
            >
              {errors.excerpt}
            </p>
          )}
        </div>

        <div className="admin-field">
          <label className="admin-field__label" htmlFor={bodyId}>
            Body
          </label>
          <div
            className="admin-field__control"
            data-invalid={errors.body ? "true" : undefined}
          >
            <textarea
              id={bodyId}
              className="admin-field__input admin-field__input--area"
              rows={9}
              value={draft.body}
              aria-invalid={errors.body ? true : undefined}
              aria-describedby={errors.body ? `${bodyId}-error` : undefined}
              onChange={field("body").onChange}
            />
          </div>
          {errors.body && (
            <p className="admin-field__error" id={`${bodyId}-error`} role="alert">
              {errors.body}
            </p>
          )}
        </div>

        <label className="admin-checkbox">
          <input
            type="checkbox"
            checked={draft.featured}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                featured: event.target.checked,
              }))
            }
          />
          <span>Feature this post on the home page</span>
        </label>

        <div>
          <button type="submit" className="btn btn--primary">
            Compose markdown
          </button>
        </div>

        <p className="admin-form__status" role="status" aria-live="polite">
          {status}
        </p>
      </form>

      {file && (
        <div className="admin-output">
          <p className="admin-output__file">
            Save as <code>{file.name}</code> in <code>content/posts/</code>
          </p>
          <pre className="admin-output__code">{file.markdown}</pre>
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={handleCopy}
          >
            Copy markdown
          </button>
        </div>
      )}

      <p className="admin-note">
        A post is a markdown file with frontmatter (R13.1). This composer writes
        that file for you; committing it to the repository is the publish step,
        so nothing here is live until it is committed.
      </p>
    </section>
  );
}

/* Manage Users ------------------------------------------------------------- */

const ROLE_NOTES = [
  {
    role: "admin",
    note: "Opens /admin and this dashboard.",
  },
  {
    role: "student",
    note: "The default role for a new account (R31.1).",
  },
  {
    role: "user",
    note: "A standard account, with no admin access.",
  },
] as const;

export function AdminUsers() {
  const { user } = useAuth();

  return (
    <section className="admin-panel">
      <h1 className="admin-panel__title">Manage users</h1>
      <p className="admin-panel__lead">
        Roles, and the one account the browser is allowed to read.
      </p>

      <div className="admin-card">
        <h2 className="admin-card__title">Your account</h2>
        <dl className="admin-account">
          <div className="admin-account__row">
            <dt>Email</dt>
            <dd>{user?.email ?? "Unknown account"}</dd>
          </div>
          <div className="admin-account__row">
            <dt>User ID</dt>
            <dd>{user?.uid ?? "Unknown"}</dd>
          </div>
          <div className="admin-account__row">
            <dt>Role</dt>
            <dd>
              <span className="admin-badge">admin</span>
            </dd>
          </div>
        </dl>
      </div>

      <div className="admin-note">
        <h2>Why there is no user list here</h2>
        <p>
          The committed rules let an account read, create, update and delete only
          its own <code>users/&#123;uid&#125;</code> document, and forbid a client
          from writing <code>role: "admin"</code> on it (R31.8). That is
          deliberate: a role is a permission, so it must not be grantable from
          the page it protects. Listing every account needs a privileged
          server-side path that does not exist yet.
        </p>
      </div>

      <div className="admin-note">
        <h2>Change a role</h2>
        <ol>
          <li>
            Open the Firebase console and go to <strong>Firestore Database</strong>.
          </li>
          <li>
            Open the <code>users</code> collection, then the document whose id is
            the account's user ID.
          </li>
          <li>
            Set <code>role</code> to <code>"admin"</code>,{" "}
            <code>"student"</code> or <code>"user"</code>.
          </li>
          <li>The account picks the change up on its next reload or sign-in.</li>
        </ol>
      </div>

      <div className="admin-block">
        <h2 className="admin-block__title">What each role can do</h2>
        <ul className="admin-roles">
          {ROLE_NOTES.map((entry) => (
            <li className="admin-roles__item" key={entry.role}>
              <span className="admin-badge">{entry.role}</span>
              <span>{entry.note}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* Unknown section ---------------------------------------------------------- */

export function AdminSectionMissing() {
  return (
    <section className="admin-panel">
      <h1 className="admin-panel__title">Section not found</h1>
      <p className="admin-panel__lead">
        That admin section does not exist. Pick one from the sidebar.
      </p>
      <Link to="/admin/dashboard" className="btn btn--primary">
        Back to the dashboard
      </Link>
    </section>
  );
}
