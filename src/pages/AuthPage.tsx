import { useEffect, useId, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  EyeIcon,
  EyeOffIcon,
  GoogleIcon,
  MailIcon,
} from "../components/icons";
import {
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "../lib/auth";
import "./AuthPage.css";

export type AuthMode = "signin" | "signup";

const COPY = {
  signin: {
    title: "Welcome back",
    subtitle: "Sign in to pick up where you left off.",
    submit: "Sign in",
    passwordPlaceholder: "Your password",
    passwordAutoComplete: "current-password",
    alternatePrompt: "New to AI Pulse?",
    alternateLabel: "Create an account",
    alternateTo: "/signup",
    documentTitle: "Sign in — AI Pulse",
  },
  signup: {
    title: "Create your account",
    subtitle: "Save articles, follow topics, and join the discussion.",
    submit: "Create account",
    passwordPlaceholder: "At least 8 characters",
    passwordAutoComplete: "new-password",
    alternatePrompt: "Already have an account?",
    alternateLabel: "Sign in",
    alternateTo: "/signin",
    documentTitle: "Create your account — AI Pulse",
  },
} as const;

/** Deliberately permissive: the real check is the provider's, not ours. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD_LENGTH = 8;

type FieldErrors = {
  email?: string;
  password?: string;
};

/**
 * R24 — sign in / sign up.
 *
 * UI only. Every authentication call goes through `src/lib/auth.ts`, which
 * currently reports that nothing is connected; these pages never pretend
 * otherwise. Validation, focus handling and announcements are real.
 */
export function AuthPage({ mode }: { mode: AuthMode }) {
  const copy = COPY[mode];

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  const emailId = useId();
  const passwordId = useId();
  const emailErrorId = `${emailId}-error`;
  const passwordErrorId = `${passwordId}-error`;

  // R24.3 — per-page title, restored when leaving.
  useEffect(() => {
    const previous = document.title;
    document.title = copy.documentTitle;
    return () => {
      document.title = previous;
    };
  }, [copy.documentTitle]);

  function validate(): FieldErrors {
    const found: FieldErrors = {};
    const trimmed = email.trim();

    if (!trimmed) {
      found.email = "Enter your email address.";
    } else if (!EMAIL_PATTERN.test(trimmed)) {
      found.email = "Enter a valid email address, like name@example.com.";
    }

    if (!password) {
      found.password = "Enter your password.";
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      found.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }

    return found;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const found = validate();
    setErrors(found);

    if (found.email || found.password) {
      setStatus("");
      return;
    }

    setPending(true);
    setStatus("");

    const outcome =
      mode === "signin"
        ? await signInWithEmail(email.trim(), password)
        : await signUpWithEmail(email.trim(), password);

    setPending(false);
    setStatus(
      outcome.ok
        ? mode === "signin"
          ? "Signed in."
          : "Account created."
        : outcome.message,
    );
  }

  async function handleGoogle() {
    setPending(true);
    setStatus("");

    const outcome = await signInWithGoogle();

    setPending(false);
    setStatus(outcome.ok ? "Signed in with Google." : outcome.message);
  }

  return (
    <div className="auth">
      {/* R24.5–R24.6 — decorative gradient glows, hidden from assistive tech. */}
      <div className="auth__glow auth__glow--indigo" aria-hidden="true" />
      <div className="auth__glow auth__glow--cyan" aria-hidden="true" />
      <div className="auth__glow auth__glow--violet" aria-hidden="true" />

      <div className="auth__inner container">
        <section className="auth-card" aria-labelledby="auth-heading">
          <p className="auth-card__brand">AI Pulse</p>
          <h1 className="auth-card__title" id="auth-heading">
            {copy.title}
          </h1>
          <p className="auth-card__subtitle">{copy.subtitle}</p>

          <button
            type="button"
            className="auth-card__google"
            onClick={handleGoogle}
            disabled={pending}
          >
            <GoogleIcon size={18} />
            <span>Sign in with Google</span>
          </button>

          <div className="auth-card__divider">
            <span>or continue with email</span>
          </div>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label className="auth-field__label" htmlFor={emailId}>
                Email
              </label>
              <div
                className="auth-field__control"
                data-invalid={errors.email ? "true" : undefined}
              >
                <span className="auth-field__icon" aria-hidden="true">
                  <MailIcon size={16} />
                </span>
                <input
                  id={emailId}
                  className="auth-field__input"
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  aria-invalid={errors.email ? true : undefined}
                  aria-describedby={errors.email ? emailErrorId : undefined}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (errors.email) {
                      setErrors((current) => ({
                        ...current,
                        email: undefined,
                      }));
                    }
                  }}
                />
              </div>
              {errors.email && (
                <p className="auth-field__error" id={emailErrorId} role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="auth-field">
              <label className="auth-field__label" htmlFor={passwordId}>
                Password
              </label>
              <div
                className="auth-field__control"
                data-invalid={errors.password ? "true" : undefined}
              >
                <input
                  id={passwordId}
                  className="auth-field__input"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete={copy.passwordAutoComplete}
                  placeholder={copy.passwordPlaceholder}
                  value={password}
                  aria-invalid={errors.password ? true : undefined}
                  aria-describedby={
                    errors.password ? passwordErrorId : undefined
                  }
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (errors.password) {
                      setErrors((current) => ({
                        ...current,
                        password: undefined,
                      }));
                    }
                  }}
                />
                <button
                  type="button"
                  className="auth-field__toggle"
                  aria-pressed={showPassword}
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
                </button>
              </div>
              {errors.password && (
                <p
                  className="auth-field__error"
                  id={passwordErrorId}
                  role="alert"
                >
                  {errors.password}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="btn btn--primary auth-form__submit"
              disabled={pending}
            >
              {copy.submit}
            </button>
          </form>

          <p className="auth-card__status" role="status" aria-live="polite">
            {status}
          </p>

          <p className="auth-card__switch">
            {copy.alternatePrompt}{" "}
            <Link to={copy.alternateTo}>{copy.alternateLabel}</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
