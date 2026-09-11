import type { JSONContent } from '@tiptap/core'
import { createId } from '../utils/CyptoID.ts'

export type ParagraphBlock = {
  id: string
  type: 'paragraph'
  content: string
}

export type HeadingBlock = {
  id: string
  type: 'heading'
  level: 1 | 2 | 3 | 4
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
          id: createId(),
        },
      },
    ],
  }
}
