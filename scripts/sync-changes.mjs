/**
 * R17 — Firestore change log sync.
 *
 * Writes every entry from changeLog.json to the Firestore `changeLog`
 * collection. Credentials come from .env (git-ignored) via Node's --env-file.
 *
 * Run: npm run sync:changes
 *
 * Firestore security rules must permit the write. A brand-new project defaults
 * to locked rules (all writes denied). Either start Firestore in test mode or
 * see the Admin SDK note in the README.
 */

import { readFileSync } from "node:fs";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const REQUIRED = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
];

const missing = REQUIRED.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(
    `[sync:changes] Missing required environment variables: ${missing.join(", ")}.\n` +
      "Fill them in .env (see .env.example), then run: npm run sync:changes",
  );
  process.exit(1);
}

const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const payload = JSON.parse(readFileSync("changeLog.json", "utf8"));

const app = initializeApp(config);
const db = getFirestore(app);

console.log(
  `[sync:changes] Writing ${payload.entries.length} entries to collection "${payload.targetCollection}"…`,
);

for (const entry of payload.entries) {
  const ref = await addDoc(collection(db, payload.targetCollection), {
    ...entry,
    project: payload.project,
    syncedAt: serverTimestamp(),
  });
  console.log(
    `  ✓ ${entry.short} ${entry.subject.slice(0, 60)} → ${ref.id}`,
  );
}

console.log("[sync:changes] Done.");
