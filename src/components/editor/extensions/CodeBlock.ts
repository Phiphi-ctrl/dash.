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
  from '../CodeBlock/CodeBlockView.tsx'
import { ignoreCodeBlockMutation } from '../CodeBlock/codeBlockMutations.ts'

const lowlight =
  createLowlight(all)

const CodeBlock =
  CodeBlockLowlight
    .extend({
      addNodeView() {
        const renderNodeView = ReactNodeViewRenderer(
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

        return (props) => {
          const nodeView = renderNodeView(props)

          // Backport TipTap 3.31.1's mobile fix: React's wrapper is not editor content.
          nodeView.ignoreMutation = (mutation) =>
            ignoreCodeBlockMutation(mutation, nodeView.contentDOM)

          return nodeView
        }
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
