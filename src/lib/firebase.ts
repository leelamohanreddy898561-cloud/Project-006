import { getApps, getApp, initializeApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import type { Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import type { Firestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import type { FirebaseStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";
import type { Analytics } from "firebase/analytics";

/**
 * R16 — Firebase integration.
 *
 * Configuration is read from Vite environment variables (VITE_FIREBASE_*).
 * Copy .env.example to .env and fill in the values from
 * Firebase Console → Project Settings → General → Your apps.
 *
 * Firebase web API keys are identifiers, not secrets — access is controlled by
 * Firestore/Storage security rules. Keeping them in .env (git-ignored) still
 * keeps them out of git history and lets local/production configs differ.
 */

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
};

/** Variables that must be present for Firebase to initialize. */
const REQUIRED_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

function missingVars(): string[] {
  return REQUIRED_VARS.filter((name) => !env[name]);
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;
let analytics: Analytics | null = null;

try {
  const missing = missingVars();
  if (missing.length > 0) {
    throw new Error(
      `Firebase is not configured — missing ${missing.join(", ")}. ` +
        "Copy .env.example to .env and add your project values, then restart the dev server.",
    );
  }

  // getApps() check keeps HMR from initializing a second app.
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Analytics is browser-only and needs a measurementId.
  if (typeof window !== "undefined" && env.VITE_FIREBASE_MEASUREMENT_ID) {
    analytics = getAnalytics(app);
  }
} catch (error) {
  // Fail loudly, but never take the rest of the site down with us.
  console.error(
    "[firebase] Initialization failed:",
    error instanceof Error ? error.message : error,
  );
}

export { app, auth, db, storage, analytics };
