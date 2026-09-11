import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'

import PdfBlockView from '../PdfBlock/PdfBlockView.tsx'

const PdfBlock = Node.create({
  name: 'pdfBlock',

  group: 'block',

  atom: true,

  selectable: true,

  addAttributes() {
    return {
      pdfId: {
        default: null,
      },

      fileName: {
        default: null,
      },

      mimeType: {
        default: null,
      },

      size: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="pdfBlock"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',

      mergeAttributes(HTMLAttributes, {
        'data-type': 'pdfBlock',
      }),
    ]
  },

  addNodeView() {
    return ReactNodeViewRenderer(PdfBlockView, {
      attrs: ({ node }) => {
        const id = node.attrs.id

        return {
          ...(typeof id === 'string'
            ? {
                'data-id': id,
              }
            : {}),

          'data-type': 'pdfBlock',
        }
      },
    })
  },
})

export default PdfBlock
