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
