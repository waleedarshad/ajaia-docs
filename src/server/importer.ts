import mammoth from "mammoth";
import { marked } from "marked";
import { generateJSON } from "@tiptap/html/server";
import { editorExtensions } from "../lib/editorExtensions";
import { HttpError } from "./http";
import { MAX_CONTENT_CHARS } from "./validation";

export const SUPPORTED_EXTENSIONS = [".txt", ".md", ".markdown", ".docx"] as const;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type ImportedDocument = { title: string; content: Record<string, unknown> };

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function extensionOf(filename: string): string {
  const i = filename.lastIndexOf(".");
  return i === -1 ? "" : filename.slice(i).toLowerCase();
}

function titleFromFilename(filename: string): string {
  const base = filename.replace(/\.[^.]+$/, "").trim();
  return (base || "Imported document").slice(0, 120);
}

// Blank line = new paragraph; single newlines inside a paragraph become line breaks.
function textToHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function decodeUtf8(buffer: Buffer): string {
  return buffer.toString("utf8").replace(/^﻿/, "").replace(/\r\n?/g, "\n");
}

function isZip(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b; // "PK"
}

function hasText(node: unknown): boolean {
  if (!node || typeof node !== "object") return false;
  const n = node as { type?: string; text?: string; content?: unknown[] };
  if (n.type === "text" && n.text && n.text.trim()) return true;
  return Array.isArray(n.content) && n.content.some(hasText);
}

export async function convertFileToDoc(filename: string, buffer: Buffer): Promise<ImportedDocument> {
  const ext = extensionOf(filename);
  if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new HttpError(415, "Unsupported file type. Upload a .txt, .md or .docx file.");
  }
  if (buffer.length === 0) throw new HttpError(400, "That file is empty.");
  if (buffer.length > MAX_UPLOAD_BYTES) throw new HttpError(413, "File is too large. The limit is 5 MB.");

  let html: string;
  if (ext === ".docx") {
    if (!isZip(buffer)) throw new HttpError(422, "That doesn't look like a valid .docx file.");
    try {
      const result = await mammoth.convertToHtml(
        { buffer },
        {
          styleMap: ["u => u"],
          // Images aren't part of this editor's schema, so skip them instead of inlining huge base64.
          convertImage: mammoth.images.imgElement(async () => ({ src: "" })),
        },
      );
      html = result.value;
    } catch {
      throw new HttpError(422, "Couldn't read that .docx file. It may be corrupted or password-protected.");
    }
  } else if (ext === ".txt") {
    html = textToHtml(decodeUtf8(buffer));
  } else {
    html = marked.parse(decodeUtf8(buffer), { async: false, gfm: true }) as string;
  }

  // Parsing against the editor schema is also our sanitiser: unknown tags and attributes are dropped.
  const content = generateJSON(html, editorExtensions) as Record<string, unknown>;

  if (!hasText(content)) throw new HttpError(422, "No readable text was found in that file.");
  if (JSON.stringify(content).length > MAX_CONTENT_CHARS) {
    throw new HttpError(413, "That file has too much content to import (limit is about 1 MB of text).");
  }

  return { title: titleFromFilename(filename), content };
}
