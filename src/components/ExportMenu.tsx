"use client";

// Markdown is a real file download from the API. PDF uses the browser's print dialog
// ("Save as PDF") with a print stylesheet, which needs no server-side PDF engine and
// works the same on Vercel and in Docker.
export function ExportMenu({ docId }: { docId: string }) {
  return (
    <div className="export-menu">
      <a className="btn btn-sm" href={`/api/documents/${docId}/export?format=md`} download>
        Export .md
      </a>
      <button type="button" className="btn btn-sm" onClick={() => window.print()}>
        Export PDF
      </button>
    </div>
  );
}
