import { NextResponse } from "next/server";
import { requireUser } from "@/server/session";
import { handleApiError } from "@/server/http";
import { listShares, shareDocument } from "@/server/sharing";
import { ShareSchema } from "@/server/validation";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return NextResponse.json({ shares: await listShares(id, user.id) });
  } catch (err) {
    return handleApiError(err);
  }
}

// POST is an upsert: sharing again with a different role updates the existing share.
export async function POST(req: Request, { params }: Ctx) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = ShareSchema.parse(await req.json());
    const share = await shareDocument(id, user.id, body.email, body.role);
    return NextResponse.json({ share });
  } catch (err) {
    return handleApiError(err);
  }
}
