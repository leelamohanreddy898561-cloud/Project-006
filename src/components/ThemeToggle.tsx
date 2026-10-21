import { useTheme } from "../hooks/useTheme";
import { MoonIcon, SunIcon } from "./icons";
import "./ThemeToggle.css";

/** R9 / R18 — dark/light mode toggle for the header. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const label = isDark ? "Switch to light theme" : "Switch to dark theme";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      data-theme-state={theme}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
