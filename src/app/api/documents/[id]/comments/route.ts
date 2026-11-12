import { NextResponse } from "next/server";
import { requireUser } from "@/server/session";
import { handleApiError } from "@/server/http";
import { addComment, listComments } from "@/server/comments";
import { CommentSchema } from "@/server/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return NextResponse.json({ comments: await listComments(id, user.id) });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = CommentSchema.parse(await req.json());
    return NextResponse.json({ comment: await addComment(id, user.id, body.body) }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
