// Pure access-control logic. No database calls here on purpose: every route
// resolves a user's role through this one function, and it is trivial to unit test.

export type ShareRole = "EDITOR" | "VIEWER";
export type Role = "OWNER" | ShareRole;

export type AccessSubject = {
  ownerId: string;
  shares: { userId: string; role: ShareRole }[];
};

export function resolveRole(doc: AccessSubject, userId: string): Role | null {
  if (doc.ownerId === userId) return "OWNER";
  const share = doc.shares.find((s) => s.userId === userId);
  return share ? share.role : null;
}

export const canEdit = (role: Role | null): boolean => role === "OWNER" || role === "EDITOR";
export const canShare = (role: Role | null): boolean => role === "OWNER";
export const canDelete = (role: Role | null): boolean => role === "OWNER";

// Comments: anyone who can open the document can read and write comments (viewers included,
// that is the point of a view-only role). A comment can be removed by its author or by the
// document owner, so the owner can moderate their own document.
export const canComment = (role: Role | null): boolean => role !== null;
export const canDeleteComment = (role: Role | null, isAuthor: boolean): boolean =>
  role === "OWNER" || (role !== null && isAuthor);
