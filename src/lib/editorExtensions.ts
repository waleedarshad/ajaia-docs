import StarterKit from "@tiptap/starter-kit";

// Single source of truth for the document schema. The editor and the file importer both
// use this list, so anything the importer produces is guaranteed to be valid in the editor,
// and anything outside the schema (scripts, images, unknown tags) is dropped on import.
export const editorExtensions = [StarterKit.configure({ link: false })];
