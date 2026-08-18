import { BlockNoteSchema } from '@blocknote/core'
import {
  createReactMathBlockSpec,
  createReactInlineMathSpec,
} from '@blocknote/math-block'

export const noteSchema = BlockNoteSchema.create().extend({
  blockSpecs: {
    mathBlock: createReactMathBlockSpec(),
  },

  inlineContentSpecs: {
    math: createReactInlineMathSpec(),
  },
})

export type NoteBlock = typeof noteSchema.Block
export type NoteContent = NoteBlock[]