import {
  Node,
} from '@tiptap/core'

const Column =
  Node.create({
    name: "column",

    content: "block+",

    parseHTML() {
      return [
        {
          tag: 'div[data-type="column"]',
        },
      ]
    },

    renderHTML() {
      return [
        'div',
        {
          'data-type':
            'column',
          class:
            'dash-column',
        },
        0,
      ]
    },
  })

export default Column