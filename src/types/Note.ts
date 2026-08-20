import type { NoteContent } from "../lib/noteSchema.ts";

export type Note = {
  id: string
  title: string
  content: NoteContent

  folderId: string | null

  createdAt: string
  updatedAt: string
}

export type NoteFolder =
    | {
  id: string
  kind: 'category'
  categoryId: string
  parentId: null
  createdAt: string
}
    | {
  id: string
  kind: 'custom'
  name: string
  parentId: string | null
  createdAt: string
}