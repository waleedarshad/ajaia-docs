import { NextResponse } from "next/server";
import { requireUser } from "@/server/session";
import { handleApiError } from "@/server/http";
import { removeShare } from "@/server/sharing";

type Ctx = { params: Promise<{ id: string; userId: string }> };

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id, userId } = await params;
    await removeShare(id, user.id, userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}
