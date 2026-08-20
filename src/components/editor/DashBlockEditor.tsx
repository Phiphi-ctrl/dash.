import {
  EditorContent,
  useEditor,
} from '@tiptap/react'

import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import UniqueID from '@tiptap/extension-unique-id'
import DragHandle from '@tiptap/extension-drag-handle-react'
import { GripVertical } from 'lucide-react'
import { useState } from 'react'
import type { Node as ProseMirrorNode } from '@tiptap/pm/model'

import type {
  DashDocument,
} from '../../types/Block.ts'

type DashBlockEditorProps = {
  value: DashDocument
  onChange: (
    document: DashDocument
  ) => void
}

function DashBlockEditor({ value, onChange }: DashBlockEditorProps) {
  const [activeNode, setActiveNode] =
    useState<ProseMirrorNode | null>(null)

  const [activeNodePos, setActiveNodePos] =
    useState<number | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        trailingNode: false,
      }),

      Placeholder.configure({
        showOnlyCurrent: false,

        placeholder: ({ node }) => {
          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`
          }

          if (node.type.name === 'paragraph') {
            return "Enter text or type '/' for commands"
          }

          return ''
        },
      }),

      UniqueID.configure({
        types: [
          'paragraph',
          'heading',
        ],

        generateID: () =>
          crypto.randomUUID(),
      }),
    ],

    content: value,

    editorProps: {
      attributes: {
        class: 'dash-editor outline-none text-foreground pl-10',
      },
    },

    onUpdate: ({ editor }) => {
      onChange(
        editor.getJSON()
      )
    },
  })

  return (
    <div className="relative">
      {editor && (
        <DragHandle
          editor={editor}

          computePositionConfig={{
            placement: 'left-start',
          }}

          onNodeChange={({ node, pos }) => {
            setActiveNode(node)
            setActiveNodePos(pos)
          }}
        >
          <button
            type="button"
            className="
            flex
            h-7
            w-7
            cursor-grab
            items-center
            justify-center
            rounded-md

            text-muted

            transition-colors

            hover:bg-surface-hover
            hover:text-foreground
          "
          >
            <GripVertical size={16} />
          </button>
        </DragHandle>
      )}

      <EditorContent
        editor={editor}
      />
    </div>
  )
}

export default DashBlockEditor