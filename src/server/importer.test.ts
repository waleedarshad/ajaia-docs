import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { convertFileToDoc, MAX_UPLOAD_BYTES } from "./importer";

type Node = { type?: string; text?: string; attrs?: Record<string, unknown>; marks?: { type: string }[]; content?: Node[] };

function walk(node: Node, visit: (n: Node) => void) {
  visit(node);
  node.content?.forEach((c) => walk(c, visit));
}
const nodeTypes = (doc: unknown): string[] => {
  const found = new Set<string>();
  walk(doc as Node, (n) => n.type && found.add(n.type));
  return [...found];
};
const marksOf = (doc: unknown): string[] => {
  const found = new Set<string>();
  walk(doc as Node, (n) => n.marks?.forEach((m) => found.add(m.type)));
  return [...found].sort();
};
const textOf = (doc: unknown) => {
  const parts: string[] = [];
  walk(doc as Node, (n) => n.text && parts.push(n.text));
  return parts.join("");
};

describe("convertFileToDoc", () => {
  it("turns a .txt file into paragraphs and uses the filename as the title", async () => {
    const { title, content } = await convertFileToDoc("meeting notes.txt", Buffer.from("First line\nstill first\n\nSecond paragraph"));
    expect(title).toBe("meeting notes");
    expect(nodeTypes(content)).toContain("paragraph");
    expect(nodeTypes(content)).toContain("hardBreak");
    expect(textOf(content)).toContain("Second paragraph");
  });

  it("never lets markup in a .txt file through as formatting", async () => {
    const { content } = await convertFileToDoc("x.txt", Buffer.from("<script>alert(1)</script> <b>hi</b>"));
    expect(marksOf(content)).toEqual([]);
    expect(textOf(content)).toContain("<script>alert(1)</script>"); // kept as literal text
  });

  it("converts markdown headings, emphasis and lists", async () => {
    const md = "# Title\n\nSome **bold** and *italic* text.\n\n- one\n- two\n\n1. first\n2. second\n";
    const { content } = await convertFileToDoc("readme.md", Buffer.from(md));
    expect(nodeTypes(content)).toEqual(expect.arrayContaining(["heading", "bulletList", "orderedList", "listItem"]));
    expect(marksOf(content)).toEqual(["bold", "italic"]);
  });

  it("drops disallowed markup from markdown (schema acts as the sanitiser)", async () => {
    const { content } = await convertFileToDoc("x.md", Buffer.from("hello <script>alert(1)</script> world\n\n<img src=x onerror=alert(1)>"));
    expect(nodeTypes(content)).not.toContain("image");
    expect(JSON.stringify(content)).not.toContain("onerror");
  });

  it("converts a .docx with headings, bold/italic/underline and lists", async () => {
    const buffer = readFileSync(join(__dirname, "__fixtures__", "sample.docx"));
    const { title, content } = await convertFileToDoc("Quarterly Plan.docx", buffer);
    expect(title).toBe("Quarterly Plan");
    expect(nodeTypes(content)).toEqual(expect.arrayContaining(["heading", "bulletList", "orderedList"]));
    expect(marksOf(content)).toEqual(["bold", "italic", "underline"]);
    expect(textOf(content)).toContain("Ship the editor");
  });

  it("rejects unsupported types, empty files, oversized files and fake docx files", async () => {
    await expect(convertFileToDoc("a.pdf", Buffer.from("x"))).rejects.toMatchObject({ status: 415 });
    await expect(convertFileToDoc("a.txt", Buffer.alloc(0))).rejects.toMatchObject({ status: 400 });
    await expect(convertFileToDoc("a.txt", Buffer.alloc(MAX_UPLOAD_BYTES + 1, "a"))).rejects.toMatchObject({ status: 413 });
    await expect(convertFileToDoc("a.docx", Buffer.from("not a zip"))).rejects.toMatchObject({ status: 422 });
    await expect(convertFileToDoc("a.txt", Buffer.from("   \n\n  "))).rejects.toMatchObject({ status: 422 });
  });
});
