import { NextResponse } from "next/server";
import { requireUser } from "@/server/session";
import { handleApiError } from "@/server/http";
import { deleteDocument, getDocumentForUser, renameDocument } from "@/server/documents";
import { RenameDocumentSchema } from "@/server/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { doc, role } = await getDocumentForUser(id, user.id);
    return NextResponse.json({
      document: { id: doc.id, title: doc.title, content: doc.content, updatedAt: doc.updatedAt, owner: doc.owner },
      role,
    });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = RenameDocumentSchema.parse(await req.json());
    return NextResponse.json({ document: await renameDocument(id, user.id, body.title) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await deleteDocument(id, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
