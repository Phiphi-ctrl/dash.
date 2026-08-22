import {
  Extension,
} from '@tiptap/core'

const BlockStyle =
  Extension.create({
    name: 'blockStyle',

    addGlobalAttributes() {
      return [
        {
          types: [
            'paragraph',
            'heading',
          ],

          attributes: {
            blockTextColor: {
              default: null,

              keepOnSplit: false,

              parseHTML: (element) =>
                element.style.color ||
                null,

              renderHTML: (
                attributes,
              ) => {
                if (
                  !attributes
                    .blockTextColor
                ) {
                  return {}
                }

                return {
                  style:
                    `color: ${
                      attributes
                        .blockTextColor
                    }`,
                }
              },
            },

            blockBackgroundColor: {
              default: null,

              keepOnSplit: false,

              parseHTML: (element) =>
                element.style
                  .backgroundColor ||
                null,

              renderHTML: (
                attributes,
              ) => {
                if (
                  !attributes
                    .blockBackgroundColor
                ) {
                  return {}
                }

                return {
                  style:
                    `background-color: ${
                      attributes
                        .blockBackgroundColor
                    }`,
                }
              },
            },
          },
        },
      ]
    },
  })

export default BlockStyle