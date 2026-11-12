/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from "vitest";

// A tiny in-memory stand-in for Prisma. The real sharing/permission code runs unchanged
// on top of it, so these tests exercise the actual rules end to end without a database.
const db = vi.hoisted(() => ({
  users: [] as any[],
  docs: [] as any[],
  shares: [] as any[],
}));

vi.mock("./db", () => {
  const userById = (id: string) => db.users.find((u) => u.id === id);
  return {
    prisma: {
      document: {
        findUnique: async ({ where }: any) => {
          const d = db.docs.find((x) => x.id === where.id);
          if (!d) return null;
          return {
            ...d,
            owner: userById(d.ownerId),
            shares: db.shares
              .filter((s) => s.documentId === d.id)
              .map((s) => ({ ...s, user: userById(s.userId) })),
          };
        },
        update: async ({ where, data }: any) => {
          const d = db.docs.find((x) => x.id === where.id);
          Object.assign(d, data);
          return { ...d, updatedAt: new Date() };
        },
        delete: async ({ where }: any) => {
          db.docs = db.docs.filter((x) => x.id !== where.id);
        },
      },
      user: {
        findUnique: async ({ where }: any) => db.users.find((u) => u.email === where.email) ?? null,
      },
      documentShare: {
        upsert: async ({ where, create, update }: any) => {
          const { documentId, userId } = where.documentId_userId;
          const existing = db.shares.find((s) => s.documentId === documentId && s.userId === userId);
          if (existing) Object.assign(existing, update);
          else db.shares.push({ id: `s${db.shares.length + 1}`, ...create });
        },
        deleteMany: async ({ where }: any) => {
          db.shares = db.shares.filter((s) => !(s.documentId === where.documentId && s.userId === where.userId));
        },
      },
    },
  };
});

import { deleteDocument, getDocumentForUser, renameDocument, saveContent } from "./documents";
import { listShares, removeShare, shareDocument } from "./sharing";

const DOC = "doc1";
const content = { type: "doc", content: [{ type: "paragraph" }] };

beforeEach(() => {
  db.users = [
    { id: "alice", name: "Alice", email: "alice@ajaia.test" },
    { id: "bob", name: "Bob", email: "bob@ajaia.test" },
    { id: "carol", name: "Carol", email: "carol@ajaia.test" },
    { id: "mallory", name: "Mallory", email: "mallory@ajaia.test" },
  ];
  db.docs = [{ id: DOC, ownerId: "alice", title: "Plan", content }];
  db.shares = [];
});

describe("sharing a document", () => {
  it("lets the owner grant access by email, and the grantee can then open it", async () => {
    await shareDocument(DOC, "alice", "bob@ajaia.test", "EDITOR");

    const { role } = await getDocumentForUser(DOC, "bob");
    expect(role).toBe("EDITOR");
    expect((await listShares(DOC, "alice")).map((s) => s.email)).toEqual(["bob@ajaia.test"]);
  });

  it("changes the role when the same person is shared with again", async () => {
    await shareDocument(DOC, "alice", "bob@ajaia.test", "EDITOR");
    await shareDocument(DOC, "alice", "bob@ajaia.test", "VIEWER");

    expect(db.shares).toHaveLength(1);
    expect((await getDocumentForUser(DOC, "bob")).role).toBe("VIEWER");
  });

  it("rejects unknown emails and sharing with yourself", async () => {
    await expect(shareDocument(DOC, "alice", "nobody@ajaia.test", "EDITOR")).rejects.toMatchObject({ status: 404 });
    await expect(shareDocument(DOC, "alice", "alice@ajaia.test", "EDITOR")).rejects.toMatchObject({ status: 400 });
  });

  it("only lets the owner manage sharing", async () => {
    await shareDocument(DOC, "alice", "bob@ajaia.test", "EDITOR");

    // An editor can see the doc but must not re-share it or list its shares.
    await expect(shareDocument(DOC, "bob", "carol@ajaia.test", "EDITOR")).rejects.toMatchObject({ status: 403 });
    await expect(listShares(DOC, "bob")).rejects.toMatchObject({ status: 403 });
    // A stranger can't even tell the document exists.
    await expect(shareDocument(DOC, "mallory", "carol@ajaia.test", "EDITOR")).rejects.toMatchObject({ status: 404 });
  });

  it("revokes access when a share is removed", async () => {
    await shareDocument(DOC, "alice", "bob@ajaia.test", "EDITOR");
    await removeShare(DOC, "alice", "bob");

    await expect(getDocumentForUser(DOC, "bob")).rejects.toMatchObject({ status: 404 });
  });
});

describe("what each role can do to a document", () => {
  beforeEach(async () => {
    await shareDocument(DOC, "alice", "bob@ajaia.test", "EDITOR");
    await shareDocument(DOC, "alice", "carol@ajaia.test", "VIEWER");
  });

  it("owner and editor can save content, viewer cannot", async () => {
    await expect(saveContent(DOC, "alice", content)).resolves.toBeDefined();
    await expect(saveContent(DOC, "bob", content)).resolves.toBeDefined();
    await expect(saveContent(DOC, "carol", content)).rejects.toMatchObject({ status: 403 });
  });

  it("viewer cannot rename, editor can", async () => {
    await expect(renameDocument(DOC, "bob", "Renamed")).resolves.toMatchObject({ title: "Renamed" });
    await expect(renameDocument(DOC, "carol", "Nope")).rejects.toMatchObject({ status: 403 });
  });

  it("only the owner can delete", async () => {
    await expect(deleteDocument(DOC, "bob")).rejects.toMatchObject({ status: 403 });
    await expect(deleteDocument(DOC, "mallory")).rejects.toMatchObject({ status: 404 });
    await deleteDocument(DOC, "alice");
    expect(db.docs).toHaveLength(0);
  });
});
