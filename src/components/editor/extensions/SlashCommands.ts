import {
  Extension,
} from '@tiptap/core'

import {
  ReactRenderer,
} from '@tiptap/react'

import {
  PluginKey,
} from '@tiptap/pm/state'

import Suggestion, {
  type SuggestionProps,
} from '@tiptap/suggestion'

import {
  shift,
} from '@floating-ui/react'

import SlashCommandMenu
  from '../SlashCommandMenu.tsx'

import {
  filterSlashOptions,
  type SlashOption,
} from '../blockDefinitions.ts'
import { isPositionInsideColumn } from '../../../utils/editorUtils.ts'

const slashCommandPluginKey =
  new PluginKey(
    'dashSlashCommands',
  )

type SlashCommandsOptions = {
  onBlockMathInserted?: (
    pos: number
  ) => void

  onInlineMathInserted?: (
    pos: number
  ) => void
}

const SlashCommands =
  Extension.create<SlashCommandsOptions>({
    name:
      'slashCommands',

    addOptions() {
      return {
        onBlockMathInserted:
        undefined,

        onInlineMathInserted:
        undefined,
      }
    },

    addProseMirrorPlugins() {
      const {
        onBlockMathInserted,
        onInlineMathInserted,
      } =
        this.options
      return [
        Suggestion<SlashOption>({
          editor:
          this.editor,

          pluginKey:
          slashCommandPluginKey,

          char:
            '/',

          /*
           * Prevent something like:
           *
           * "https://..."
           *
           * from opening our block menu.
           */
          startOfLine:
            false,

          allowedPrefixes: [
            ' ',
          ],

          placement:
            'bottom-start',

          offset: {
            mainAxis: 10,
            crossAxis: 0,
          },

          flip:
            true,

          floatingUi: {
            strategy:
              'fixed',

            middleware: [
              shift({
                padding: 12,
              }),
            ],
          },

          items: ({
                    query,
                    editor,
                  }) => {
            const {
              $from,
            } =
              editor.state.selection

            const textBeforeCursor =
              $from.parent.textBetween(
                0,
                $from.parentOffset,
                undefined,
                '\ufffc',
              )

            const slashIndex =
              textBeforeCursor
                .lastIndexOf('/')

            const textBeforeSlash =
              slashIndex >= 0
                ? textBeforeCursor.slice(
                  0,
                  slashIndex,
                )
                : ''

            /*
             * At the beginning of a block:
             * show every command.
             *
             * Inside existing text:
             * only show inline commands.
             */
            const inlineOnly =
              textBeforeSlash
                .trim()
                .length > 0

            const items = filterSlashOptions(
              query,
              inlineOnly,
              )

            return isPositionInsideColumn(editor.state.doc, $from.pos) ?
                items.filter((option) => option.label !== 'Columns')
                :
                items
          },

          command: ({
                      editor,
                      range,
                      props,
                    }) => {
            //debug
            console.log(
              'slash command:',
              props.command,
              range,
            )
            if (
              props.command.type ===
              'inlineMath'
            ) {
              const inlinePos =
                range.from

              editor
                .chain()
                .focus()
                .insertContentAt(
                  {
                    from:
                    range.from,

                    to:
                    range.to,
                  },
                  {
                    type:
                      'inlineMath',

                    attrs: {
                      latex: '',
                    },
                  },
                )
                .run()

              onInlineMathInserted?.(
                inlinePos,
              )

              return
            }

            if (
              props.command.type ===
              'blockMath'
            ) {
              const $from =
                editor.state.doc.resolve(
                  range.from,
                )

              const blockPos =
                $from.before(
                  $from.depth,
                )

              const blockNode =
                editor.state.doc.nodeAt(
                  blockPos,
                )

              if (!blockNode) {
                return
              }

              editor
                .chain()
                .focus()
                .insertContentAt(
                  {
                    from:
                    blockPos,

                    to:
                      blockPos +
                      blockNode.nodeSize,
                  },
                  {
                    type:
                      'blockMath',

                    attrs: {
                      latex: '',
                    },
                  },
                )
                .run()

              onBlockMathInserted?.(
                blockPos,
              )

              return
            }

            if (props.command.type === 'columns') {
              const $from =
                editor.state.doc.resolve(
                  range.from,
                )

              const blockPos =
                $from.before(
                  $from.depth,
                )

              const blockNode =
                editor.state.doc.nodeAt(
                  blockPos,
                )

              if (!blockNode) {
                return
              }

              for (let depth = 0; depth <= $from.depth; depth++) {
                const loopNode = $from.node(depth)

                if(loopNode.type.name === 'columns') {
                  return
                }
              }

              editor
                .chain()
                .focus()
                .insertContentAt(
                  {
                    from:
                    blockPos,

                    to:
                      blockPos +
                      blockNode.nodeSize,
                  },
                  {
                    type: 'columns',

                    content: [
                      {
                        type: 'column',

                        content: [
                          {
                            type: 'paragraph',
                          },
                        ],
                      },

                      {
                        type: 'column',

                        content: [
                          {
                            type: 'paragraph',
                          },
                        ],
                      },
                    ],
                  }
                )
                .run()

              return
            }

            const chain =
              editor
                .chain()
                .focus()
                .deleteRange(
                  range,
                )

            if (
              props.command.type ===
              'paragraph'
            ) {
              chain
                .setParagraph()
                .run()

              return
            }

            if (
              props.command.type ===
              'heading'
            ) {
              chain
                .setHeading({
                  level:
                  props.command.level,
                })
                .run()
            }
          },

          render: () => {
            let component:
              ReactRenderer | null =
              null

            let unmount:
              (() => void) | null =
              null

            let currentProps:
              SuggestionProps<
                SlashOption
              > | null =
              null

            let selectedIndex = 0

            function updateComponent() {
              if (
                !component ||
                !currentProps
              ) {
                return
              }

              component.updateProps({
                items:
                currentProps.items,

                selectedIndex,

                onSelect: (
                  item:
                  SlashOption,
                ) => {
                  currentProps
                    ?.command(
                      item,
                    )
                },
              })
            }

            return {
              onStart(props) {
                currentProps =
                  props

                selectedIndex =
                  0

                component =
                  new ReactRenderer(
                    SlashCommandMenu,
                    {
                      editor:
                      props.editor,

                      props: {
                        items:
                        props.items,

                        selectedIndex,

                        onSelect: (
                          item:
                          SlashOption,
                        ) => {
                          props.command(
                            item,
                          )
                        },
                      },
                    },
                  )

                /*
                 * Tooltip layer = 120,
                 * so keep our normal menu
                 * on the standard menu layer.
                 */
                component
                  .element
                  .style
                  .zIndex =
                  '100'

                /*
                 * Suggestion itself mounts
                 * and positions the element.
                 */
                unmount =
                  props.mount(
                    component.element,
                  )
              },

              onUpdate(props) {
                currentProps =
                  props

                /*
                 * A new query should start
                 * at the first result again.
                 */
                selectedIndex =
                  0

                updateComponent()
              },

              onKeyDown({
                          event,
                        }) {
                if (
                  !currentProps
                ) {
                  return false
                }

                const items =
                  currentProps.items

                if (
                  event.key ===
                  'ArrowDown'
                ) {
                  event.preventDefault()

                  if (
                    items.length >
                    0
                  ) {
                    selectedIndex =
                      (
                        selectedIndex +
                        1
                      ) %
                      items.length

                    updateComponent()
                  }

                  return true
                }

                if (
                  event.key ===
                  'ArrowUp'
                ) {
                  event.preventDefault()

                  if (
                    items.length >
                    0
                  ) {
                    selectedIndex =
                      (
                        selectedIndex -
                        1 +
                        items.length
                      ) %
                      items.length

                    updateComponent()
                  }

                  return true
                }

                if (
                  event.key ===
                  'Enter'
                ) {
                  event.preventDefault()

                  const item =
                    items[
                      selectedIndex
                      ]

                  if (item) {
                    currentProps
                      .command(
                        item,
                      )
                  }

                  return true
                }

                /*
                 * Returning false for Escape
                 * lets Suggestion perform its
                 * normal dismissal.
                 */
                if (
                  event.key ===
                  'Escape'
                ) {
                  return false
                }

                return false
              },

              onExit() {
                unmount?.()

                component
                  ?.destroy()

                component =
                  null

                currentProps =
                  null

                unmount =
                  null
              },
            }
          },
        }),
      ]
    },
  })

export default SlashCommands