import { prisma } from "./db";
import { HttpError } from "./http";
import { canComment, canDeleteComment, type Role } from "./access";
import { getDocumentForUser } from "./documents";

export type CommentEntry = {
  id: string;
  body: string;
  createdAt: string;
  authorId: string;
  authorName: string;
  canDelete: boolean;
};

type CommentRow = { id: string; body: string; createdAt: Date; authorId: string; author: { name: string } };

function toEntry(c: CommentRow, role: Role | null, userId: string): CommentEntry {
  return {
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    authorId: c.authorId,
    authorName: c.author.name,
    canDelete: canDeleteComment(role, c.authorId === userId),
  };
}

// getDocumentForUser gives strangers a 404, so comments never leak the document's existence.
export async function listComments(docId: string, userId: string): Promise<CommentEntry[]> {
  const { role } = await getDocumentForUser(docId, userId);
  const rows = await prisma.comment.findMany({
    where: { documentId: docId },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true } } },
  });
  return rows.map((c: CommentRow) => toEntry(c, role, userId));
}

export async function addComment(docId: string, userId: string, body: string): Promise<CommentEntry> {
  const { role } = await getDocumentForUser(docId, userId);
  if (!canComment(role)) throw new HttpError(403, "You can't comment on this document");
  const row = await prisma.comment.create({
    data: { documentId: docId, authorId: userId, body },
    include: { author: { select: { name: true } } },
  });
  return toEntry(row as CommentRow, role, userId);
}

export async function deleteComment(docId: string, userId: string, commentId: string): Promise<void> {
  const { role } = await getDocumentForUser(docId, userId);
  const existing = await prisma.comment.findUnique({ where: { id: commentId } });
  // A comment id from a different document must not be deletable through this one.
  if (!existing || existing.documentId !== docId) throw new HttpError(404, "Comment not found");
  if (!canDeleteComment(role, existing.authorId === userId)) {
    throw new HttpError(403, "Only the author or the document owner can delete a comment");
  }
  await prisma.comment.delete({ where: { id: commentId } });
}
