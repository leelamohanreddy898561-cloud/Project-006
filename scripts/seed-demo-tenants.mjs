/**
 * R45 — creates the two demo tenant accounts.
 *
 * A tenant demo needs three things that only a real sign-in can prove: an
 * account, a workspace it owns, and a post in that workspace. This script makes
 * them through the same public APIs the browser uses — Auth's sign-up/sign-in
 * and the Firestore REST API — so every write is checked by the deployed rules.
 * It does not use the Admin SDK, which would bypass the boundary R41 built.
 *
 * It is idempotent: an account that already exists is signed in with the
 * password recorded in `.demo-tenants.json`, an existing workspace is left
 * alone unless it belongs to someone else (which is a hard error, never a
 * silent takeover), and an existing post is skipped.
 *
 * Credentials are written only to the git-ignored `.demo-tenants.json`. The
 * script never prints a password unless `--show-passwords` is passed, and the
 * file is never committed.
 *
 * Usage:
 *
 *     node --env-file=.env scripts/seed-demo-tenants.mjs
 *     node --env-file=.env scripts/seed-demo-tenants.mjs --show-passwords
 *
 * The Email/Password provider must be enabled in Firebase Console →
 * Authentication → Sign-in method; there is no code path around that.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";

const IDENTITY = "https://identitytoolkit.googleapis.com/v1/accounts";
const CREDENTIALS_FILE = ".demo-tenants.json";

/** The two demo customers. One site each, one post each. */
export const TENANTS = [
  {
    slug: "pine-and-pixel",
    name: "Pine & Pixel",
    tagline: "Design notes from a small studio.",
    email: "pine.pixel@project-006-demo.com",
    post: {
      id: "welcome-to-pine-and-pixel",
      title: "Welcome to Pine & Pixel",
      category: "Design",
      excerpt: "A small studio's notebook on type, colour and the space between.",
      tags: "studio, design, notes",
      content: [
        "Pine & Pixel is a small design studio, and this is its notebook.",
        "",
        "We write about the decisions behind a page: the type that carries a",
        "sentence, the colour that makes a button feel obvious, and the empty",
        "space that lets a reader breathe.",
        "",
        "This post is also a demonstration. It lives in this workspace's own",
        "`blogs` collection, and no other site can read or write it.",
      ].join("\n"),
    },
  },
  {
    slug: "orbit-analytics",
    name: "Orbit Analytics",
    tagline: "Making product data legible.",
    email: "orbit.analytics@project-006-demo.com",
    post: {
      id: "the-first-orbit-report",
      title: "The First Orbit Report",
      category: "Research",
      excerpt: "What a week of product data looks like when it is read carefully.",
      tags: "analytics, product, research",
      content: [
        "Orbit Analytics turns product events into a story a team can act on.",
        "",
        "The first report is deliberately small: one question, one cohort, one",
        "week. A dashboard that answers everything at once usually answers",
        "nothing, so we start with the question that changes a decision.",
        "",
        "Every post here belongs to this workspace and to no other tenant.",
      ].join("\n"),
    },
  },
];

/* Environment --------------------------------------------------------------- */

function readEnv() {
  let raw = "";

  try {
    raw = readFileSync(resolve(".env"), "utf8");
  } catch {
    throw new Error(
      "No .env file. Copy .env.example to .env and add the Firebase values.",
    );
  }

  const env = {};

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (match) env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }

  const apiKey = env.VITE_FIREBASE_API_KEY;
  const projectId = env.VITE_FIREBASE_PROJECT_ID;

  if (!apiKey || !projectId) {
    throw new Error(
      ".env must define VITE_FIREBASE_API_KEY and VITE_FIREBASE_PROJECT_ID.",
    );
  }

  return { apiKey, projectId };
}

/* Auth ---------------------------------------------------------------------- */

