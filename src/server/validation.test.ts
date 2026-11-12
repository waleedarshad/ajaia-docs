import { describe, expect, it } from "vitest";
import { MAX_CONTENT_CHARS, RenameDocumentSchema, SaveContentSchema } from "./validation";

describe("RenameDocumentSchema", () => {
  it("trims whitespace", () => {
    expect(RenameDocumentSchema.parse({ title: "  Q4 plan  " }).title).toBe("Q4 plan");
  });

  it("rejects empty and over-long titles", () => {
    expect(RenameDocumentSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(RenameDocumentSchema.safeParse({ title: "x".repeat(121) }).success).toBe(false);
  });
});

describe("SaveContentSchema", () => {
  it("accepts a TipTap document with formatting marks", () => {
    const doc = {
      type: "doc",
      content: [
        { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Hello" }] },
        { type: "paragraph", content: [{ type: "text", text: "bold", marks: [{ type: "bold" }] }] },
      ],
    };
    expect(SaveContentSchema.safeParse({ content: doc }).success).toBe(true);
  });

  it("rejects payloads that are not a doc node", () => {
    expect(SaveContentSchema.safeParse({ content: { type: "paragraph" } }).success).toBe(false);
    expect(SaveContentSchema.safeParse({ content: "<p>html</p>" }).success).toBe(false);
    expect(SaveContentSchema.safeParse({}).success).toBe(false);
  });

  it("rejects oversized documents", () => {
    const big = { type: "doc", content: [{ type: "paragraph", text: "x".repeat(MAX_CONTENT_CHARS) }] };
    expect(SaveContentSchema.safeParse({ content: big }).success).toBe(false);
  });
});
