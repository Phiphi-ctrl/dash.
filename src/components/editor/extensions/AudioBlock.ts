import {
  mergeAttributes,
  Node,
} from '@tiptap/core'

import {
  ReactNodeViewRenderer,
} from '@tiptap/react'

import AudioBlockView from '../AudioBlock/AudioBlockView.tsx'

const AudioBlock =
  Node.create({
    name:
      'audioBlock',

    group:
      'block',

    /*
     * The block has no editable
     * ProseMirror content inside it.
     */
    atom:
      true,

    selectable:
      true,

    addAttributes() {
      return {
        audioId: {
          default:
            null,
        },

        duration: {
          default:
            null,
        },

        mimeType: {
          default:
            null,
        },

        title: {
          default:
            null,
        },
      }
    },

    parseHTML() {
      return [
        {
          tag:
            'div[data-type="audioBlock"]',
        },
      ]
    },

    renderHTML({
                 HTMLAttributes,
               }) {
      return [
        'div',

        mergeAttributes(
          HTMLAttributes,
          {
            'data-type':
              'audioBlock',
          },
        ),
      ]
    },

    addNodeView() {
      return ReactNodeViewRenderer(
        AudioBlockView,

        {
          /*
           * Same important trick
           * as CodeBlock:
           *
           * Dash sees the OUTER
           * react-renderer element.
           */
          attrs: ({
                    node,
                  }) => {
            const id =
              node.attrs.id

            return {
              ...(
                typeof id ===
                'string'
                  ? {
                    'data-id':
                    id,
                  }
                  : {}
              ),

              'data-type':
                'audioBlock',
            }
          },
        },
      )
    },
  })

export default AudioBlock