async function identity(path, apiKey, body) {
  const response = await fetch(`${IDENTITY}:${path}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data?.error?.message ?? `Auth request failed (${response.status}).`,
    );
    error.code = data?.error?.message ?? "";
    throw error;
  }

  return data;
}

const signUp = (apiKey, email, password) =>
  identity("signUp", apiKey, { email, password, returnSecureToken: true });

const signIn = (apiKey, email, password) =>
  identity("signInWithPassword", apiKey, {
    email,
    password,
    returnSecureToken: true,
  });

/** A generated password that satisfies the sign-up policy. */
function generatePassword() {
  return `Demo-${randomBytes(15).toString("base64url")}-9!`;
}

/* Firestore REST ------------------------------------------------------------ */

function documentUrl(projectId, path) {
  return (
    `https://firestore.googleapis.com/v1/projects/${projectId}` +
    `/databases/(default)/documents/${path}`
  );
}

async function readDocument(projectId, token, path) {
  const response = await fetch(documentUrl(projectId, path), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 404) return null;

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Reading ${path} failed (${response.status})${body ? `: ${body}` : ""}`,
    );
  }

  return response.json();
}

/** `PATCH` without an update mask replaces the whole document. */
async function writeDocument(projectId, token, path, fields) {
  const response = await fetch(documentUrl(projectId, path), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Writing ${path} failed (${response.status})${body ? `: ${body}` : ""}`,
    );
  }

  return response.json();
}

const stringValue = (value) => ({ stringValue: value });
const integerValue = (value) => ({ integerValue: String(value) });
const timestampValue = (value) => ({ timestampValue: value });

function mapValue(fields) {
  return { mapValue: { fields } };
}

function arrayValue(values) {
  return { arrayValue: { values: values.map(stringValue) } };
}

/* Seeding ------------------------------------------------------------------- */

function readCredentials() {
  if (!existsSync(resolve(CREDENTIALS_FILE))) return { tenants: [] };

  try {
    return JSON.parse(readFileSync(resolve(CREDENTIALS_FILE), "utf8"));
  } catch {
    return { tenants: [] };
  }
}

