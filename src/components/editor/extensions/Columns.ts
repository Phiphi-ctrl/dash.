import {
  mergeAttributes,
  Node,
} from '@tiptap/core'

const Columns =
  Node.create({
    name: "columns",

    group: "block",

    content: "column{2}",

    parseHTML() {
      return [
        {
          tag: 'div[data-type="columns"]',
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
            'data-type': 'columns',
            class: 'dash-columns',
          },
        ),
        0,
      ]
    },

    addAttributes() {
      return {
        columnRatio: {
          default: 0.5,

          parseHTML: (element) =>
            Number(
              element.getAttribute(
                'data-column-ratio',
              ) ?? 0.5,
            ),

          renderHTML: (attributes) => ({
            'data-column-ratio':
            attributes.columnRatio,

            style:
              `grid-template-columns: ` +
              `minmax(0, ${attributes.columnRatio}fr) ` +
              `minmax(0, ${1 - attributes.columnRatio}fr)`,
          }),
        },
      }
    },
  })

export default Columns