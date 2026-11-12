import { prisma } from "./db";
import { HttpError } from "./http";
import { canShare } from "./access";
import { getDocumentForUser } from "./documents";
import type { ShareRole } from "./access";

export type ShareEntry = {
  userId: string;
  name: string;
  email: string;
  role: ShareRole;
};

// Only the owner manages sharing. Anyone else who can see the document gets a 403;
// people with no access at all still get the 404 from getDocumentForUser.
async function requireOwner(docId: string, userId: string) {
  const { doc, role } = await getDocumentForUser(docId, userId);
  if (!canShare(role)) throw new HttpError(403, "Only the owner can manage sharing");
  return doc;
}

export async function listShares(docId: string, ownerId: string): Promise<ShareEntry[]> {
  const doc = await requireOwner(docId, ownerId);
  return doc.shares.map((s) => ({
    userId: s.userId,
    name: s.user.name,
    email: s.user.email,
    role: s.role,
  }));
}

// Grants access, or changes the role if the person already has it.
export async function shareDocument(docId: string, ownerId: string, email: string, role: ShareRole): Promise<ShareEntry> {
  const doc = await requireOwner(docId, ownerId);

  const target = await prisma.user.findUnique({
    where: { email },
    select: { id: true, name: true, email: true },
  });
  if (!target) throw new HttpError(404, "No user found with that email");
  if (target.id === doc.ownerId) throw new HttpError(400, "You already own this document");

  await prisma.documentShare.upsert({
    where: { documentId_userId: { documentId: docId, userId: target.id } },
    create: { documentId: docId, userId: target.id, role },
    update: { role },
  });

  return { userId: target.id, name: target.name, email: target.email, role };
}

export async function removeShare(docId: string, ownerId: string, targetUserId: string): Promise<void> {
  await requireOwner(docId, ownerId);
  await prisma.documentShare.deleteMany({ where: { documentId: docId, userId: targetUserId } });
}
