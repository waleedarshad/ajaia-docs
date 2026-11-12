"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewDocumentButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't create document");
      router.push(`/docs/${data.document.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't create document");
      setBusy(false);
    }
  }

  return (
    <>
      <button className="btn btn-primary" onClick={create} disabled={busy}>
        {busy ? "Creating…" : "+ New document"}
      </button>
      {error && <span className="error" role="alert">{error}</span>}
    </>
  );
}
