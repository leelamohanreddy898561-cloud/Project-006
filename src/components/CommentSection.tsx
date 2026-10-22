import { useId, useState, type FormEvent } from "react";
import "./CommentSection.css";

interface Comment {
  id: string;
  name: string;
  text: string;
  when: string;
}

const SEED_COMMENTS: Comment[] = [
  {
    id: "c-seed-1",
    name: "Priya N.",
    text: "The routing section finally made the trade-off click for me. Bookmarked.",
    when: "2 days ago",
  },
  {
    id: "c-seed-2",
    name: "Tom R.",
    text: "Would love a follow-up that walks through the memory budget numbers.",
    when: "5 days ago",
  },
];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * R23.14–R23.17 — comment section under the article.
 *
 * Comments live in component state only. Nothing is sent anywhere, and the
 * notice says so, because posting for real needs accounts and Firestore rules
 * that do not exist yet.
 */
export function CommentSection() {
  const [comments, setComments] = useState<Comment[]>(SEED_COMMENTS);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [announcement, setAnnouncement] = useState("");

  const nameId = useId();
  const textId = useId();
  const errorId = `${textId}-error`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !text.trim()) {
      setError("Add your name and a comment before posting.");
      return;
    }

    const comment: Comment = {
      id: `c-${Date.now()}`,
      name: name.trim(),
      text: text.trim(),
      when: "just now",
    };

    setComments((list) => [comment, ...list]);
    setAnnouncement(`Comment posted by ${comment.name}.`);
    setError("");
    setName("");
    setText("");
  }

  return (
    <section className="comments" aria-labelledby="comments-heading">
      <h2 className="comments__title" id="comments-heading">
        Comments <span className="comments__count">({comments.length})</span>
      </h2>

      <p className="comments__notice">
        Comments are held in this browser session only. Sign-in and permanent
        storage arrive with the account feature.
      </p>

      <form className="comments__form" onSubmit={handleSubmit} noValidate>
        <label className="comments__label" htmlFor={nameId}>
          Your name
        </label>
        <input
          id={nameId}
          className="comments__input"
          value={name}
          autoComplete="name"
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            setName(event.target.value);
            if (error) setError("");
          }}
        />

        <label className="comments__label" htmlFor={textId}>
          Comment
        </label>
        <textarea
          id={textId}
          className="comments__input comments__textarea"
          rows={4}
          value={text}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => {
            setText(event.target.value);
            if (error) setError("");
          }}
        />

        {error && (
          <p className="comments__error" id={errorId} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn--primary">
          Post comment
        </button>
      </form>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>

      <ol className="comments__list">
        {comments.map((comment) => (
          <li key={comment.id} className="comment">
            <div className="comment__head">
              <span className="comment__avatar" aria-hidden="true">
                {initials(comment.name)}
              </span>
              <span className="comment__name">{comment.name}</span>
              <span className="comment__when">{comment.when}</span>
            </div>
            <p className="comment__text">{comment.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
