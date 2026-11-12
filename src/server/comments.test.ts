/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

// In-memory stand-in for Prisma so the real comment and permission code runs unchanged.
const db = vi.hoisted(() => ({
  users: [] as any[],
  docs: [] as any[],
  shares: [] as any[],
  comments: [] as any[],
  nextId: 1, // only ever goes up, like real ids, so deleting never frees an id for reuse
}));

vi.mock("./db", () => {
  const userById = (id: string) => db.users.find((u) => u.id === id);
  const withAuthor = (c: any) => ({ ...c, author: { name: userById(c.authorId).name } });
  return {
    prisma: {
      document: {
        findUnique: async ({ where }: any) => {
          const d = db.docs.find((x) => x.id === where.id);
          if (!d) return null;
          return {
            ...d,
            owner: userById(d.ownerId),
            shares: db.shares.filter((s) => s.documentId === d.id).map((s) => ({ ...s, user: userById(s.userId) })),
          };
        },
      },
      comment: {
        findMany: async ({ where }: any) =>
          db.comments.filter((c) => c.documentId === where.documentId).map(withAuthor),
        create: async ({ data }: any) => {
          const c = { id: `c${db.nextId++}`, createdAt: new Date("2026-11-12T10:00:00Z"), ...data };
          db.comments.push(c);
          return withAuthor(c);
        },
        findUnique: async ({ where }: any) => db.comments.find((c) => c.id === where.id) ?? null,
        delete: async ({ where }: any) => {
          db.comments = db.comments.filter((c) => c.id !== where.id);
        },
      },
    },
  };
});

import { addComment, deleteComment, listComments } from "./comments";
import { CommentSchema } from "./validation";

const DOC = "doc1";
const content = { type: "doc", content: [{ type: "paragraph" }] };

beforeEach(() => {
  db.users = [
    { id: "alice", name: "Alice" },
    { id: "bob", name: "Bob" },
    { id: "carol", name: "Carol" },
    { id: "mallory", name: "Mallory" },
  ];
  db.docs = [
    { id: DOC, ownerId: "alice", title: "Plan", content },
    { id: "doc2", ownerId: "mallory", title: "Other", content },
  ];
  db.shares = [
    { id: "s1", documentId: DOC, userId: "bob", role: "EDITOR" },
    { id: "s2", documentId: DOC, userId: "carol", role: "VIEWER" },
  ];
  db.comments = [];
  db.nextId = 1;
});

describe("comments", () => {
  it("lets the owner, an editor and a view-only user all comment", async () => {
    await addComment(DOC, "alice", "owner note");
    await addComment(DOC, "bob", "editor note");
    await addComment(DOC, "carol", "viewer note");
    const list = await listComments(DOC, "carol");
    expect(list.map((c) => c.authorName)).toEqual(["Alice", "Bob", "Carol"]);
  });

  it("hides the document from strangers (404) for reading and writing", async () => {
    await expect(listComments(DOC, "mallory")).rejects.toMatchObject({ status: 404 });
    await expect(addComment(DOC, "mallory", "hi")).rejects.toMatchObject({ status: 404 });
  });

  it("marks who can delete each comment", async () => {
    await addComment(DOC, "carol", "viewer note");
    expect((await listComments(DOC, "carol"))[0].canDelete).toBe(true); // author
    expect((await listComments(DOC, "alice"))[0].canDelete).toBe(true); // owner moderates
    expect((await listComments(DOC, "bob"))[0].canDelete).toBe(false); // someone else
  });

  it("lets the author and the owner delete, but not other collaborators", async () => {
    await addComment(DOC, "carol", "one");
    await expect(deleteComment(DOC, "bob", "c1")).rejects.toMatchObject({ status: 403 });
    await deleteComment(DOC, "carol", "c1");
    expect(db.comments).toHaveLength(0);

    await addComment(DOC, "bob", "two");
    await deleteComment(DOC, "alice", "c2");
    expect(db.comments).toHaveLength(0);
  });

  it("does not delete a comment through a different document's URL", async () => {
    db.shares.push({ id: "s3", documentId: "doc2", userId: "alice", role: "EDITOR" });
    await addComment(DOC, "alice", "mine");
    // Alice can open doc2, but the comment belongs to DOC.
    await expect(deleteComment("doc2", "alice", "c1")).rejects.toMatchObject({ status: 404 });
    expect(db.comments).toHaveLength(1);
  });

  it("returns 404 for an unknown comment", async () => {
    await expect(deleteComment(DOC, "alice", "nope")).rejects.toMatchObject({ status: 404 });
  });
});

describe("CommentSchema", () => {
  it("trims and accepts normal text", () => {
    expect(CommentSchema.parse({ body: "  hello  " }).body).toBe("hello");
  });
  it("rejects empty and over-long comments", () => {
    expect(CommentSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(CommentSchema.safeParse({ body: "x".repeat(2001) }).success).toBe(false);
  });
});
