import type { DashDocument } from './Block.ts'

export type Note = {
  id: string
  title: string
  document: DashDocument
  categoryId: string | null
  createdAt: string
  updatedAt: string
}