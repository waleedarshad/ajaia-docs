import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import { HttpError } from "./http";
import { canDelete, canEdit, resolveRole, type Role } from "./access";

export const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

export type DocumentSummary = {
  id: string;
  title: string;
  updatedAt: Date;
  shareCount: number;
};

export type SharedDocumentSummary = DocumentSummary & {
  ownerName: string;
  role: "EDITOR" | "VIEWER";
};

export async function listDocuments(userId: string) {
  const [owned, shared] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: "desc" },
      select: { id: true, title: true, updatedAt: true, _count: { select: { shares: true } } },
    }),
    prisma.document.findMany({
      where: { shares: { some: { userId } } },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        owner: { select: { name: true } },
        shares: { where: { userId }, select: { role: true } },
      },
    }),
  ]);

  const sharedWithMe: SharedDocumentSummary[] = shared.map((d) => ({
    id: d.id,
    title: d.title,
    updatedAt: d.updatedAt,
    shareCount: 0,
    ownerName: d.owner.name,
    role: d.shares[0].role,
  }));

  const ownedByMe: DocumentSummary[] = owned.map((d) => ({
    id: d.id,
    title: d.title,
    updatedAt: d.updatedAt,
    shareCount: d._count.shares,
  }));

  return { owned: ownedByMe, shared: sharedWithMe };
}

// Loads a document and the caller's role in one go. Users without access get a 404
// (not a 403) so we don't reveal which document ids exist.
export async function getDocumentForUser(docId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: { include: { user: { select: { id: true, name: true, email: true } } } },
    },
  });
  if (!doc) throw new HttpError(404, "Document not found");
  const role = resolveRole(
    { ownerId: doc.ownerId, shares: doc.shares.map((s) => ({ userId: s.userId, role: s.role })) },
    userId,
  );
  if (!role) throw new HttpError(404, "Document not found");
  return { doc, role: role as Role };
}

export async function createDocument(userId: string, title?: string) {
  return prisma.document.create({
    data: { ownerId: userId, title: title?.trim() || "Untitled document", content: EMPTY_DOC },
    select: { id: true, title: true },
  });
}

export async function renameDocument(docId: string, userId: string, title: string) {
  const { role } = await getDocumentForUser(docId, userId);
  if (!canEdit(role)) throw new HttpError(403, "You have view-only access to this document");
  return prisma.document.update({
    where: { id: docId },
    data: { title },
    select: { id: true, title: true, updatedAt: true },
  });
}

export async function deleteDocument(docId: string, userId: string) {
  const { role } = await getDocumentForUser(docId, userId);
  if (!canDelete(role)) throw new HttpError(403, "Only the owner can delete a document");
  await prisma.document.delete({ where: { id: docId } });
}

export async function saveContent(docId: string, userId: string, content: unknown) {
  const { role } = await getDocumentForUser(docId, userId);
  if (!canEdit(role)) throw new HttpError(403, "You have view-only access to this document");
  return prisma.document.update({
    where: { id: docId },
    data: { content: content as Prisma.InputJsonValue },
    select: { updatedAt: true },
  });
}
