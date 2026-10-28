import { useEffect, useState } from "react";
import { isFirebaseConfigured } from "../lib/firebase";
import {
  listWorkspacesOwnedBy,
  type Workspace,
} from "../lib/workspaces";

/**
 * R44 — the workspaces an account can open.
 *
 * The read itself lives in `listWorkspacesOwnedBy` (R46 needs the same answer
 * outside React, at sign-in), so this hook is only the state around it: one
 * query per session, keyed by `uid`.
 */

export type MyWorkspacesStatus = "loading" | "ready" | "error";

export interface MyWorkspacesState {
  workspaces: Workspace[];
  status: MyWorkspacesStatus;
  message: string;
}

export function useMyWorkspaces(uid: string | null): MyWorkspacesState {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [status, setStatus] = useState<MyWorkspacesStatus>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!uid) {
      setWorkspaces([]);
      setStatus("ready");
      return;
    }

    if (!isFirebaseConfigured()) {
      setStatus("error");
      setMessage(
        "Firebase is not configured — copy .env.example to .env and add the project values.",
      );
      return;
    }

    let active = true;

    setStatus("loading");

    listWorkspacesOwnedBy(uid).then((outcome) => {
      if (!active) return;

      if (!outcome.ok) {
        setMessage(outcome.message);
        setStatus("error");
        return;
      }

      setWorkspaces(outcome.workspaces);
      setStatus("ready");
    });

    return () => {
      active = false;
    };
  }, [uid]);

  return { workspaces, status, message };
}
