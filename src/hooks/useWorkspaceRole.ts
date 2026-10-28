import { useEffect, useState } from "react";
import {
  fetchWorkspaceRole,
  type WorkspaceRole,
} from "../lib/workspaces";

/**
 * R48 — the signed-in account's role in the workspace being rendered.
 *
 * A tenant's public pages are public for everyone, but its own owner or editor
 * still needs a way back into that site's admin. This hook answers exactly that
 * question through the same `fetchWorkspaceRole` seam the admin gate uses, so
 * the public bar can never show a role the gate would refuse.
 *
 * Nothing is read for a signed-out visitor or before the workspace resolves.
 * A failed read fails closed to `null` — the bar stays hidden rather than
 * guessing that a stranger may edit.
 */
export type WorkspaceRoleStatus = "idle" | "loading" | "ready" | "error";

export interface WorkspaceRoleState {
  role: WorkspaceRole | null;
  status: WorkspaceRoleStatus;
}

export function useWorkspaceRole(
  workspaceId: string | null | undefined,
  uid: string | null | undefined,
): WorkspaceRoleState {
  const [state, setState] = useState<WorkspaceRoleState>({
    role: null,
    status: "idle",
  });

  useEffect(() => {
    if (!workspaceId || !uid) {
      setState({ role: null, status: "idle" });
      return;
    }

    let active = true;

    setState({ role: null, status: "loading" });

    fetchWorkspaceRole(workspaceId, uid).then((outcome) => {
      if (!active) return;

      setState({
        role: outcome.ok ? outcome.role : null,
        status: outcome.ok ? "ready" : "error",
      });
    });

    return () => {
      active = false;
    };
  }, [workspaceId, uid]);

  return state;
}
