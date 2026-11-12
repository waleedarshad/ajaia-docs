import { z } from "zod";

export const TitleSchema = z
  .string()
  .trim()
  .min(1, "Title can't be empty")
  .max(120, "Title must be 120 characters or fewer");

export const CreateDocumentSchema = z.object({ title: TitleSchema.optional() });
export const RenameDocumentSchema = z.object({ title: TitleSchema });
