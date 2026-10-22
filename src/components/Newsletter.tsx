import { useId, useState, type FormEvent } from "react";
import { MailIcon } from "./icons";
import "./Newsletter.css";

/** Pragmatic email shape check — deliberately not RFC 5322. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Status = "idle" | "error" | "success";

/**
 * R20.1–R20.4 — newsletter subscription box shown directly above the footer.
 *
 * The confirmation is client-side only: there is no mailing list behind it yet.
 * Writing subscriber emails anywhere needs a backend plus locked-down Firestore
 * rules, so this deliberately stores nothing.
 */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const fieldId = useId();
  const messageId = `${fieldId}-message`;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = email.trim();

    if (!EMAIL_PATTERN.test(value)) {
      setStatus("error");
      setMessage(
        "Enter a valid email address — for example, reader@example.com.",
      );
      return;
    }

    setStatus("success");
    setMessage(`Thanks — ${value} is on the list. Check your inbox to confirm.`);
    setEmail("");
  }

  function handleChange(value: string) {
    setEmail(value);
    if (status !== "idle") {
      setStatus("idle");
      setMessage("");
    }
  }

  return (
    <section className="newsletter" aria-labelledby="newsletter-heading">
      <div className="container">
        <div className="newsletter__box">
          <div className="newsletter__copy">
            <h2 className="newsletter__title" id="newsletter-heading">
              Stay ahead of the AI curve
            </h2>
            <p className="newsletter__text">
              One email a week — the releases, research, and tooling worth your
              attention. No noise, and you can unsubscribe at any time.
            </p>
          </div>

          <form className="newsletter__form" onSubmit={handleSubmit} noValidate>
            <label className="newsletter__label" htmlFor={fieldId}>
              Email address
            </label>

            <div className="newsletter__row">
              <span className="newsletter__field">
                <MailIcon />
                <input
                  id={fieldId}
                  name="email"
                  type="email"
                  value={email}
                  autoComplete="email"
                  placeholder="you@example.com"
                  aria-invalid={status === "error"}
                  aria-describedby={message ? messageId : undefined}
                  onChange={(event) => handleChange(event.target.value)}
                />
              </span>

              <button type="submit" className="btn btn--primary">
                Subscribe
              </button>
            </div>

            <p
              className={`newsletter__message is-${status}`}
              id={messageId}
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
