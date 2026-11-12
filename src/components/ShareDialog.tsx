"use client";

import { useCallback, useEffect, useState } from "react";

type Role = "EDITOR" | "VIEWER";
type Share = { userId: string; name: string; email: string; role: Role };

export function ShareDialog({ docId }: { docId: string }) {
  const [open, setOpen] = useState(false);
  const [shares, setShares] = useState<Share[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("EDITOR");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/documents/${docId}/share`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Couldn't load sharing settings");
    setShares(data.shares);
  }, [docId]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    load().catch((e) => setError(e.message));
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, load]);

  async function grant(targetEmail: string, targetRole: Role) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${docId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, role: targetRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't share");
      await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't share");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (await grant(email, role)) setEmail("");
  }

  async function revoke(userId: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${docId}/share/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Couldn't remove access");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove access");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        Share
      </button>
      {open && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="card modal" role="dialog" aria-modal="true" aria-label="Share document">
            <div className="modal-head">
              <h2>Share document</h2>
              <button className="btn btn-sm" onClick={() => setOpen(false)} aria-label="Close">
                Close
              </button>
            </div>

            <form onSubmit={submit} className="share-form">
              <input
                className="input"
                type="email"
                placeholder="Email, e.g. bob@ajaia.test"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <select className="input role-select" value={role} onChange={(e) => setRole(e.target.value as Role)} aria-label="Access level">
                <option value="EDITOR">Can edit</option>
                <option value="VIEWER">View only</option>
              </select>
              <button className="btn btn-primary" type="submit" disabled={busy}>
                Share
              </button>
            </form>
            {error && <div className="error" role="alert">{error}</div>}

            <h3 className="modal-sub">People with access</h3>
            {shares.length === 0 ? (
              <p className="muted">Only you can see this document.</p>
            ) : (
              <ul className="share-list">
                {shares.map((s) => (
                  <li key={s.userId}>
                    <div>
                      <div>{s.name}</div>
                      <div className="muted small">{s.email}</div>
                    </div>
                    <div className="share-actions">
                      <select
                        className="input role-select"
                        value={s.role}
                        disabled={busy}
                        aria-label={`Access level for ${s.name}`}
                        onChange={(e) => void grant(s.email, e.target.value as Role)}
                      >
                        <option value="EDITOR">Can edit</option>
                        <option value="VIEWER">View only</option>
                      </select>
                      <button className="btn btn-sm btn-danger" disabled={busy} onClick={() => void revoke(s.userId)}>
                        Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
