import { createContext, useContext } from "react";
import type { Workspace } from "../lib/workspaces";

/**
 * R43 — the tenant a public page is rendering, if any.
 *
 * The provider is mounted only under `/w/:siteSlug`, so every other page sees
 * `null` and keeps the single-site behaviour it had. Components that build a
 * link (the article card) read `basePath` from here, which is what keeps a
 * visitor inside the tenant's site instead of dropping them onto the global
 * archive.
 *
 * This module deliberately imports nothing that touches Firebase: it is pulled
 * into the article card, which every page renders.
 */
export interface WorkspaceSiteValue {
  workspace: Workspace;
  /** "" on the global site; `/w/<slug>` inside a tenant. */
  basePath: string;
}

const WorkspaceSiteContext = createContext<WorkspaceSiteValue | null>(null);

export const WorkspaceSiteProvider = WorkspaceSiteContext.Provider;

export function useWorkspaceSite(): WorkspaceSiteValue | null {
  return useContext(WorkspaceSiteContext);
}
