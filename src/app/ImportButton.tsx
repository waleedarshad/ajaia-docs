"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const ACCEPT = ".txt,.md,.markdown,.docx";

export function ImportButton() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/documents/import", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      router.push(`/docs/${data.document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setBusy(false);
    }
  }

  return (
    <div className="import">
      <input ref={input} type="file" accept={ACCEPT} onChange={onPick} hidden />
      <button className="btn" onClick={() => input.current?.click()} disabled={busy}>
        {busy ? "Importing…" : "Upload file"}
      </button>
      <span className="muted small">.txt, .md or .docx · up to 5 MB</span>
      {error && <span className="error" role="alert">{error}</span>}
    </div>
  );
}
