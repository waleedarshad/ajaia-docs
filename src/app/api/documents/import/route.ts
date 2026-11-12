import { NextResponse } from "next/server";
import { requireUser } from "@/server/session";
import { handleApiError, HttpError } from "@/server/http";
import { createDocument } from "@/server/documents";
import { convertFileToDoc, MAX_UPLOAD_BYTES } from "@/server/importer";

// Upload a .txt / .md / .docx file and turn it into a new editable document owned by the caller.
export async function POST(req: Request) {
  try {
    const user = await requireUser();

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new HttpError(400, "Expected a file upload.");
    }
    const file = form.get("file");
    if (!(file instanceof File)) throw new HttpError(400, "No file was uploaded.");
    if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, "File is too large. The limit is 4 MB.");

    const { title, content } = await convertFileToDoc(file.name, Buffer.from(await file.arrayBuffer()));
    const doc = await createDocument(user.id, title, content);
    return NextResponse.json({ document: doc }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
