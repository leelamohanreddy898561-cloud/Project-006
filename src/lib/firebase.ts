import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { FirebaseStorage } from "firebase/storage";
import type { Analytics } from "firebase/analytics";

/**
 * R16 — Firebase integration, lazily initialized.
 *
 * The SDK is loaded on demand via dynamic import() so it never lands in the
 * initial page bundle (R14.1). Nothing in the app uses Firebase yet, so the
 * cost of eager initialization was pure waste.
 *
 * Configuration is read from Vite environment variables (VITE_FIREBASE_*).
 * Copy .env.example to .env and fill in the values from
 * Firebase Console → Project Settings → General → Your apps.
 *
 * Usage:
 *   const { auth, db, storage } = await getFirebase();
 *
 * A dev-only hook (`window.__getFirebase`) exists so Playwright can verify
 * initialization against the real project (TC-1607). It is stripped from
 * production builds.
 */

export interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  analytics: Analytics | null;
}

const env = import.meta.env;

/** Variables that must be present for Firebase to initialize. */
const REQUIRED_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

function missingVars(): string[] {
  return REQUIRED_VARS.filter((name) => !env[name]);
}

let services: FirebaseServices | null = null;
let inFlight: Promise<FirebaseServices> | null = null;

async function load(): Promise<FirebaseServices> {
  const missing = missingVars();
  if (missing.length > 0) {
    throw new Error(
      `Firebase is not configured — missing ${missing.join(", ")}. ` +
        "Copy .env.example to .env and add your project values, then restart the dev server.",
    );
  }

  // Dynamic imports keep the entire SDK out of the initial bundle.
  const [
    { initializeApp, getApps, getApp },
    { getAuth },
    { getFirestore },
    { getStorage },
    { getAnalytics },
  ] = await Promise.all([
    import("firebase/app"),
    import("firebase/auth"),
    import("firebase/firestore"),
    import("firebase/storage"),
    import("firebase/analytics"),
  ]);

  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          apiKey: env.VITE_FIREBASE_API_KEY,
          authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: env.VITE_FIREBASE_APP_ID,
          measurementId: env.VITE_FIREBASE_MEASUREMENT_ID,
        });

  // Analytics is browser-only and needs a measurementId.
  const analytics =
    typeof window !== "undefined" && env.VITE_FIREBASE_MEASUREMENT_ID
      ? getAnalytics(app)
      : null;

  return { app, auth: getAuth(app), db: getFirestore(app), storage: getStorage(app), analytics };
}

/** Initializes Firebase on first use and caches the result. */
export function getFirebase(): Promise<FirebaseServices> {
  if (services) return Promise.resolve(services);
  if (!inFlight) {
    inFlight = load().catch((error) => {
      inFlight = null; // allow a retry after the configuration is fixed
      throw error;
    });
  }
  return inFlight;
}

/** True when the required Firebase environment variables are present. */
export function isFirebaseConfigured(): boolean {
  return missingVars().length === 0;
}

// Dev-only verification hook for TC-1607 — never shipped to production.
if (import.meta.env.DEV) {
  (window as unknown as { __getFirebase?: typeof getFirebase }).__getFirebase =
    getFirebase;
}
