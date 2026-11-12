import { z } from "zod";

export const TitleSchema = z
  .string()
  .trim()
  .min(1, "Title can't be empty")
  .max(120, "Title must be 120 characters or fewer");

export const CreateDocumentSchema = z.object({ title: TitleSchema.optional() });
export const RenameDocumentSchema = z.object({ title: TitleSchema });

// Document body as TipTap/ProseMirror JSON. We only check the envelope and size here;
// the editor schema is the source of truth for what node types are allowed inside.
export const MAX_CONTENT_CHARS = 1_000_000;

export const SaveContentSchema = z
  .object({
    content: z
      .object({
        type: z.literal("doc"),
        content: z.array(z.record(z.string(), z.unknown())).optional(),
      })
      .passthrough(),
  })
  .refine((v) => JSON.stringify(v.content).length <= MAX_CONTENT_CHARS, {
    message: "Document is too large to save (limit is about 1 MB)",
    path: ["content"],
  });
