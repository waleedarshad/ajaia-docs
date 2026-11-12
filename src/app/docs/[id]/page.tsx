import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/server/session";
import { getDocumentForUser } from "@/server/documents";
import { canEdit } from "@/server/access";
import { HttpError } from "@/server/http";
import { AppHeader } from "@/components/AppHeader";
import { TitleEditor } from "@/components/TitleEditor";

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

  return (
    <>
      <AppHeader user={user}>
        <TitleEditor docId={doc.id} initialTitle={doc.title} readOnly={!canEdit(role)} />
      </AppHeader>
      <main className="container">
        <p className="muted">The editor arrives in the next phase.</p>
      </main>
    </>
  );
}
