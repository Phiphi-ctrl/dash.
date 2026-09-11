import {
  mergeAttributes,
  Node,
} from '@tiptap/core'

import {
  ReactNodeViewRenderer,
} from '@tiptap/react'

import ImageBlockView
  from '../ImageBlock/ImageBlockView.tsx'

const ImageBlock =
    Node.create({
      name:
          'imageBlock',

      group:
          'block',

      atom:
          true,

      selectable:
          true,

      addAttributes() {
        return {
          imageId: {
            default:
                null,
          },

          fileName: {
            default:
                null,
          },

          mimeType: {
            default:
                null,
          },

          width: {
            default:
                null,
          },

          height: {
            default:
                null,
          },

          alt: {
            default:
                null,
          },

          objectPositionY: {
            default:
                0.5,
          },
        }
      },

      parseHTML() {
        return [
          {
            tag:
                'div[data-type="imageBlock"]',
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
                    'imageBlock',
              },
          ),
        ]
      },

      addNodeView() {
        return ReactNodeViewRenderer(
            ImageBlockView,
            {
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
                      'imageBlock',
                }
              },
            },
        )
      },
    })

export default ImageBlock
