import {
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

    renderHTML() {
      return [
        'div',
        {
          'data-type':
            'columns',
          class:
          'dash-columns',
        },
        0,
      ]
    },
  })

export default Columns