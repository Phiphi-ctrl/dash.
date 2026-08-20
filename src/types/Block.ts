import type { JSONContent } from '@tiptap/core'

export type ParagraphBlock = {
  id: string
  type: 'paragraph'
  content: string
}

export type HeadingBlock = {
  id: string
  type: 'heading'
  level: 1 | 2 | 3
  content: string
}

export type DashBlock =
  | ParagraphBlock
  | HeadingBlock

/*
 * New single-document model
 */
export type DashDocument = JSONContent

export function createEmptyDashDocument(): DashDocument {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        attrs: {
          id: crypto.randomUUID(),
        },
      },
    ],
  }
}