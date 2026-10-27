import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { BlogCard } from "../components/BlogCard";
import { useWorkspaceSite } from "../components/WorkspaceContext";
import { useSavedBlogs } from "../hooks/useSavedBlogs";
import { mergePosts } from "../lib/blog-posts";
import { getLatestPosts } from "../data/posts";
import { DEFAULT_WORKSPACE_ID } from "../lib/workspaces";
import "./WorkspaceSite.css";

/**
 * R43 — a tenant's home page.
 *
 * It renders that workspace's posts and nothing else: a new workspace starts
 * empty, and the repository seed articles belong to the default site only. The
 * name and tagline come from the workspace document (`branding`), so the same
 * component renders a different company's site without a rebuild.
 */
export function WorkspaceHome() {
  const site = useWorkspaceSite();
  const workspaceId = site?.workspace.id;
  const saved = useSavedBlogs(workspaceId);

  const posts = useMemo(() => {
    const seed =
      workspaceId === DEFAULT_WORKSPACE_ID ? getLatestPosts() : [];

    return mergePosts(seed, saved.posts);
  }, [workspaceId, saved.posts]);

  const name = site?.workspace.branding.title || site?.workspace.name || "";
  const tagline = site?.workspace.branding.tagline ?? "";

  useEffect(() => {
    if (!name) return undefined;
    const previous = document.title;
    document.title = `${name} — AI Pulse`;
    return () => {
      document.title = previous;
    };
  }, [name]);

  if (!site) return null;

  return (
    <div className="container site-home">
      <header className="site-hero">
        <p className="site-hero__eyebrow">Latest writing</p>
        <h1 className="site-hero__title">{name}</h1>
        {tagline && <p className="site-hero__tagline">{tagline}</p>}
        <p className="site-hero__meta">
          <span role="status" aria-live="polite">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </span>
          {" · "}
          <Link to={`${site.basePath}/blog`} className="site-hero__link">
            Browse the archive
          </Link>
        </p>
      </header>

      {saved.status === "error" && (
        <p className="site-home__notice" role="status">
          This site&apos;s posts could not be loaded right now. Please try again
          shortly.
        </p>
      )}

      {posts.length > 0 ? (
        <div className="post-grid">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} showDate showTags />
          ))}
        </div>
      ) : (
        <div className="site-home__empty" role="status">
          <h2 className="site-home__empty-title">No posts yet</h2>
          <p>This site has not published anything. Check back soon.</p>
        </div>
      )}
    </div>
  );
}
