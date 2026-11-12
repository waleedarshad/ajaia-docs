import { requireUser } from "@/server/session";
import { handleApiError } from "@/server/http";
import { getDocumentForUser } from "@/server/documents";
import { documentToMarkdown, exportFilename } from "@/server/exporter";

type Ctx = { params: Promise<{ id: string }> };

// Any role that can read the document (owner, editor, viewer) may export it.
// getDocumentForUser already returns 404 to strangers.
export async function GET(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { doc } = await getDocumentForUser(id, user.id);
    const format = new URL(req.url).searchParams.get("format") ?? "md";
    if (format !== "md") {
      return Response.json({ error: "Unsupported format. Use ?format=md (PDF is done with the browser's print dialog)." }, { status: 400 });
    }
    const markdown = documentToMarkdown(doc.title, doc.content as Parameters<typeof documentToMarkdown>[1]);
    return new Response(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${exportFilename(doc.title, "md")}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
