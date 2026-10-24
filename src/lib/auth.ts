import type { User } from "firebase/auth";
import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";
import { ensureUserProfile } from "./users";

/**
 * R24.15 / R29 — the single seam between the auth UI and Firebase
 * Authentication.
 *
 * `AuthPage`, the header and the account menu import nothing auth-related
 * except the functions below. `firebase/auth` is only ever loaded through
 * dynamic imports, so the SDK stays out of the initial bundle (R14.1).
 *
 * Every function resolves to an `AuthOutcome` rather than throwing, so a page
 * never has to wrap a call in try/catch and can never claim a session that
 * Firebase did not create.
 */

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type AuthOutcome =
  | { ok: true; user: AuthUser | null }
  | { ok: false; message: string; code?: string };

const OK_NO_USER: AuthOutcome = { ok: true, user: null };

/**
 * Firebase error codes, in plain English. Anything unmapped falls back to a
 * generic sentence plus the code, which is more useful than a raw message.
 */
const MESSAGES: Record<string, string> = {
  "auth/invalid-email": "That email address does not look right.",
  "auth/missing-password": "Enter your password.",
  "auth/missing-email": "Enter your email address.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/user-not-found": "Email or password is incorrect.",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/invalid-login-credentials": "Email or password is incorrect.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/email-already-in-use":
    "An account already exists for that email. Sign in instead.",
  "auth/weak-password": "Use a stronger password — at least 8 characters.",
  "auth/too-many-requests":
    "Too many attempts. Wait a minute, then try again.",
  "auth/network-request-failed":
    "Network problem — check your connection and try again.",
  "auth/popup-closed-by-user": "Google sign-in was closed before it finished.",
  "auth/cancelled-popup-request": "Another sign-in window is already open.",
  "auth/popup-blocked":
    "Your browser blocked the Google pop-up. Allow pop-ups for this site, then try again.",
  "auth/unauthorized-domain":
    "Google sign-in is not allowed from this address. Use localhost or the deployed site.",
  "auth/operation-not-allowed":
    "That sign-in method is not enabled for this project.",
  "auth/account-exists-with-different-credential":
    "That email is registered with a different sign-in method.",
  "auth/requires-recent-login": "Please sign in again to continue.",
  "auth/internal-error": "Firebase rejected the request. Try again.",
};

function friendly(error: unknown): { message: string; code?: string } {
  const code = (error as { code?: string })?.code;

  if (code && MESSAGES[code]) {
    return { message: MESSAGES[code], code };
  }

  const detail = (error as { message?: string })?.message;

  return {
    message: detail
      ? `Sign-in failed: ${detail}`
      : "Sign-in failed. Please try again.",
    code,
  };
}

function toAuthUser(user: User | null): AuthUser | null {
  if (!user) return null;

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

/**
 * R31 — makes sure the Firestore profile exists for the account that just
 * signed in. Deliberately fire-and-forget: authentication must never fail or
 * stall because Firestore is slow, unreachable or still locked down. If the
 * write fails, /admin fails closed and the rest of the site is unaffected.
 */
function seedProfile(user: User | null): void {
  if (!user) return;

  void ensureUserProfile({ uid: user.uid, email: user.email }).catch(() => {});
}

/**
 * Loads the auth module ahead of a click.
 *
 * `signInWithPopup` must be called inside the user-gesture handler or Safari
 * and Firefox block the window. The auth pages call this on mount so the module
 * is already in memory by the time the button is pressed.
 */
export async function preloadAuth(): Promise<void> {
  if (!isFirebaseConfigured()) return;

  try {
    await Promise.all([import("firebase/auth"), getFirebaseAuth()]);
  } catch {
    // A real attempt will surface the error with a proper message.
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<AuthOutcome> {
  try {
    const [{ signInWithEmailAndPassword }, auth] = await Promise.all([
      import("firebase/auth"),
      getFirebaseAuth(),
    ]);

    const credential = await signInWithEmailAndPassword(auth, email, password);

    seedProfile(credential.user);

    return { ok: true, user: toAuthUser(credential.user) };
  } catch (error) {
    return { ok: false, ...friendly(error) };
  }
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<AuthOutcome> {
  try {
    const [{ createUserWithEmailAndPassword, updateProfile }, auth] =
      await Promise.all([import("firebase/auth"), getFirebaseAuth()]);

    const credential = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );

    // The local part is a better default name than "there is no name".
    const suggested = email.split("@")[0]?.slice(0, 40) ?? "";

    if (suggested) {
      try {
        await updateProfile(credential.user, { displayName: suggested });
      } catch {
        // A missing display name is cosmetic; the account already exists.
      }
    }

    seedProfile(credential.user);

    return { ok: true, user: toAuthUser(credential.user) };
  } catch (error) {
    return { ok: false, ...friendly(error) };
  }
}

/**
 * Google sign-in via pop-up.
 *
 * If the browser blocks the pop-up the user gets an explicit instruction
 * rather than a silent no-op. `prompt: "select_account"` makes the account
 * chooser appear even when one Google account is already signed in, which is
 * what people expect from a "Sign in with Google" button.
 */
export async function signInWithGoogle(): Promise<AuthOutcome> {
  try {
    const [{ GoogleAuthProvider, signInWithPopup }, auth] = await Promise.all([
      import("firebase/auth"),
      getFirebaseAuth(),
    ]);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const credential = await signInWithPopup(auth, provider);

    seedProfile(credential.user);

    return { ok: true, user: toAuthUser(credential.user) };
  } catch (error) {
    return { ok: false, ...friendly(error) };
  }
}

export async function signOutUser(): Promise<AuthOutcome> {
  try {
    const [{ signOut }, auth] = await Promise.all([
      import("firebase/auth"),
      getFirebaseAuth(),
    ]);

    await signOut(auth);

    return OK_NO_USER;
  } catch (error) {
    return { ok: false, ...friendly(error) };
  }
}

/**
 * Subscribes to the session. Fires immediately with the restored user (or
 * null) and again on every sign-in and sign-out, including from another tab.
 */
export async function subscribeToAuth(
  onChange: (user: AuthUser | null) => void,
): Promise<() => void> {
  if (!isFirebaseConfigured()) {
    onChange(null);
    return () => {};
  }

  const [{ onAuthStateChanged }, auth] = await Promise.all([
    import("firebase/auth"),
    getFirebaseAuth(),
  ]);

  return onAuthStateChanged(auth, (user) => onChange(toAuthUser(user)));
}
