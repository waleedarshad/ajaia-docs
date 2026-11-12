// Converts the editor's document JSON (TipTap/ProseMirror) into Markdown.
// Pure function, no I/O, so it is easy to test. It only handles the nodes and marks our
// editor schema can produce (StarterKit); unknown nodes fall back to their children's text.

type Mark = { type: string };
type Node = { type?: string; text?: string; marks?: Mark[]; attrs?: Record<string, unknown>; content?: Node[] };

const SPECIALS = /([\\`*_[\]#])/g;

function escapeText(text: string): string {
  return text.replace(SPECIALS, "\\$1");
}

function inline(node: Node): string {
  if (node.type === "hardBreak") return "  \n";
  if (node.type !== "text" || !node.text) return (node.content ?? []).map(inline).join("");
  const marks = new Set((node.marks ?? []).map((m) => m.type));
  if (marks.has("code")) return "`" + node.text + "`";
  let out = escapeText(node.text);
  // Keep surrounding spaces outside the markers so "**bold **" doesn't break.
  const lead = out.match(/^\s*/)?.[0] ?? "";
  const trail = out.match(/\s*$/)?.[0] ?? "";
  let core = out.trim();
  if (!core) return out;
  if (marks.has("bold")) core = `**${core}**`;
  if (marks.has("italic")) core = `*${core}*`;
  if (marks.has("strike")) core = `~~${core}~~`;
  if (marks.has("underline")) core = `<u>${core}</u>`; // Markdown has no underline
  return lead + core + trail;
}

function inlineChildren(node: Node): string {
  return (node.content ?? []).map(inline).join("");
}

function indent(text: string, prefix: string, hangingPrefix: string): string {
  return text
    .split("\n")
    .map((line, i) => (line === "" ? "" : (i === 0 ? prefix : hangingPrefix) + line))
    .join("\n");
}

function block(node: Node): string {
  const children = () => (node.content ?? []).map(block).filter((s) => s !== "");
  switch (node.type) {
    case "paragraph":
      return inlineChildren(node);
    case "heading": {
      const level = Math.min(Math.max(Number(node.attrs?.level ?? 1), 1), 6);
      return `${"#".repeat(level)} ${inlineChildren(node)}`;
    }
    case "bulletList":
      return (node.content ?? []).map((li) => indent(listItem(li), "- ", "  ")).join("\n");
    case "orderedList": {
      const start = Number(node.attrs?.start ?? 1);
      return (node.content ?? [])
        .map((li, i) => {
          const marker = `${start + i}. `;
          return indent(listItem(li), marker, " ".repeat(marker.length));
        })
        .join("\n");
    }
    case "blockquote":
      return indent(children().join("\n\n"), "> ", "> ");
    case "codeBlock": {
      const lang = typeof node.attrs?.language === "string" ? node.attrs.language : "";
      const code = (node.content ?? []).map((c) => c.text ?? "").join("");
      return "```" + lang + "\n" + code + "\n```";
    }
    case "horizontalRule":
      return "---";
    default:
      return children().join("\n\n");
  }
}

function listItem(li: Node): string {
  // Tight list: join paragraphs and nested lists with single newlines.
  return (li.content ?? []).map(block).filter((s) => s !== "").join("\n");
}

export function documentToMarkdown(title: string, doc: Node): string {
  const body = (doc.content ?? []).map(block).join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
  return `# ${escapeText(title)}\n\n${body}\n`;
}

// "Q3 plan: draft/final?" -> "Q3-plan-draft-final", safe for a download filename.
export function exportFilename(title: string, ext: string): string {
  const base = title.trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "document";
  return `${base}.${ext}`;
}
