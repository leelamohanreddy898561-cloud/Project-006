import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";

/**
 * R34 — the Storage rule denied every account, admins included.
 *
 * The admin check was declared one scope above the `{uid}` wildcard it read, so
 * the name resolved to nothing, the condition errored, and the rule denied. The
 * deploy linter printed `Invalid variable name: uid` and was dismissed with the
 * rest of its false positives; the guard below is the check that should have
 * been there instead.
 *
 * TC-3401 proves the defect class is gone from both rule files, and proves the
 * guard itself by feeding it the old, broken shape. TC-3402 pins the fixed rule
 * so the parameter cannot quietly be dropped again.
 */

const RULES_FILES = ["storage.rules", "firestore.rules"];

/** Rules comments never affect evaluation, but they do contain prose. */
function withoutComments(source: string): string {
  return source
    .split(/\r?\n/)
    .map((line) => line.replace(/\/\/.*$/, ""))
    .join("\n");
}

/** Brace depth at a character index — 0 at the top level. */
function depthAt(source: string, index: number): number {
  let depth = 0;

  for (let i = 0; i < index; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") depth--;
  }

  return depth;
}

interface MatchBlock {
  index: number;
  depth: number;
  wildcards: string[];
}

interface RuleFunction {
  name: string;
  params: string[];
  body: string;
  enclosing: Set<string>;
  index: number;
}

function wildcardsIn(matchPath: string): string[] {
  return [...matchPath.matchAll(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g)].map(
    (match) => match[1],
  );
}

function matchBlocks(source: string): MatchBlock[] {
  const blocks: MatchBlock[] = [];
  let index = 0;

  for (const line of source.split("\n")) {
    const match = line.match(/^\s*match\s+(.+?)\s*\{\s*$/);

    if (match) {
      blocks.push({
        index,
        depth: depthAt(source, index),
        wildcards: wildcardsIn(match[1]),
      });
    }

    index += line.length + 1;
  }

  return blocks;
}

/** The body between a function's opening brace and its matching close. */
function bodyFrom(source: string, openBrace: number): string {
  let depth = 0;

  for (let i = openBrace; i < source.length; i++) {
    if (source[i] === "{") depth++;
    else if (source[i] === "}") {
      depth--;
      if (depth === 0) return source.slice(openBrace + 1, i);
    }
  }

  throw new Error("unbalanced braces in a rules function");
}

function ruleFunctions(source: string): RuleFunction[] {
  const blocks = matchBlocks(source);

  return [...source.matchAll(/\bfunction\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)\s*\{/g)].map(
    (match) => {
      const index = match.index ?? 0;
      const depth = depthAt(source, index);
      const enclosing = new Set(
        blocks
          .filter((block) => block.index < index && block.depth < depth)
          .flatMap((block) => block.wildcards),
      );

      return {
        name: match[1],
        params: match[2]
          .split(",")
          .map((param) => param.trim())
          .filter(Boolean),
        body: bodyFrom(source, index + match[0].length - 1),
        enclosing,
        index,
      };
    },
  );
}

/**
 * Wildcard names used inside a function that are neither its parameters nor
 * declared by a scope enclosing it. `request.auth.uid` and `owners/$(...uid)`
 * are property reads, not variable references, so they are skipped.
 */
function outOfScopeNames(source: string): Array<{
  fn: string;
  name: string;
}> {
  const clean = withoutComments(source);
  const allWildcards = new Set(matchBlocks(clean).flatMap((block) => block.wildcards));
  const found: Array<{ fn: string; name: string }> = [];

  for (const fn of ruleFunctions(clean)) {
    for (const match of fn.body.matchAll(/(?<![\w.])[A-Za-z_][A-Za-z0-9_]*/g)) {
      const name = match[0];

      if (!allWildcards.has(name)) continue;
      if (fn.params.includes(name) || fn.enclosing.has(name)) continue;

      found.push({ fn: fn.name, name });
    }
  }

  return found;
}

test.describe("R34 — a rules function only reads variables in its own scope", () => {
  test("TC-3401: no function reaches into a nested match's wildcard", () => {
    for (const file of RULES_FILES) {
      const source = readFileSync(path.resolve(file), "utf8");

      expect(
        outOfScopeNames(source),
        `${file} must pass a nested match's wildcard in as a parameter`,
      ).toEqual([]);
    }

    // The guard has to be able to fail, so the defect it exists for is fed to
    // it: this is the shape R33 shipped, which denied every account.
    const broken = `
      service.firebase.storage {
        match /b/{bucket}/o {
          match /blog-images/{uid}/{fileName} {
            allow read: if isOwnerAdmin();
          }
          function isOwnerAdmin() {
            return request.auth != null && request.auth.uid == uid;
          }
        }
      }
    `;

    expect(outOfScopeNames(broken)).toEqual([
      { fn: "isOwnerAdmin", name: "uid" },
    ]);

    // …and the fixed shape produces nothing.
    const fixed = `
      service.firebase.storage {
        match /b/{bucket}/o {
          match /blog-images/{uid}/{fileName} {
            allow read: if isOwnerAdmin(uid);
          }
          function isOwnerAdmin(ownerUid) {
            return request.auth != null && request.auth.uid == ownerUid;
          }
        }
      }
    `;

    expect(outOfScopeNames(fixed)).toEqual([]);
  });
});

test.describe("R34 — the Storage rule is the fixed shape", () => {
  test("TC-3402: the admin check takes the owner's uid", () => {
    const storage = readFileSync(path.resolve("storage.rules"), "utf8");

    // The uid is a parameter, and every operation passes the wildcard in.
    expect(storage, "the check must take a parameter").toMatch(
      /function isOwnerAdmin\(\s*ownerUid\s*\)/,
    );
    expect(
      storage.match(/isOwnerAdmin\(uid\)/g) ?? [],
      "read, write and delete must all pass the uid",
    ).toHaveLength(3);

    // The broken form must not come back.
    expect(storage, "a parameterless call is the defect").not.toMatch(
      /isOwnerAdmin\(\s*\)/,
    );
    expect(
      storage,
      "the function must not read the wildcard directly",
    ).not.toContain("request.auth.uid == uid");

    // The conditions that were already right stay right.
    expect(storage).toContain("request.auth.uid == ownerUid");
    expect(storage).toContain("request.resource.size < 5 * 1024 * 1024");
    expect(storage).toContain("request.resource.contentType.matches('image/.*')");
    expect(storage).toMatch(/allow delete: if isOwnerAdmin\(uid\)/);
    expect(storage).toContain("match /blog-images/{uid}/{fileName}");
  });
});
