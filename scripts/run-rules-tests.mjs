/**
 * R41 — the launcher for the Firestore rules tests.
 *
 * The tenancy boundary is enforced by `firestore.rules`, and only an executed
 * rule proves it. A browser cannot reach that surface, so these cases run in
 * Node against the Firestore emulator instead of in the Playwright suite.
 *
 * This script:
 *   1. finds a JDK (the emulator needs one — `.tools/` holds a portable copy,
 *      `JAVA_HOME` and `java` on PATH are accepted too),
 *   2. starts the Firestore emulator (or reuses one already listening),
 *   3. runs `node --test` with FIRESTORE_EMULATOR_HOST set,
 *   4. stops the emulator and exits with the test status.
 *
 * Run: npm run test:rules
 */

import { spawn, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { delimiter, join, resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const PORT = 8080;
const READY_TIMEOUT_MS = 180_000;
const TEST_FILE = "tests/rules/r41-tenancy.test.mjs";
const JAVA_BIN = process.platform === "win32" ? "java.exe" : "java";

function isJavaHome(candidate) {
  return Boolean(candidate) && existsSync(join(candidate, "bin", JAVA_BIN));
}

/** A JDK from JAVA_HOME, `.tools/`, or the PATH. */
function findJava() {
  if (isJavaHome(process.env.JAVA_HOME)) return process.env.JAVA_HOME;

  const tools = join(ROOT, ".tools");

  if (existsSync(tools)) {
    for (const entry of readdirSync(tools)) {
      const candidate = join(tools, entry);
      if (isJavaHome(candidate)) return candidate;
    }
  }

  // A system Java on PATH has no JAVA_HOME to point at, but the emulator can
  // still use it, so it is accepted as-is.
  const probe = spawnSync("java", ["-version"], { stdio: "ignore" });

  return probe.status === 0 ? "" : null;
}

function emulatorIsUp() {
  return fetch(`http://127.0.0.1:${PORT}/`).then(
    () => true,
    () => false,
  );
}

async function waitForEmulator(child) {
  const started = Date.now();

  while (Date.now() - started < READY_TIMEOUT_MS) {
    if (await emulatorIsUp()) return true;
    if (child && child.exitCode !== null) return false;

    await new Promise((done) => setTimeout(done, 500));
  }

  return false;
}

function stopEmulator(child) {
  if (!child || child.exitCode !== null) return;

  if (process.platform === "win32") {
    // The emulator runs under a Java child process; /T takes the tree with it.
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    return;
  }

  child.kill("SIGTERM");
}

async function main() {
  const javaHome = findJava();

  if (javaHome === null) {
    console.error(
      "[test:rules] No JDK found. The Firestore emulator needs Java.\n" +
        "  Install a JDK (Temurin 17) and set JAVA_HOME, or unpack one into .tools/.\n" +
        "  See evidence.md R41 for the exact steps used on this machine.",
    );

    process.exit(1);
  }

  const alreadyRunning = await emulatorIsUp();
  const ENV = {
    ...process.env,
    ...(javaHome
      ? {
          JAVA_HOME: javaHome,
          PATH: `${join(javaHome, "bin")}${delimiter}${process.env.PATH ?? ""}`,
        }
      : {}),
  };
  let emulator = null;

  if (!alreadyRunning) {
    const npx = process.platform === "win32" ? "npx.cmd" : "npx";
    const args = [
      "--yes",
      "firebase-tools@15.34.1",
      "emulators:start",
      "--only",
      "firestore",
      "--project",
      "demo-r41",
    ];

    console.log("[test:rules] starting the Firestore emulator…");

    // A .cmd shim has to go through a shell on Windows. Passing one command
    // string (rather than args with shell: true) keeps it quoted predictably.
    emulator = process.platform === "win32"
      ? spawn(`${npx} ${args.join(" ")}`, {
          cwd: ROOT,
          stdio: ["ignore", "inherit", "inherit"],
          shell: true,
          env: ENV,
        })
      : spawn(npx, args, {
          cwd: ROOT,
          stdio: ["ignore", "inherit", "inherit"],
          env: ENV,
        });

    const ready = await waitForEmulator(emulator);

    if (!ready) {
      stopEmulator(emulator);
      console.error(
        `[test:rules] The Firestore emulator did not answer on port ${PORT}.`,
      );

      process.exit(1);
    }
  }

  const result = spawnSync(
    process.execPath,
    ["--test", TEST_FILE],
    {
      cwd: ROOT,
      stdio: "inherit",
      env: {
        ...process.env,
        FIRESTORE_EMULATOR_HOST: `127.0.0.1:${PORT}`,
      },
    },
  );

  stopEmulator(emulator);

  process.exit(result.status ?? 1);
}

main().catch((error) => {
  console.error("[test:rules]", error);
  process.exit(1);
});
