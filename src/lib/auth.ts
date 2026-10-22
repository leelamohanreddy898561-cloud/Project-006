/**
 * R24.15 — the single seam between the auth UI and Firebase Authentication.
 *
 * `src/pages/AuthPage.tsx` imports nothing auth-related except these three
 * functions. When Firebase Auth is turned on, replace the bodies below and no
 * page code changes:
 *
 *     const app = await getFirebase();
 *     const auth = getAuth(app);
 *     await signInWithEmailAndPassword(auth, email, password);
 *
 * Until then every call resolves to a "not connected" outcome, which the pages
 * surface in their live region. Nothing in the UI ever claims an account was
 * created or a session started.
 */

export type AuthOutcome =
  | { ok: true }
  | { ok: false; message: string };

export const AUTH_NOT_CONNECTED =
  "Account features are not connected yet. Firebase Authentication arrives with the next requirement, so nothing was sent.";

function notConnected(): AuthOutcome {
  return { ok: false, message: AUTH_NOT_CONNECTED };
}

export async function signInWithEmail(
  _email: string,
  _password: string,
): Promise<AuthOutcome> {
  return notConnected();
}

export async function signUpWithEmail(
  _email: string,
  _password: string,
): Promise<AuthOutcome> {
  return notConnected();
}

export async function signInWithGoogle(): Promise<AuthOutcome> {
  return notConnected();
}
