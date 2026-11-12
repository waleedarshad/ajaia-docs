"use client";

import { useCallback, useEffect, useState } from "react";
import { formatUpdated } from "@/lib/format";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  canDelete: boolean;
};

// A flat discussion thread under the document. Everyone who can open the document can read
// and post here, including view-only users. Permissions are enforced by the API; the UI
// only hides the delete button when the server says it isn't allowed (canDelete).
export function CommentsPanel({ docId }: { docId: string }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/documents/${docId}/comments`);
    if (!res.ok) {
      setError("Couldn't load comments");
      return;
    }
    setComments((await res.json()).comments);
  }, [docId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/documents/${docId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: draft }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't post your comment");
      setComments((prev) => [...(prev ?? []), data.comment]);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't post your comment");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`/api/documents/${docId}/comments/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't delete that comment");
      return;
    }
    setComments((prev) => (prev ?? []).filter((c) => c.id !== id));
  }

  return (
    <section className="comments" aria-label="Comments">
      <h2 className="comments-title">Comments{comments ? ` (${comments.length})` : ""}</h2>

      {comments && comments.length === 0 && <p className="muted">No comments yet.</p>}
      <ul className="comment-list">
        {(comments ?? []).map((c) => (
          <li key={c.id} className="comment">
            <div className="comment-meta">
              <strong>{c.authorName}</strong>
              <span className="muted">{formatUpdated(new Date(c.createdAt))}</span>
              {c.canDelete && (
                <button type="button" className="link-btn comment-delete" onClick={() => void remove(c.id)}>
                  Delete
                </button>
              )}
            </div>
            <p className="comment-body">{c.body}</p>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="comment-form">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment"
          rows={3}
          maxLength={2000}
          aria-label="New comment"
        />
        <button className="btn btn-primary" type="submit" disabled={busy || !draft.trim()}>
          {busy ? "Posting…" : "Comment"}
        </button>
      </form>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
