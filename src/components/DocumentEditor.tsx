"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor, type JSONContent } from "@tiptap/react";
import { editorExtensions } from "@/lib/editorExtensions";

type Props = {
  docId: string;
  initialContent: JSONContent;
  canEdit: boolean;
};

type SaveStatus = "saved" | "unsaved" | "saving" | "error";

const AUTOSAVE_DELAY_MS = 1000;

export function DocumentEditor({ docId, initialContent, canEdit }: Props) {
  const [status, setStatus] = useState<SaveStatus>("saved");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // The latest document JSON lives in a ref so saving doesn't depend on the editor
  // instance still being mounted (e.g. when navigating away right after typing).
  const latest = useRef<JSONContent>(initialContent);
  const dirty = useRef(false);
  const inFlight = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async () => {
    if (inFlight.current || !dirty.current) return;
    inFlight.current = true;
    dirty.current = false;
    setStatus("saving");
    try {
      const res = await fetch(`/api/documents/${docId}/content`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: latest.current }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Couldn't save your changes");
      }
      inFlight.current = false;
      setErrorMessage(null);
      // More edits arrived while this request was in flight: save again.
      if (dirty.current) {
        void save();
      } else {
        setStatus("saved");
      }
    } catch (e) {
      inFlight.current = false;
      dirty.current = true; // keep the changes so a retry sends them
      setErrorMessage(e instanceof Error ? e.message : "Couldn't save your changes");
      setStatus("error");
    }
  }, [docId]);

  const editor = useEditor({
    extensions: editorExtensions,
    content: initialContent,
    editable: canEdit,
    immediatelyRender: false, // avoid a hydration mismatch with server rendering
    shouldRerenderOnTransaction: true, // keeps toolbar active states in sync
    editorProps: {
      attributes: { class: "prose-editor", "aria-label": "Document body" },
    },
    onUpdate({ editor }) {
      latest.current = editor.getJSON();
      dirty.current = true;
      setStatus("unsaved");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void save(), AUTOSAVE_DELAY_MS);
    },
  });

  // Flush pending changes when leaving the page, and warn if something is still unsaved.
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (dirty.current || inFlight.current) {
        e.preventDefault();
        void save();
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      if (timer.current) clearTimeout(timer.current);
      if (dirty.current) void save(); // client-side navigation away
    };
  }, [save]);

  return (
    <div className="editor-page">
      {canEdit ? (
        <Toolbar editor={editor} status={status} errorMessage={errorMessage} onRetry={() => void save()} />
      ) : (
        <div className="toolbar toolbar-readonly">
          <span className="badge badge-shared">View only. You can read this document but not edit it.</span>
        </div>
      )}
      <div className="sheet">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function Toolbar({
  editor,
  status,
  errorMessage,
  onRetry,
}: {
  editor: Editor | null;
  status: SaveStatus;
  errorMessage: string | null;
  onRetry: () => void;
}) {
  if (!editor) return <div className="toolbar" />;

  // onMouseDown + preventDefault keeps the text selection while clicking toolbar buttons.
  const btn = (label: string, title: string, active: boolean, run: () => void, extraClass = "") => (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={`tb-btn ${active ? "is-active" : ""} ${extraClass}`}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
    >
      {label}
    </button>
  );

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <div className="tb-group">
        {btn("B", "Bold (Ctrl/Cmd+B)", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "tb-bold")}
        {btn("I", "Italic (Ctrl/Cmd+I)", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "tb-italic")}
        {btn("U", "Underline (Ctrl/Cmd+U)", editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), "tb-underline")}
      </div>
      <div className="tb-group">
        {btn("Normal", "Normal text", editor.isActive("paragraph"), () => editor.chain().focus().setParagraph().run())}
        {btn("H1", "Heading 1", editor.isActive("heading", { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run())}
        {btn("H2", "Heading 2", editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run())}
        {btn("H3", "Heading 3", editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run())}
      </div>
      <div className="tb-group">
        {btn("• List", "Bulleted list", editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run())}
        {btn("1. List", "Numbered list", editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run())}
      </div>
      <div className="tb-group">
        {btn("Undo", "Undo", false, () => editor.chain().focus().undo().run())}
        {btn("Redo", "Redo", false, () => editor.chain().focus().redo().run())}
      </div>
      <div className="save-status" aria-live="polite">
        {status === "saved" && <span className="muted">Saved</span>}
        {status === "unsaved" && <span className="muted">Unsaved changes…</span>}
        {status === "saving" && <span className="muted">Saving…</span>}
        {status === "error" && (
          <span className="error">
            {errorMessage ?? "Couldn't save"}{" "}
            <button type="button" className="link-btn" onClick={onRetry}>
              Retry
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
