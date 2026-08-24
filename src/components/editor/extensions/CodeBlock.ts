import {
  CodeBlockLowlight,
} from '@tiptap/extension-code-block-lowlight'

import {
  ReactNodeViewRenderer,
} from '@tiptap/react'

import {
  all,
  createLowlight,
} from 'lowlight'

import CodeBlockView
  from '../CodeBlockView.tsx'

const lowlight =
  createLowlight(all)

const CodeBlock =
  CodeBlockLowlight
    .extend({
      addNodeView() {
        return ReactNodeViewRenderer(
          CodeBlockView,
          {
            attrs: ({ node }) => {
              const id =
                node.attrs.id

              return {
                ...(typeof id === 'string'
                  ? {
                    'data-id': id,
                  }
                  : {}),

                'data-type':
                  'codeBlock',
              }
            },
          },
        )
      },
    })
    .configure({
      lowlight,

      enableTabIndentation:
        true,

      tabSize:
        2,
    })

export default CodeBlock