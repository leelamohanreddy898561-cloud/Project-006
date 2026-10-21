import { Link } from "react-router-dom";
import "./Placeholder.css";

type PlaceholderProps = {
  title: string;
  description: string;
};

/**
 * Temporary destination for routes whose full feature is not built yet
 * (R18.8). Every header link leads here rather than to a blank screen; each
 * is replaced by its real page as that requirement lands.
 */
export function Placeholder({ title, description }: PlaceholderProps) {
  return (
    <div className="container placeholder">
      <p className="placeholder__badge">Coming soon</p>
      <h1 className="placeholder__title">{title}</h1>
      <p className="placeholder__text">{description}</p>
      <Link to="/" className="btn btn--primary">
        Back to home
      </Link>
    </div>
  );
}
