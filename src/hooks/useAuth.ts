import { useEffect, useState } from "react";
import { subscribeToAuth, type AuthUser } from "../lib/auth";

/**
 * R29 — the session, as React state.
 *
 * Subscribes once per mount and unsubscribes on unmount. Firebase restores a
 * persisted session and fires the callback immediately, so a reload lands in
 * the right state without a flash of "signed out" followed by "signed in".
 */

export type AuthStatus = "loading" | "signedIn" | "signedOut";

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
  });

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    subscribeToAuth((user) => {
      if (!active) return;
      setState({ status: user ? "signedIn" : "signedOut", user });
    })
      .then((stop) => {
        if (active) unsubscribe = stop;
        else stop();
      })
      .catch(() => {
        // Unconfigured or unreachable: behave as signed out rather than
        // leaving the header stuck on a loading state forever.
        if (active) setState({ status: "signedOut", user: null });
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return state;
}
