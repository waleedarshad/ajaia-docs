import { NextResponse } from "next/server";
import { requireUser } from "@/server/session";
import { handleApiError } from "@/server/http";
import { deleteComment } from "@/server/comments";

type Ctx = { params: Promise<{ id: string; commentId: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id, commentId } = await params;
    await deleteComment(id, user.id, commentId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
