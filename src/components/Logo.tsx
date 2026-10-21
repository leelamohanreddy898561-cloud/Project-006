import "./Logo.css";

/** R18.2 — glowing AI Pulse logo mark (pulse wave in a gradient badge). */
export function Logo() {
  return (
    <span className="logo" aria-hidden="true">
      <svg
        className="logo__svg"
        viewBox="0 0 32 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 17h5.5L11 9l4 14 3-8h2.5" />
        <circle cx="25" cy="17" r="2" fill="currentColor" stroke="none" />
      </svg>
    </span>
  );
}
