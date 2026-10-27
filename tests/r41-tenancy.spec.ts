import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

/**
 * R41 — the tenancy boundary, guarded.
 *
 * The rule itself is executed by `npm run test:rules` (TC-4101–TC-4103), which
 * needs the Firestore emulator. This case is the cheap guard that keeps that
 * boundary from being relaxed later: it reads the two files and fails on the
 * shape a mistake would take — a tenant path that stopped gating its write on
 * membership, a public write, or a billing field allowed onto the public
 * document.
 *
 * The scope of rules functions (a predicate may only read wildcards it declares
 * or that enclose it) is already proved generally by TC-3401 over both rule
 * files, so it is cited here, not repeated.
 */

const RULES = readFileSync(path.resolve("firestore.rules"), "utf8");
const SEAM = readFileSync(path.resolve("src", "lib", "workspaces.ts"), "utf8");

/** The body of one `match <path> { … }` block, nested blocks included. */
function blockBody(source: string, header: string): string {
  const start = source.indexOf(header);

  if (start === -1) return "";

  const open = source.indexOf("{", start + header.length);
  let depth = 0;

  for (let i = open; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(open + 1, i);
    }
  }

  return "";
}

test("TC-4104 — the tenant paths stay membership-gated and billing-free", () => {
  const workspace = blockBody(RULES, "match /workspaces/{workspaceId}");

  expect(workspace, "the workspaces match block must exist").not.toBe("");

  // The three subcollections.
  expect(workspace).toContain("match /members/{uid}");
  expect(workspace).toContain("match /private/{document}");
  expect(workspace).toContain("match /blogs/{blogId}");

  const members = blockBody(workspace, "match /members/{uid}");
  const billing = blockBody(workspace, "match /private/{document}");
  const posts = blockBody(workspace, "match /blogs/{blogId}");

  // Posts: public to read, written by this workspace's editors only.
  expect(posts).toContain("allow read: if true;");
  expect(posts).toContain("allow write: if canEditWorkspace(workspaceId);");

  // Team: visible to the team, written by the owner, never handed ownership.
  expect(members).toContain("allow read: if isWorkspaceMember(workspaceId);");
  expect(members).toContain("if isWorkspaceOwner(workspaceId)");
  expect(members).toContain("['editor', 'viewer']");
  expect(members).not.toContain("'owner'");

  // Billing state: owner-only.
  expect(billing).toContain("if isWorkspaceOwner(workspaceId)");

  // The public document cannot gain a plan field or a new owner.
  expect(workspace).toContain("hasNoBillingFields()");
  expect(workspace).toContain(
    "request.resource.data.ownerUid == resource.data.ownerUid",
  );

  // Nothing inside the tenant paths is an unconditional write.
  expect(workspace).not.toMatch(/allow\s+(write|create|update|delete)[^;]*if\s+true/);

  // R41 is additive: the legacy single-tenant collection is still there.
  expect(RULES).toContain("match /blogs/{blogId}");
  expect(RULES).toContain("allow write: if isAdmin();");

  // The browser seam exposes the model the pages will use in R42/R43.
  for (const name of [
    "normalizeMemberRole",
    "canEditWorkspace",
    "canManageWorkspace",
    "workspaceSlug",
    "isWorkspaceSlug",
    "buildWorkspaceDocument",
    "memberPath",
    "workspaceBlogsPath",
    "fetchWorkspaceRole",
    "fetchWorkspace",
  ]) {
    expect(SEAM, `${name} must be exported`).toContain(`function ${name}`);
  }

  expect(SEAM, "the billing field list must match the rules").toContain(
    '"stripeSubscriptionId"',
  );
});
