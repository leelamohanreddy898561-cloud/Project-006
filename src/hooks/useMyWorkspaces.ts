import { useEffect, useState } from "react";
import { getFirebase, isFirebaseConfigured } from "../lib/firebase";
import type { Workspace } from "../lib/workspaces";

/**
 * R44 — the workspaces an account can open.
 *
 * One query, by the field ownership is stored in: `ownerUid`. The workspace
 * document is publicly readable (a site's name and slug are public), so this
 * needs no rule change and no index beyond the automatic single-field one.
 *
 * Memberships (R41's `members` subcollection) are deliberately not merged yet:
 * listing them needs a collection-group query, and the product has no invite
 * flow to create them. Ownership is what onboarding will write (R45).
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

    (async () => {
      try {
        const [{ db }, { collection, getDocs, query, where }] =
          await Promise.all([getFirebase(), import("firebase/firestore")]);

        const snapshot = await getDocs(
          query(
            collection(db, "workspaces"),
            where("ownerUid", "==", uid),
          ),
        );

        if (!active) return;

        setWorkspaces(
          snapshot.docs.map((document) => {
            const data = document.data();

            return {
              id: document.id,
              name: String(data.name ?? ""),
              slug: String(data.slug ?? ""),
              ownerUid: String(data.ownerUid ?? ""),
              branding: {
                title: String(
                  (data.branding as { title?: unknown } | undefined)?.title ??
                    data.name ??
                    "",
                ),
                tagline: String(
                  (data.branding as { tagline?: unknown } | undefined)
                    ?.tagline ?? "",
                ),
              },
              createdAt: data.createdAt,
            };
          }),
        );
        setStatus("ready");
      } catch (error) {
        if (!active) return;

        setMessage(
          error instanceof Error
            ? `Your sites could not be loaded (${error.message}).`
            : "Your sites could not be loaded.",
        );
        setStatus("error");
      }
    })();

    return () => {
      active = false;
    };
  }, [uid]);

  return { workspaces, status, message };
}
