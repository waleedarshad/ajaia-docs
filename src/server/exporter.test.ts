import { describe, expect, it } from "vitest";
import { documentToMarkdown, exportFilename } from "./exporter";

const p = (...content: object[]) => ({ type: "paragraph", content });
const t = (text: string, ...marks: string[]) => ({ type: "text", text, marks: marks.map((type) => ({ type })) });

describe("documentToMarkdown", () => {
  it("starts with the title and renders headings and paragraphs", () => {
    const md = documentToMarkdown("Plan", {
      type: "doc",
      content: [{ type: "heading", attrs: { level: 2 }, content: [t("Goals")] }, p(t("Ship it."))],
    });
    expect(md).toBe("# Plan\n\n## Goals\n\nShip it.\n");
  });

  it("renders bold, italic, strike and inline code", () => {
    const md = documentToMarkdown("T", { type: "doc", content: [p(t("a", "bold"), t(" b", "italic"), t(" c", "strike"), t(" "), t("d", "code"))] });
    expect(md).toContain("**a** *b* ~~c~~ `d`");
  });

  it("keeps spaces outside bold markers", () => {
    const md = documentToMarkdown("T", { type: "doc", content: [p(t("hello ", "bold"), t("world"))] });
    expect(md).toContain("**hello** world");
  });

  it("renders bullet, ordered and nested lists", () => {
    const li = (text: string, ...extra: object[]) => ({ type: "listItem", content: [p(t(text)), ...extra] });
    const md = documentToMarkdown("T", {
      type: "doc",
      content: [
        { type: "bulletList", content: [li("one", { type: "bulletList", content: [li("inner")] }), li("two")] },
        { type: "orderedList", attrs: { start: 1 }, content: [li("first"), li("second")] },
      ],
    });
    expect(md).toContain("- one\n  - inner\n- two");
    expect(md).toContain("1. first\n2. second");
  });

  it("renders blockquotes, code blocks and rules", () => {
    const md = documentToMarkdown("T", {
      type: "doc",
      content: [
        { type: "blockquote", content: [p(t("quoted"))] },
        { type: "codeBlock", content: [{ type: "text", text: "let x = 1;" }] },
        { type: "horizontalRule" },
      ],
    });
    expect(md).toContain("> quoted");
    expect(md).toContain("```\nlet x = 1;\n```");
    expect(md).toContain("\n---\n");
  });

  it("escapes characters that would be read as Markdown", () => {
    const md = documentToMarkdown("T", { type: "doc", content: [p(t("2 * 3 = 6 and _x_"))] });
    expect(md).toContain("2 \\* 3 = 6 and \\_x\\_");
  });

  it("handles an empty document", () => {
    expect(documentToMarkdown("Empty", { type: "doc", content: [] })).toBe("# Empty\n\n\n");
  });
});

describe("exportFilename", () => {
  it("makes a safe filename", () => {
    expect(exportFilename("Q3 plan: draft/final?", "md")).toBe("Q3-plan-draft-final.md");
  });
  it("falls back when the title has no usable characters", () => {
    expect(exportFilename("???", "md")).toBe("document.md");
  });
});
