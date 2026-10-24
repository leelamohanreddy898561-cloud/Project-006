import { getFirebase, getFirebaseAuth } from "./firebase";

/**
 * R31 — user roles.
 *
 * A profile lives at `users/{uid}` in Firestore:
 *
 *     { email: "reader@example.com", role: "student", createdAt: <timestamp> }
 *
 * `role` is `"admin" | "student" | "user"`; only `"admin"` opens /admin.
 * The browser check is convenience — `firestore.rules` is what stops a user
 * from writing `role: "admin"` on their own document.
 *
 * New profiles are created as `"student"`. An existing document is never
 * overwritten, so an admin promoted in the console keeps the role across
 * sign-ins. `firebase/firestore` is imported on demand, keeping it out of the
 * initial bundle (R14.1).
 */

export type UserRole = "admin" | "student" | "user";

const ROLES: readonly UserRole[] = ["admin", "student", "user"];

export const DEFAULT_ROLE: UserRole = "student";

/** Only the exact admin role grants access; anything else fails closed. */
export function isAdminRole(role: UserRole | null | undefined): boolean {
  return role === "admin";
}

/** Unknown or missing values are standard users, never admins. */
export function normalizeRole(value: unknown): UserRole {
  return ROLES.includes(value as UserRole) ? (value as UserRole) : DEFAULT_ROLE;
}

export interface UserProfileSeed {
  uid: string;
  email: string | null;
}

/**
 * Reads the stored role, or null when the document does not exist yet.
 * Throws when Firestore is unreachable or the rules deny the read — callers
 * treat that as "not an admin" (AC31.7).
 */
export async function fetchUserRole(uid: string): Promise<UserRole | null> {
  const [{ db }, { doc, getDoc }] = await Promise.all([
    getFirebase(),
    import("firebase/firestore"),
  ]);

  const snapshot = await getDoc(doc(db, "users", uid));

  return snapshot.exists() ? normalizeRole(snapshot.data().role) : null;
}

/**
 * Returns the user's role, creating the profile as `"student"` on first sight.
 * A read failure propagates, so a caller can fail closed instead of guessing.
 */
export async function ensureUserProfile(
  seed: UserProfileSeed,
): Promise<UserRole> {
  const existing = await fetchUserRole(seed.uid);
  if (existing) return existing;

  const [{ db }, { doc, setDoc, serverTimestamp }] = await Promise.all([
    getFirebase(),
    import("firebase/firestore"),
  ]);

  await setDoc(doc(db, "users", seed.uid), {
    email: seed.email,
    role: DEFAULT_ROLE,
    createdAt: serverTimestamp(),
  });

  return DEFAULT_ROLE;
}

/**
 * Dev-only hook for TC-3102: reads the signed-in account's role so the test can
 * prove the document was really written. Never shipped to production.
 */
if (import.meta.env.DEV) {
  (
    window as unknown as {
      __getUserRole?: () => Promise<UserRole | null>;
    }
  ).__getUserRole = async () => {
    const auth = await getFirebaseAuth();

    return auth.currentUser ? fetchUserRole(auth.currentUser.uid) : null;
  };
}