function saveCredentials(record) {
  writeFileSync(
    resolve(CREDENTIALS_FILE),
    `${JSON.stringify(record, null, 2)}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
}

/** Signs in, or signs up when the account does not exist yet. */
async function credentialsFor(apiKey, tenant, previous) {
  if (previous?.password) {
    try {
      const session = await signIn(apiKey, tenant.email, previous.password);
      return { session, password: previous.password, created: false };
    } catch (error) {
      if (error.code !== "EMAIL_NOT_FOUND") throw error;
      // The recorded account was deleted: fall through and make it again.
    }
  }

  const password = previous?.password || generatePassword();

  try {
    const session = await signUp(apiKey, tenant.email, password);
    return { session, password, created: true };
  } catch (error) {
    if (error.code === "EMAIL_EXISTS") {
      throw new Error(
        `${tenant.email} already exists but ${CREDENTIALS_FILE} has no password for it. ` +
          "Delete that Auth account in the console, or restore the file, then run again.",
      );
    }

    throw error;
  }
}

async function seedTenant(projectId, apiKey, tenant, previous) {
  const { session, password, created } = await credentialsFor(
    apiKey,
    tenant,
    previous,
  );

  const { idToken, localId: uid } = session;

  // The profile the app reads a role from. New accounts are ordinary users;
  // the rules refuse `role: "admin"` from the browser, which is the point.
  const profile = await readDocument(projectId, idToken, `users/${uid}`);

  if (!profile) {
    await writeDocument(projectId, idToken, `users/${uid}`, {
      email: stringValue(tenant.email),
      role: stringValue("student"),
      createdAt: timestampValue(new Date().toISOString()),
    });
  }

  // The workspace. The slug is the document id, so the public route resolves it
  // on the first lookup without a query.
  const existing = await readDocument(
    projectId,
    idToken,
    `workspaces/${tenant.slug}`,
  );

  if (existing) {
    const ownerUid = existing.fields?.ownerUid?.stringValue ?? "";

    if (ownerUid !== uid) {
      throw new Error(
        `workspaces/${tenant.slug} already exists and is owned by ${ownerUid || "(nobody)"}, ` +
          `not by ${tenant.email} (${uid}). Pick another slug or remove that document.`,
      );
    }
  } else {
    await writeDocument(projectId, idToken, `workspaces/${tenant.slug}`, {
      name: stringValue(tenant.name),
      slug: stringValue(tenant.slug),
      ownerUid: stringValue(uid),
      branding: mapValue({
        title: stringValue(tenant.name),
        tagline: stringValue(tenant.tagline),
      }),
      createdAt: timestampValue(new Date().toISOString()),
    });
  }

  // One post, written by the owner through the same rules the composer uses.
  const postPath = `workspaces/${tenant.slug}/blogs/${tenant.post.id}`;
  const postExists = await readDocument(projectId, idToken, postPath);

  if (!postExists) {
    await writeDocument(projectId, idToken, postPath, {
      title: stringValue(tenant.post.title),
      slug: stringValue(tenant.post.id),
      category: stringValue(tenant.post.category),
      excerpt: stringValue(tenant.post.excerpt),
      tags: arrayValue(tenant.post.tags.split(",").map((tag) => tag.trim())),
      content: stringValue(tenant.post.content),
      imageUrl: stringValue(""),
      imagePath: stringValue(""),
      readingTime: integerValue(1),
      authorName: stringValue(tenant.name),
      authorUid: stringValue(uid),
      createdAt: timestampValue(new Date().toISOString()),
    });
  }

  return {
    slug: tenant.slug,
    name: tenant.name,
    email: tenant.email,
    password,
    uid,
    accountCreated: created,
    workspaceCreated: !existing,
    postCreated: !postExists,
    url: `/w/${tenant.slug}`,
    adminUrl: `/w/${tenant.slug}/admin`,
  };
}

/* Entry point --------------------------------------------------------------- */

async function main() {
  const showPasswords = process.argv.includes("--show-passwords");
  const { apiKey, projectId } = readEnv();
  const previous = readCredentials();
  const results = [];

  console.log(
    `[seed-demo-tenants] project ${projectId}; ${TENANTS.length} tenant(s)`,
  );

  for (const tenant of TENANTS) {
    const before = previous.tenants?.find((item) => item.slug === tenant.slug);
    const result = await seedTenant(projectId, apiKey, tenant, before);

    results.push(result);

    console.log(
      [
        `  ${tenant.slug}`,
        `    account:   ${result.email} (${result.accountCreated ? "created" : "existing"})`,
        `    workspace: ${result.workspaceCreated ? "created" : "existing"}`,
        `    post:      ${result.postCreated ? "created" : "existing"}`,
        `    url:       ${result.url}`,
        `    admin:     ${result.adminUrl}`,
      ].join("\n"),
    );
  }

  const record = {
    generatedAt: new Date().toISOString(),
    projectId,
    tenants: results.map(
      ({
        accountCreated: _accountCreated,
        workspaceCreated: _workspaceCreated,
        postCreated: _postCreated,
        ...rest
      }) => rest,
    ),
  };

  saveCredentials(record);

  console.log(
    `[seed-demo-tenants] credentials written to ${CREDENTIALS_FILE} (git-ignored).`,
  );

  if (showPasswords) {
    console.log("[seed-demo-tenants] passwords:");

    for (const result of results) {
      console.log(`  ${result.email}  ${result.password}`);
    }
  } else {
    console.log(
      "[seed-demo-tenants] passwords are not printed; pass --show-passwords to show them.",
    );
  }
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((error) => {
    console.error("[seed-demo-tenants]", error?.message ?? error);
    process.exit(1);
  });
}
