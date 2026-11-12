import { NextResponse } from "next/server";
import { requireUser } from "@/server/session";
import { handleApiError } from "@/server/http";
import { createDocument, listDocuments } from "@/server/documents";
import { CreateDocumentSchema } from "@/server/validation";

export async function GET() {
  try {
    const user = await requireUser();
    return NextResponse.json(await listDocuments(user.id));
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = CreateDocumentSchema.parse(await req.json().catch(() => ({})));
    const doc = await createDocument(user.id, body.title);
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
