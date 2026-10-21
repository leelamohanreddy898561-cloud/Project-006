import { Link } from "react-router-dom";
import {
  QUICK_FILTERS,
  type QuickFilter,
  type TrendingTopic,
} from "../data/posts";
import { CloseIcon, FlameIcon, SearchIcon } from "./icons";
import "./Sidebar.css";

type SidebarProps = {
  topics: TrendingTopic[];
  query: string;
  onQueryChange: (value: string) => void;
  filter: QuickFilter;
  onFilterChange: (value: QuickFilter) => void;
  resultCount: number;
};

/** R19.9–R19.12 — discovery sidebar: trending topics, search, quick filters. */
export function Sidebar({
  topics,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  resultCount,
}: SidebarProps) {
  return (
    <aside className="sidebar" aria-label="Discover">
      <section className="sidebar__panel">
        <h2 className="sidebar__heading">Search</h2>
        <div className="sidebar__search">
          <SearchIcon />
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search articles…"
            aria-label="Search articles"
          />
          {query && (
            <button
              type="button"
              className="sidebar__search-clear"
              onClick={() => onQueryChange("")}
              aria-label="Clear search"
            >
              <CloseIcon size={12} />
            </button>
          )}
        </div>
        <p className="sidebar__count" role="status">
          {resultCount} {resultCount === 1 ? "article" : "articles"}
        </p>
      </section>

      <section className="sidebar__panel">
        <h2 className="sidebar__heading">Quick filters</h2>
        <div className="sidebar__filters" role="group" aria-label="Quick filters">
          {QUICK_FILTERS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={
                filter === option.id
                  ? "sidebar__filter is-active"
                  : "sidebar__filter"
              }
              aria-pressed={filter === option.id}
              onClick={() => onFilterChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </section>

      <section className="sidebar__panel">
        <h2 className="sidebar__heading">
          <FlameIcon />
          Trending topics
        </h2>
        <ol className="sidebar__topics">
          {topics.map((topic, index) => (
            <li key={topic.slug} className="sidebar__topic">
              <span className="sidebar__rank" aria-hidden="true">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Link to={`/topics/${topic.slug}`} className="sidebar__topic-name">
                #{topic.name}
              </Link>
              <span className="sidebar__topic-count">{topic.count}</span>
            </li>
          ))}
        </ol>
      </section>
    </aside>
  );
}
