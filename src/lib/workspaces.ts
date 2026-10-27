import { getFirebase, isFirebaseConfigured } from "./firebase";

/**
 * R41 — the tenant model.
 *
 * One **workspace** is one customer's blog. The document is the public
 * identity a visitor's page needs; the team and the billing state live in
 * subcollections that are not public:
 *
 *     workspaces/{workspaceId}          name, slug, ownerUid, branding
 *       members/{uid}                   role: "editor" | "viewer"
 *       private/{document}              plan and billing state
 *       blogs/{blogId}                  published posts (the existing BlogDocument)
 *
 * The owner is `ownerUid` on the workspace document — there is no "owner" member
 * document to forge — and `firestore.rules` enforces every rule in this file.
 * The browser-side helpers here are convenience and UI state; they grant nothing.
 *
 * R41 is additive: the live site still reads the flat `blogs` collection, and
 * nothing in the app calls this module yet. R42 wires onboarding and moves the
 * existing posts into the default workspace; R43 renders a workspace's public
 * site; R44 reads the plan from `private/`.
 */

export const WORKSPACES_COLLECTION = "workspaces";
export const MEMBERS_COLLECTION = "members";
export const PRIVATE_COLLECTION = "private";
export const BLOGS_COLLECTION = "blogs";

/** The workspace the existing single-tenant posts migrate into (R42). */
export const DEFAULT_WORKSPACE_ID = "signal-and-noise";
export const DEFAULT_WORKSPACE_NAME = "Signal & Noise";

/**
 * Fields that must never appear on the public workspace document — the rules
 * refuse a write that carries one. `private/` is where they belong.
 */
export const BILLING_FIELDS = [
  "plan",
  "planStatus",
  "stripeCustomerId",
  "stripeSubscriptionId",
] as const;

export type WorkspaceRole = "owner" | "editor" | "viewer";

const MEMBER_ROLES: readonly WorkspaceRole[] = ["editor", "viewer"];

export interface WorkspaceBranding {
  title: string;
  tagline: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerUid: string;
  branding: WorkspaceBranding;
  createdAt?: unknown;
}

export type WorkspaceOutcome =
  | { ok: true; workspace: Workspace | null }
  | { ok: false; message: string };

export type WorkspaceRoleOutcome =
  | { ok: true; role: WorkspaceRole | null }
  | { ok: false; message: string };

/**
 * Turns a stored member role into a known role, or null.
 *
 * Ownership is not a member document, so "owner" arriving from the members
 * collection is not a role this function accepts — the owner check reads
 * `workspaces/{id}.ownerUid`. An unknown value is never an editor.
 */
export function normalizeMemberRole(value: unknown): WorkspaceRole | null {
  return MEMBER_ROLES.includes(value as WorkspaceRole)
    ? (value as WorkspaceRole)
    : null;
}

/** The owner and an editor both write posts and replace covers. */
export function canEditWorkspace(role: WorkspaceRole | null): boolean {
  return role === "owner" || role === "editor";
}

/** Only the owner manages teammates, billing and the workspace itself. */
export function canManageWorkspace(role: WorkspaceRole | null): boolean {
  return role === "owner";
}

/**
 * A slug is what a public route will use, so it is derived once and validated
 * against the same shape `firestore.rules` enforces. The result can be shorter
 * than the minimum a create requires; callers must check `isWorkspaceSlug`.
 */
export function workspaceSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Mirrors `isSlug()` in `firestore.rules` — 3–60 chars, hyphen-joined words. */
export function isWorkspaceSlug(value: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value)
    && value.length >= 3
    && value.length <= 60;
}

/**
 * The public document shape. Billing fields are stripped rather than trusted:
 * the rules refuse them, and a caller that builds this object has nothing to
 * gain by adding one.
 */
export function buildWorkspaceDocument(input: {
  name: string;
  slug: string;
  ownerUid: string;
  branding?: Partial<WorkspaceBranding>;
}): Omit<Workspace, "id"> {
  return {
    name: input.name.trim(),
    slug: input.slug,
    ownerUid: input.ownerUid,
    branding: {
      title: input.branding?.title?.trim() || input.name.trim(),
      tagline: input.branding?.tagline?.trim() || "",
    },
  };
}

export function memberPath(workspaceId: string, uid: string): string {
  return `${WORKSPACES_COLLECTION}/${workspaceId}/${MEMBERS_COLLECTION}/${uid}`;
}

export function workspaceBlogsPath(workspaceId: string): string {
  return `${WORKSPACES_COLLECTION}/${workspaceId}/${BLOGS_COLLECTION}`;
}

/**
 * Reads the signed-in account's role in one workspace, or null when it has none.
 *
 * A failed read is reported as a failure rather than as "no role", so a caller
 * can fail closed without pretending the account was never a member. R42 will
 * use this where the admin guard uses `fetchUserRole` today.
 */
