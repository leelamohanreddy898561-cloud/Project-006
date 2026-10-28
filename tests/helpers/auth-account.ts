import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * R29 — test support for the real Firebase project.
 *
 * The end-to-end sign-up test creates a genuine account, because a mocked
 * provider would not prove that authentication works live. That account must
 * not survive the run, so it is deleted through the same public REST API the
 * SDK uses, using the API key that already ships in the client bundle.
 *
 * No secret is involved: `VITE_FIREBASE_API_KEY` is public by design and is
 * read from the git-ignored `.env`, never from source.
 */

export interface TestProject {
  apiKey: string;
  projectId: string;
}

const IDENTITY = "https://identitytoolkit.googleapis.com/v1/accounts";
const FIRESTORE = "https://firestore.googleapis.com/v1/projects";

/** R45 — the token and uid a throwaway tenant needs for its REST writes. */
export interface TestSession {
  idToken: string;
  localId: string;
}

export function readProject(): TestProject | null {
  try {
    const raw = readFileSync(path.resolve(".env"), "utf8");
    const env: Record<string, string> = {};

    for (const line of raw.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
    }

    const apiKey = env.VITE_FIREBASE_API_KEY;
    const projectId = env.VITE_FIREBASE_PROJECT_ID;

    return apiKey && projectId ? { apiKey, projectId } : null;
  } catch {
    return null;
  }
}

/** A fresh address per run, on a reserved domain. */
export function uniqueEmail(): string {
  const stamp = Date.now().toString(36);
  const noise = Math.random().toString(36).slice(2, 8);

  return `r29-test-${stamp}-${noise}@example.com`;
}

/**
 * R45 — creates a real throwaway account and returns its session.
 *
 * The workspace cases need an account that owns a workspace, which the suite
 * cannot create through the admin UI (that needs a console-promoted role). The
 * public sign-up endpoint is the same one the sign-up page uses, so the account
 * and everything it writes is subject to the deployed rules.
 */
export async function signUpTestAccount(
  project: TestProject,
  email: string,
  password: string,
): Promise<TestSession | null> {
  const response = await fetch(`${IDENTITY}:signUp?key=${project.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  if (!response.ok) return null;

  const data = (await response.json()) as {
    idToken?: string;
    localId?: string;
  };

  return data.idToken && data.localId
    ? { idToken: data.idToken, localId: data.localId }
    : null;
}

/** The same sign-in the browser page performs, for a REST-only session. */
export async function signInTestAccount(
  project: TestProject,
  email: string,
  password: string,
): Promise<TestSession | null> {
  const response = await fetch(
    `${IDENTITY}:signInWithPassword?key=${project.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );

  if (!response.ok) return null;

  const data = (await response.json()) as {
    idToken?: string;
    localId?: string;
  };

  return data.idToken && data.localId
    ? { idToken: data.idToken, localId: data.localId }
    : null;
}

function documentUrl(project: TestProject, path: string): string {
  return `${FIRESTORE}/${project.projectId}/databases/(default)/documents/${path}`;
}

/**
 * R45 — writes one Firestore document through the deployed rules.
 *
 * `fields` is the REST `Value` shape (`{ stringValue: "..." }`), so a test can
 * write exactly the document the product writes.
 */
export async function writeTestDocument(
  project: TestProject,
  token: string,
  path: string,
  fields: Record<string, unknown>,
): Promise<boolean> {
  const response = await fetch(documentUrl(project, path), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  return response.ok;
}

/** The ids directly under one collection, for cleanup. */
export async function listTestDocuments(
  project: TestProject,
  token: string,
  path: string,
): Promise<string[]> {
  const response = await fetch(documentUrl(project, path), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) return [];

  const data = (await response.json()) as {
    documents?: Array<{ name: string }>;
  };

  return (data.documents ?? [])
    .map((document) => document.name.split("/").pop() ?? "")
    .filter(Boolean);
}

/** Deletes one document; a document that is already gone is not a failure. */
export async function deleteTestDocument(
  project: TestProject,
  token: string,
  path: string,
): Promise<boolean> {
  const response = await fetch(documentUrl(project, path), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  return response.ok || response.status === 404;
}

/** True when the account still exists (used to prove cleanup worked). */
export async function accountExists(
  project: TestProject,
  email: string,
  password: string,
): Promise<boolean> {
  const response = await fetch(`${IDENTITY}:signInWithPassword?key=${project.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  return response.ok;
}

/** Signs in to obtain an id token, then deletes the account. */
export async function deleteTestAccount(
  project: TestProject,
  email: string,
  password: string,
): Promise<boolean> {
  const signIn = await fetch(`${IDENTITY}:signInWithPassword?key=${project.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const credentials = (await signIn.json()) as { idToken?: string };

  if (!credentials.idToken) return false;

  const deletion = await fetch(`${IDENTITY}:delete?key=${project.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken: credentials.idToken }),
  });

  return deletion.ok;
}

/**
 * R31 — removes the users/{uid} profile while the account can still sign in.
 * Must run before deleteTestAccount. Uses the Firestore REST API with the same
 * public API key; the owner-delete rule permits it.
 */
export async function deleteTestProfile(
  project: TestProject,
  email: string,
  password: string,
): Promise<boolean> {
  const signIn = await fetch(`${IDENTITY}:signInWithPassword?key=${project.apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });

  const credentials = (await signIn.json()) as {
    idToken?: string;
    localId?: string;
  };

  if (!credentials.idToken || !credentials.localId) return false;

  const url =
    `https://firestore.googleapis.com/v1/projects/${project.projectId}` +
    `/databases/(default)/documents/users/${credentials.localId}`;

  const deletion = await fetch(url, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${credentials.idToken}` },
  });

  return deletion.ok || deletion.status === 404;
}
