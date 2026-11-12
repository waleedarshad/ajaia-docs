import { notFound, redirect } from "next/navigation";
import type { JSONContent } from "@tiptap/react";
import { getCurrentUser } from "@/server/session";
import { getDocumentForUser } from "@/server/documents";
import { canEdit } from "@/server/access";
import { HttpError } from "@/server/http";
import { AppHeader } from "@/components/AppHeader";
import { TitleEditor } from "@/components/TitleEditor";
import { DocumentEditor } from "@/components/DocumentEditor";

export const dynamic = "force-dynamic";

export default async function DocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { id } = await params;

  let result;
  try {
    result = await getDocumentForUser(id, user.id);
  } catch (e) {
    if (e instanceof HttpError && e.status === 404) notFound();
    throw e;
  }
  const { doc, role } = result;
  const editable = canEdit(role);

  return (
    <>
      <AppHeader user={user}>
        <TitleEditor docId={doc.id} initialTitle={doc.title} readOnly={!editable} />
      </AppHeader>
      {/* key forces a fresh editor if the user navigates between documents */}
      <DocumentEditor key={doc.id} docId={doc.id} initialContent={doc.content as JSONContent} canEdit={editable} />
    </>
  );
}