export async function fetchWorkspaceRole(
  workspaceId: string,
  uid: string,
): Promise<WorkspaceRoleOutcome> {
  if (!isFirebaseConfigured()) {
    return {
      ok: false,
      message:
        "Firebase is not configured — copy .env.example to .env and add the project values.",
    };
  }

  try {
    const [{ db }, { doc, getDoc }] = await Promise.all([
      getFirebase(),
      import("firebase/firestore"),
    ]);

    const [workspace, member] = await Promise.all([
      getDoc(doc(db, WORKSPACES_COLLECTION, workspaceId)),
      getDoc(doc(db, memberPath(workspaceId, uid))),
    ]);

    if (workspace.exists() && workspace.data().ownerUid === uid) {
      return { ok: true, role: "owner" };
    }

    return {
      ok: true,
      role: member.exists() ? normalizeMemberRole(member.data().role) : null,
    };
  } catch (error) {
    const detail = (error as { message?: string })?.message;

    return {
      ok: false,
      message: detail
        ? `The workspace role could not be read (${detail}).`
        : "The workspace role could not be read.",
    };
  }
}

/** Reads one workspace's public document. */
export async function fetchWorkspace(
  workspaceId: string,
): Promise<WorkspaceOutcome> {
  if (!isFirebaseConfigured()) {
    return {
      ok: false,
      message:
        "Firebase is not configured — copy .env.example to .env and add the project values.",
    };
  }

  try {
    const [{ db }, { doc, getDoc }] = await Promise.all([
      getFirebase(),
      import("firebase/firestore"),
    ]);

    const snapshot = await getDoc(
      doc(db, WORKSPACES_COLLECTION, workspaceId),
    );

    return { ok: true, workspace: snapshot.exists() ? toWorkspace(snapshot) : null };
  } catch (error) {
    const detail = (error as { message?: string })?.message;

    return {
      ok: false,
      message: detail
        ? `The workspace could not be read (${detail}).`
        : "The workspace could not be read.",
    };
  }
}

/** One Firestore document as a `Workspace`, tolerant of missing fields. */
function toWorkspace(snapshot: {
  id: string;
  data: () => Record<string, unknown>;
}): Workspace {
  const data = snapshot.data();

  return {
    id: snapshot.id,
    name: String(data.name ?? ""),
    slug: String(data.slug ?? ""),
    ownerUid: String(data.ownerUid ?? ""),
    branding: {
      title: String(
        (data.branding as { title?: unknown } | undefined)?.title ??
          data.name ??
          "",
      ),
      tagline: String(
        (data.branding as { tagline?: unknown } | undefined)?.tagline ?? "",
      ),
    },
    createdAt: data.createdAt,
  };
}

/**
 * R43 — the public site's lookup: a workspace by the slug in its address.
 *
 * The document id is tried first, because a workspace created with its slug as
 * the id is the common case (and a slug used as an id is unique by
 * construction). Otherwise the `slug` field is queried, which is what the
 * console-created workspaces in this project use. An unknown or malformed slug
 * is "no workspace", not an error, so a mistyped address renders a not-found
 * page rather than a failure notice.
 */
export async function fetchWorkspaceBySlug(
  slug: string,
): Promise<WorkspaceOutcome> {
  if (import.meta.env.DEV && window.__workspaceDocs) {
    return {
      ok: true,
      workspace:
        window.__workspaceDocs.find((workspace) => workspace.slug === slug) ??
        null,
    };
  }

  if (!isWorkspaceSlug(slug)) return { ok: true, workspace: null };

  if (!isFirebaseConfigured()) {
    return {
      ok: false,
      message:
        "Firebase is not configured — copy .env.example to .env and add the project values.",
    };
  }

  try {
    const [{ db }, { collection, doc, getDoc, getDocs, limit, query, where }] =
      await Promise.all([getFirebase(), import("firebase/firestore")]);

    const direct = await getDoc(doc(db, WORKSPACES_COLLECTION, slug));

    if (direct.exists()) {
      return { ok: true, workspace: toWorkspace(direct) };
    }

    const bySlug = await getDocs(
      query(
        collection(db, WORKSPACES_COLLECTION),
        where("slug", "==", slug),
        limit(1),
      ),
    );

    return {
      ok: true,
      workspace: bySlug.empty ? null : toWorkspace(bySlug.docs[0]),
    };
  } catch (error) {
    const detail = (error as { message?: string })?.message;

    return {
      ok: false,
      message: detail
        ? `The site could not be read (${detail}).`
        : "The site could not be read.",
    };
  }
}

declare global {
  interface Window {
    /**
     * R43 — dev-only workspace fixtures, so the suite can prove a tenant site
     * without reaching the live project. `import.meta.env.DEV` is false in a
     * production build, so neither global ships.
     */
    __workspaceDocs?: Workspace[];
  }
}
