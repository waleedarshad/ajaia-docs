"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  id: string;
  title: string;
  updated: string;
  // Present only for documents shared with the current user.
  shared?: { ownerName: string; role: "EDITOR" | "VIEWER" };
};

export function DocumentCard({ id, title, updated, shared }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Couldn't delete");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete");
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <div className="card doc-card">
      <Link href={`/docs/${id}`} className="doc-link">
        <div className="doc-title">{title}</div>
        <div className="muted doc-meta">Edited {updated}</div>
      </Link>
      <div className="doc-footer">
        {shared ? (
          <span className="badge badge-shared">
            Shared by {shared.ownerName} · {shared.role === "EDITOR" ? "Can edit" : "View only"}
          </span>
        ) : (
          <span className="badge badge-owned">Owned by you</span>
        )}
        {!shared &&
          (confirming ? (
            <span className="confirm">
              <button className="btn btn-danger btn-sm" onClick={remove} disabled={busy}>
                Confirm delete
              </button>
              <button className="btn btn-sm" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <button className="btn btn-sm" onClick={() => setConfirming(true)}>
              Delete
            </button>
          ))}
      </div>
      {error && <div className="error" role="alert">{error}</div>}
    </div>
  );
}
