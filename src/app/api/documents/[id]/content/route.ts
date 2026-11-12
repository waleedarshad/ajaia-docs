import { NextResponse } from "next/server";
import { requireUser } from "@/server/session";
import { handleApiError } from "@/server/http";
import { saveContent } from "@/server/documents";
import { SaveContentSchema } from "@/server/validation";

type Ctx = { params: Promise<{ id: string }> };

// Called by the editor's autosave. Kept separate from PATCH (rename) so a title
// change never has to carry the whole document body.
export async function PUT(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = SaveContentSchema.parse(await req.json());
    const { updatedAt } = await saveContent(id, user.id, body.content);
    return NextResponse.json({ ok: true, updatedAt });
  } catch (err) {
    return handleApiError(err);
  }
}
