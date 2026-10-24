import { useEffect, useState } from "react";
import type { AuthUser } from "../lib/auth";
import { ensureUserProfile, type UserRole } from "../lib/users";

/**
 * R31 — the signed-in account's role, as React state.
 *
 * `idle` means there is no session. `error` means the profile could not be read
 * or created; the admin guard treats that as a standard user (AC31.7).
 */
export type RoleStatus = "idle" | "loading" | "ready" | "error";

export interface UserRoleState {
  role: UserRole | null;
  status: RoleStatus;
}

export function useUserRole(user: AuthUser | null): UserRoleState {
  const [state, setState] = useState<UserRoleState>({
    role: null,
    status: "idle",
  });

  const uid = user?.uid ?? null;
  const email = user?.email ?? null;

  useEffect(() => {
    if (!uid) {
      setState({ role: null, status: "idle" });
      return;
    }

    let active = true;
    setState({ role: null, status: "loading" });

    ensureUserProfile({ uid, email })
      .then((role) => {
        if (active) setState({ role, status: "ready" });
      })
      .catch(() => {
        if (active) setState({ role: null, status: "error" });
      });

    return () => {
      active = false;
    };
  }, [uid, email]);

  return state;
}
