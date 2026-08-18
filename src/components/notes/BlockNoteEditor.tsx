import { BlockNoteView } from '@blocknote/ariakit'
import {
  combineByGroup,
} from '@blocknote/core'

import { filterSuggestionItems } from '@blocknote/core/extensions'

import {
  getMathSlashMenuItems,
} from '@blocknote/math-block'

import {
  getDefaultReactSlashMenuItems,
  SuggestionMenuController,
  useCreateBlockNote,
} from '@blocknote/react'
import { type NoteContent, noteSchema } from '../../lib/noteSchema.ts'

import '@blocknote/core/fonts/inter.css'
import '@blocknote/ariakit/style.css'

// IMPORTANT: ours comes last
import './BlockNoteEditor.css'

type BlockNoteEditorProps = {
  content: NoteContent
  onChange: (content: NoteContent) => void
}

function BlockNoteEditor( {content, onChange}: BlockNoteEditorProps) {
  const editor = useCreateBlockNote({
    schema: noteSchema,
    initialContent:
      content.length > 0
        ? content
        : undefined,
  })

  return (
    <BlockNoteView
      editor={editor}
      theme="light"
      onChange={() => {
        onChange(editor.document)
      }}
    >
      <SuggestionMenuController
        triggerCharacter="/"
        getItems={async (query) => {
          const items = combineByGroup(
            getDefaultReactSlashMenuItems(editor),
            getMathSlashMenuItems(editor),
          )

          return filterSuggestionItems(items, query)
        }}
      />
    </BlockNoteView>
  )
}

export default BlockNoteEditor