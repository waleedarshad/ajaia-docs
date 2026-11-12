import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/session";
import { listDocuments } from "@/server/documents";
import { formatUpdated } from "@/lib/format";
import { AppHeader } from "@/components/AppHeader";
import { NewDocumentButton } from "./NewDocumentButton";
import { DocumentCard } from "./DocumentCard";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { owned, shared } = await listDocuments(user.id);

  return (
    <>
      <AppHeader user={user} />
      <main className="container">
        <div className="page-head">
          <h1>Your documents</h1>
          <div className="page-actions">
            <NewDocumentButton />
          </div>
        </div>

        <section>
          <h2 className="section-title">Owned by me <span className="count">{owned.length}</span></h2>
          {owned.length === 0 ? (
            <p className="muted empty">No documents yet. Create one to get started.</p>
          ) : (
            <div className="doc-grid">
              {owned.map((d) => (
                <DocumentCard key={d.id} id={d.id} title={d.title} updated={formatUpdated(d.updatedAt)} />
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="section-title">Shared with me <span className="count">{shared.length}</span></h2>
          {shared.length === 0 ? (
            <p className="muted empty">Nothing has been shared with you yet.</p>
          ) : (
            <div className="doc-grid">
              {shared.map((d) => (
                <DocumentCard
                  key={d.id}
                  id={d.id}
                  title={d.title}
                  updated={formatUpdated(d.updatedAt)}
                  shared={{ ownerName: d.ownerName, role: d.role }}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
