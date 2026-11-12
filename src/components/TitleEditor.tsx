"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = { docId: string; initialTitle: string; readOnly?: boolean };

// Inline rename: saves on blur or Enter, reverts if the server rejects the title.
export function TitleEditor({ docId, initialTitle, readOnly }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialTitle);
  const [value, setValue] = useState(initialTitle);
  const [error, setError] = useState<string | null>(null);

  async function commit() {
    const next = value.trim();
    if (next === saved) {
      setValue(saved);
      return;
    }
    if (!next) {
      setValue(saved);
      setError("Title can't be empty");
      return;
    }
    try {
      const res = await fetch(`/api/documents/${docId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Couldn't rename");
      setSaved(data.document.title);
      setValue(data.document.title);
      setError(null);
      router.refresh();
    } catch (e) {
      setValue(saved);
      setError(e instanceof Error ? e.message : "Couldn't rename");
    }
  }

  return (
    <div className="title-editor">
      <input
        className="title-input"
        value={value}
        readOnly={readOnly}
        maxLength={120}
        aria-label="Document title"
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "Escape") setValue(saved);
        }}
      />
      {error && <span className="error" role="alert">{error}</span>}
    </div>
  );
}
