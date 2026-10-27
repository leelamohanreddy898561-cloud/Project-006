/**
 * R42 — moves the flat `blogs` collection into a workspace.
 *
 * Before R42 the site's posts lived in a single collection that belonged to no
 * tenant. This script copies each document to
 * `workspaces/<workspaceId>/blogs/<same id>` — the id is kept on purpose, so a
 * saved article URL and a document's own `imagePath` still point at the same
 * record — and creates the workspace document with its owner when it is absent.
 *
 * It is idempotent: a destination document that already exists is never
 * overwritten, so a second run copies nothing and reports the same totals, and
 * `--dry-run` reports what it would do without writing.
 *
 * The flat `blogs` collection is not deleted here. Retiring it is a separate
 * decision, made after the switched site has been verified — a migration that
 * deletes its own source cannot be re-run when something is wrong.
 *
 * Run against the emulator (no credentials needed):
 *
 *     $env:FIRESTORE_EMULATOR_HOST="127.0.0.1:8080"; node scripts/migrate-workspace.mjs --dry-run
 *
 * Run against the project (credentials required):
 *
 *     node --env-file=.env scripts/migrate-workspace.mjs            # needs GOOGLE_APPLICATION_CREDENTIALS
 *
 * Options: --workspace <id>, --owner <uid>, --name <title>, --slug <slug>,
 * --dry-run.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export const DEFAULT_WORKSPACE = {
  id: "signal-and-noise",
  name: "Signal & Noise",
  slug: "signal-and-noise",
};

/** The owner of a new workspace: the caller's choice, or an existing admin. */
export async function resolveOwner(db, explicit) {
  if (explicit) return explicit;

  const admins = await db
    .collection("users")
    .where("role", "==", "admin")
    .limit(1)
    .get();

  return admins.empty ? null : admins.docs[0].id;
}

/**
 * Copies `blogs` into `workspaces/<workspaceId>/blogs`, creating the workspace
 * document when it does not exist.
 *
 * Returns a report; it never writes to the source collection. Throws when a
 * workspace has to be created and no owner can be determined, so a workspace
 * with no owner is impossible.
 */
export async function migrateWorkspace({
  db,
  workspaceId = DEFAULT_WORKSPACE.id,
  name = DEFAULT_WORKSPACE.name,
  slug = DEFAULT_WORKSPACE.slug,
  ownerUid = "",
  dryRun = false,
}) {
  const workspaceRef = db.doc(`workspaces/${workspaceId}`);
  const existingWorkspace = await workspaceRef.get();

  if (!existingWorkspace.exists) {
    const owner =
      (await resolveOwner(db, ownerUid)) ??
      "";

    if (!owner) {
      throw new Error(
        "This workspace does not exist and no owner could be determined. " +
          "Pass --owner <uid> (the account that should own the blog).",
      );
    }

    if (!dryRun) {
      await workspaceRef.set({
        name,
        slug,
        ownerUid: owner,
        branding: { title: name, tagline: "" },
        createdAt: FieldValue.serverTimestamp(),
      });
    }
  }

  const source = await db.collection("blogs").get();
  const copied = [];
  const skipped = [];

  for (const document of source.docs) {
    const destination = workspaceRef.collection("blogs").doc(document.id);

    if ((await destination.get()).exists) {
      // Never overwrite: a document may have been edited since the last run,
      // and the destination is the live record after the switch.
      skipped.push(document.id);
      continue;
    }

    if (!dryRun) await destination.set(document.data());

    copied.push(document.id);
  }

  return {
    workspaceId,
    workspaceCreated: !existingWorkspace.exists,
    dryRun,
    total: source.size,
    copied,
    skipped,
  };
}

function parseArgs(argv) {
  const args = {
    workspaceId: DEFAULT_WORKSPACE.id,
    name: DEFAULT_WORKSPACE.name,
    slug: DEFAULT_WORKSPACE.slug,
    ownerUid: "",
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--workspace") args.workspaceId = argv[++i];
    else if (arg === "--owner") args.ownerUid = argv[++i];
    else if (arg === "--name") args.name = argv[++i];
    else if (arg === "--slug") args.slug = argv[++i];
    else if (arg.startsWith("--")) {
      throw new Error(`Unknown option ${arg}`);
    }
  }

  return args;
}

function projectIdFromConfig() {
  if (process.env.GCLOUD_PROJECT) return process.env.GCLOUD_PROJECT;
  if (process.env.VITE_FIREBASE_PROJECT_ID) {
    return process.env.VITE_FIREBASE_PROJECT_ID;
  }

  try {
    const config = JSON.parse(readFileSync(resolve(".firebaserc"), "utf8"));

    return config?.projects?.default ?? "";
  } catch {
    return "";
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = projectIdFromConfig();
  const emulator = Boolean(process.env.FIRESTORE_EMULATOR_HOST);

  if (!getApps().length) initializeApp({ projectId });

  console.log(
    `[migrate-workspace] ${args.dryRun ? "DRY RUN — " : ""}` +
      `project ${projectId || "(unknown)"}, workspace ${args.workspaceId}` +
      `${emulator ? `, emulator ${process.env.FIRESTORE_EMULATOR_HOST}` : ""}`,
  );

  const report = await migrateWorkspace({
    db: getFirestore(),
    workspaceId: args.workspaceId,
    name: args.name,
    slug: args.slug,
    ownerUid: args.ownerUid,
    dryRun: args.dryRun,
  });

  console.log(
    [
      `  workspace: ${
        report.workspaceCreated
          ? report.dryRun
            ? "would be created"
            : "created"
          : "already present"
      }`,
      `  source:    ${report.total} document(s) in blogs`,
      `  ${report.dryRun ? "would copy" : "copied"}:  ${report.copied.length}`,
      `  skipped:   ${report.skipped.length} (already in the workspace)`,
    ].join("\n"),
  );

  if (report.copied.length > 0) {
    console.log(`  ids: ${report.copied.join(", ")}`);
  }

  console.log(
    "[migrate-workspace] The flat blogs collection is untouched; retire it only after the switched site is verified.",
  );
}

const invokedDirectly =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedDirectly) {
  main().catch((error) => {
    console.error("[migrate-workspace]", error?.message ?? error);
    process.exit(1);
  });
}
