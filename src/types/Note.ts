import type { NoteContent } from "../lib/noteSchema.ts";

export type Note = {
  id: string
  title: string
  content: NoteContent
  categoryId: string | null
  createdAt: string
  updatedAt: string
}