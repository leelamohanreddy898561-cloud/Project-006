/**
 * R17 — verify the Firestore change log.
 *
 * Reads back the changeLog collection and prints what actually landed,
 * so a sync can be proven rather than assumed.
 *
 * Run: npm run verify:changes
 */

import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const REQUIRED = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];

const missing = REQUIRED.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(
    `[verify:changes] Missing required environment variables: ${missing.join(", ")}.`,
  );
  process.exit(1);
}

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const payload = JSON.parse(readFileSync("changeLog.json", "utf8"));
const app = initializeApp(config);
const db = getFirestore(app);

const snapshot = await getDocs(collection(db, payload.targetCollection));

console.log(
  `[verify:changes] Collection "${payload.targetCollection}" contains ${snapshot.size} document(s) ` +
    `(changeLog.json has ${payload.entries.length} entries):`,
);

const found = new Set();
snapshot.forEach((doc) => {
  const data = doc.data();
  found.add(data.short);
  console.log(
    `  • ${doc.id}  ${data.short}  ${String(data.subject).slice(0, 58)}  ` +
      `(${data.files?.length ?? 0} files, tests: ${data.verification?.testsPassed ?? "n/a"} passed)`,
  );
});

const expected = payload.entries.map((entry) => entry.short);
const absent = expected.filter((short) => !found.has(short));

if (absent.length > 0) {
  console.error(`[verify:changes] MISSING from Firestore: ${absent.join(", ")}`);
  process.exit(1);
}

console.log("[verify:changes] All changeLog.json entries are present in Firestore.");
