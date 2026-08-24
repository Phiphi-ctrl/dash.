import {
  EditorContent,
  useEditor,
} from '@tiptap/react'
import {
  BackgroundColor,
  Color,
  TextStyle,
} from '@tiptap/extension-text-style'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import UniqueID from '@tiptap/extension-unique-id'
import DragHandle from '@tiptap/extension-drag-handle-react'
import {
  GripVertical,
  Plus,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from 'react'
import BlockInsertMenu
  from './BlockInsertMenu.tsx'
import type {
  BlockInsertCommand
} from "./blockDefinitions.ts"
import type {
  DashDocument,
} from '../../types/Block.ts'
import Tooltip from '../ui/Tooltip.tsx'
import TextSelectionMenu from './TextSelectionMenu.tsx'
import BlockActionMenu from "./BlockActionMenu.tsx";
import BlockStyle from './extensions/BlockStyle.ts'
import SlashCommands
  from './extensions/SlashCommands.ts'
import Columns from './extensions/Columns.ts'
import Column from './extensions/Column.ts'
import {
  Mathematics,
} from '@tiptap/extension-mathematics'
import MathEditorPopup
  from './MathEditorPopup.tsx'

import 'katex/dist/katex.min.css'
import {findNodePosById, isPositionInsideColumn} from "../../utils/editorUtils.ts";

type DashBlockEditorProps = {
  value: DashDocument
  onChange: (
    document: DashDocument
  ) => void
}

const dragHandlePositionConfig = {
  placement: 'left' as const,
}

const nestedDragHandleConfig = {
  edgeDetection:
      'none' as const,

  rules: [
    {
      id:
          'excludeDashLayoutNodes',

      evaluate: ({
                   node,
                 }: {
        node: {
          type: {
            name: string
          }
        }
      }) => {
        if (
            node.type.name ===
            'columns' ||
            node.type.name ===
            'column'
        ) {
          return 1000
        }

        return 0
      },
    },
  ],
}

function DashBlockEditor({ value, onChange }: DashBlockEditorProps) {
  const dropIndicatorRef =
    useRef<HTMLDivElement | null>(null)
  const editorShellRef =
    useRef<HTMLDivElement | null>(null)
  const activeNodePosRef =
    useRef<number | null>(null)

  type HandleMenu =
      | 'insert'
      | 'actions'
      | null

  const [openHandleMenu, setOpenHandleMenu] =
      useState<HandleMenu>(null)

  const isHandleMenuOpen =
      openHandleMenu !== null

  const isBlockMenuOpen = openHandleMenu === 'insert'

  const insertPositionRef =
    useRef<number | null>(null)

  const [
    addButtonElement,
    setAddButtonElement,
  ] = useState<HTMLButtonElement | null>(null)

  const targetBlockPosRef =
      useRef<number | null>(null)

  const [
    dragButtonElement,
    setDragButtonElement,
  ] =
      useState<HTMLButtonElement | null>(null)

  const handleControlsRef =
      useRef<HTMLDivElement | null>(null)

  const lockedHandlePosRef =
      useRef<number | null>(null)

  const draggedBlockPosRef =
      useRef<number | null>(null)

  type SideDropTarget = {
    blockId: string
    side: 'left' | 'right'
  }

  const sideDropTargetRef =
      useRef<SideDropTarget | null>(
          null,
      )

  const [
    insertMenuInsideColumn,
    setInsertMenuInsideColumn,
  ] = useState(false)

  type MathEditorTarget = {
    kind:
        | 'block'
        | 'inline'

    pos: number
    latex: string
    isNew: boolean

    anchorElement:
        HTMLElement

    originalText?: string

    entrySide?:
        | 'start'
        | 'end'
  }

  const [
    mathEditorTarget,
    setMathEditorTarget,
  ] =
      useState<MathEditorTarget | null>(
          null,
      )

  function openBlockMathEditor(
      pos: number,
      latex: string,
      isNew: boolean,
  ) {
    if (!editor) {
      return
    }

    /*
     * Give ProseMirror one frame to make
     * sure a newly inserted math node has
     * its DOM representation.
     */
    requestAnimationFrame(
        () => {
          if (
              editor.isDestroyed
          ) {
            return
          }

          const dom =
              editor.view.nodeDOM(
                  pos,
              )

          if (
              !(dom instanceof HTMLElement)
          ) {
            return
          }

          setMathEditorTarget({
            kind:
                'block',

            pos,
            latex,
            isNew,

            anchorElement:
            dom,
          })
        },
    )
  }

  function openInlineMathEditor(
      pos: number,
      latex: string,
      isNew: boolean,
      originalText?: string,

      entrySide?:
          | 'start'
          | 'end',
  ) {
    if (!editor) {
      return
    }

    requestAnimationFrame(
        () => {
          if (
              editor.isDestroyed
          ) {
            return
          }

          const dom =
              editor.view.nodeDOM(
                  pos,
              )

          if (
              !(dom instanceof HTMLElement)
          ) {
            return
          }

          setMathEditorTarget({
            kind:
                'inline',

            pos,
            latex,
            isNew,

            anchorElement:
            dom,

            originalText,

            entrySide,
          })
        },
    )
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },

        trailingNode: false,

        dropcursor: false,
      }),

      Columns,
      Column,

      TextStyle,
      BlockStyle,
      SlashCommands.configure({
        onBlockMathInserted: (
            pos,
        ) => {
          openBlockMathEditor(
              pos,
              '',
              true,
          )
        },

        onInlineMathInserted: (
            pos,
        ) => {
          openInlineMathEditor(
              pos,
              '',
              true,
          )
        },
      }),

      BackgroundColor,
      Color,

      Placeholder.configure({
        showOnlyCurrent: true,
        includeChildren: true,


        placeholder: (props) => {
          const node = props.node

          if (node.type.name === 'heading') {
            return `Heading ${node.attrs.level}`
          }

          if (node.type.name === 'paragraph') {
            return "Enter text or type '/' for commands"
          }

          return ''
        },
      }),

      UniqueID.configure({
        types: [
          'paragraph',
          'heading',
          'blockMath',
          'columns',
          'column',
        ],

        generateID: () =>
          crypto.randomUUID(),
      }),

      Mathematics.configure({
        katexOptions: {
          throwOnError: false,
        },

        inlineOptions: {
          onClick: (
              node,
              pos,
          ) => {
            openInlineMathEditor(
                pos,
                node.attrs.latex ??
                '',
                false,
            )
          },
        },

        blockOptions: {
          onClick: (
              node,
              pos,
          ) => {
            openBlockMathEditor(
                pos,
                node.attrs.latex ??
                '',
                false,
            )
          },
        },
      }),
    ],

    content: value,

    editorProps: {
      attributes: {
        class:
            'dash-editor outline-none text-foreground pl-15 py-5',
      },

      handleKeyDown: (
          view,
          event,
      ) => {
        if (
            event.key === 'Backspace'
        ) {
          const {
            selection,
          } = view.state

          const {
            $from,
          } = selection

          if(
              !selection.empty ||
              !$from.parent.isTextblock ||
              $from.parent.content.size !== 0 ||
              $from.parentOffset !== 0 ||
              !($from.depth >= 2)
          ) {
            return false
          }
          const columnDepth = $from.depth - 1
          const columnsDepth = $from.depth - 2
          const columnNode =
              $from.node(columnDepth)

          const columnsNode =
              $from.node(columnsDepth)
          if(
              columnNode.type.name !== 'column' ||
              columnsNode.type.name !== 'columns' ||
              columnNode.childCount !== 1
          ) {
            return false
          }
          const currentColumnIndex =
              $from.index(columnsDepth)

          const siblingColumnIndex = currentColumnIndex === 0 ? 1 : 0
          const siblingColumn =
              columnsNode.child(
                  siblingColumnIndex
              )
          const columnsPos = $from.before(columnsDepth)
          const to = columnsPos + columnsNode.nodeSize
          const content = siblingColumn.content

          const transaction =
              view.state.tr.replaceWith(
                  columnsPos,
                  to,
                  content,
              )

          event.preventDefault()
          view.dispatch(transaction)
          return true
        }
        /*
         * Plain ← / → only.
         *
         * Shift + Arrow should continue
         * creating text selections normally.
         */
        if (
            (
                event.key !==
                'ArrowLeft' &&
                event.key !==
                'ArrowRight'
            ) ||
            event.shiftKey ||
            event.metaKey ||
            event.ctrlKey ||
            event.altKey
        ) {
          return false
        }

        const {
          selection,
        } =
            view.state

        /*
         * Only operate on a regular
         * collapsed text cursor.
         */
        if (
            !selection.empty
        ) {
          return false
        }

        const {
          $from,
        } =
            selection

        if (
            !$from.parent
                .isTextblock
        ) {
          return false
        }

        /*
         * Moving →
         *
         * If inlineMath is immediately
         * after the cursor, enter it from
         * its left/start side.
         */
        if (
            event.key ===
            'ArrowRight'
        ) {
          const node =
              $from.nodeAfter

          if (
              node?.type.name !==
              'inlineMath'
          ) {
            return false
          }

          const pos =
              selection.from

          openInlineMathEditor(
              pos,
              node.attrs.latex ??
              '',
              false,
              undefined,
              'start',
          )

          return true
        }

        /*
         * Moving ←
         *
         * If inlineMath is immediately
         * before the cursor, enter it from
         * its right/end side.
         */
        const node =
            $from.nodeBefore

        if (
            node?.type.name !==
            'inlineMath'
        ) {
          return false
        }

        const pos =
            selection.from -
            node.nodeSize

        openInlineMathEditor(
            pos,
            node.attrs.latex ??
            '',
            false,
            undefined,
            'end',
        )

        return true
      },
      handleDrop: (
          view,
          event,
      ) => {
        const sourcePos =
            draggedBlockPosRef.current

        const target =
            sideDropTargetRef.current

        if (
            sourcePos === null ||
            target === null
        ) {
          return false
        }

        const targetPos =
            findNodePosById(
                view.state.doc,
                target.blockId,
            )

        if (targetPos === null) {
          return false
        }

        const $source =
            view.state.doc.resolve(
                sourcePos,
            )

        const $target =
            view.state.doc.resolve(
                targetPos,
            )

        const sourceNode =
            view.state.doc.nodeAt(
                sourcePos,
            )

        const targetNode =
            view.state.doc.nodeAt(
                targetPos,
            )

        if (
            !sourceNode ||
            !targetNode
        ) {
          return true
        }

        if (
            $target.parent.type.name !==
            'doc'
        ) {
          return true
        }

        const sourceParentType =
            $source.parent.type.name

        if (
            sourceParentType !== 'doc' &&
            sourceParentType !== 'column'
        ) {
          return true
        }

        const {
          schema,
        } = view.state

        const columnsType =
            schema.nodes.columns

        const columnType =
            schema.nodes.column

        const leftNode =
            target.side === 'left'
                ? sourceNode
                : targetNode

        const rightNode =
            target.side === 'left'
                ? targetNode
                : sourceNode

        const leftColumn =
            columnType.create(
                null,
                leftNode,
            )

        const rightColumn =
            columnType.create(
                null,
                rightNode,
            )

        const columnsNode =
            columnsType.create(
                null,
                [
                  leftColumn,
                  rightColumn,
                ],
            )

        let transaction =
            view.state.tr

        const sourceIsOnlyColumnChild =
            sourceParentType === 'column' &&
            $source.parent.childCount === 1

        if (
            sourceIsOnlyColumnChild
        ) {
          const emptyParagraph =
              schema.nodes.paragraph.create()

          transaction =
              transaction.replaceWith(
                  sourcePos,
                  sourcePos +
                  sourceNode.nodeSize,
                  emptyParagraph,
              )
        } else {
          transaction =
              transaction.delete(
                  sourcePos,
                  sourcePos +
                  sourceNode.nodeSize,
              )
        }

        const mappedTargetPos =
            transaction.mapping.map(
                targetPos,
            )

        transaction =
            transaction.replaceWith(
                mappedTargetPos,
                mappedTargetPos +
                targetNode.nodeSize,
                columnsNode,
            )

        event.preventDefault()

        view.dispatch(
            transaction,
        )

        sideDropTargetRef.current =
            null

        draggedBlockPosRef.current =
            null

        return true
      },
    },

    onUpdate: ({ editor }) => {
      onChange(
        editor.getJSON()
      )
    },
  },[])

  const getHandleVirtualElement =
      useCallback(() => {
        if (!editor) {
          return null
        }

        const pos =
            lockedHandlePosRef.current

        if (pos === null) {
          return null
        }

        return {
          getBoundingClientRect: () => {
            const dom =
                editor.view.nodeDOM(
                    pos,
                )

            if (
                !(dom instanceof HTMLElement)
            ) {
              return new DOMRect()
            }

            return dom
                .getBoundingClientRect()
          },
        }
      }, [editor])

  const closeHandleMenu =
      useCallback(() => {
        if (editor) {
          editor.view.dispatch(
              editor.state.tr
                  .setMeta(
                      'hideDragHandle',
                      true,
                  )
                  .setMeta(
                      'addToHistory',
                      false,
                  ),
          )
        }

        activeNodePosRef.current = null
        insertPositionRef.current = null
        targetBlockPosRef.current = null
        lockedHandlePosRef.current = null

        setOpenHandleMenu(null)
      }, [editor])

  function hideDropIndicator() {
    if (!dropIndicatorRef.current) {
      return
    }

    dropIndicatorRef.current.style.opacity = '0'
  }

  function handleDragStart() {
    const pos =
        activeNodePosRef.current

    draggedBlockPosRef.current =
        pos

    if (
        pos === null ||
        !editor
    ) {
      return
    }
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault()

    const shell =
      editorShellRef.current

    const indicator =
      dropIndicatorRef.current

    if (!shell || !indicator) {
      return
    }

    const elementUnderPointer =
        document.elementFromPoint(
            event.clientX,
            event.clientY,
        )

    const activeContainer =
        elementUnderPointer?.closest<HTMLElement>(
            '.dash-column, .dash-editor'
        )

    if (!activeContainer) {
      hideDropIndicator()
      return
    }

    const isRootContainer =
        activeContainer?.classList.contains(
            'dash-editor'
        )

    const blocks = Array.from(
      activeContainer.children,
    ).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        element.hasAttribute('data-id')
    )

    if (blocks.length === 0) {
      hideDropIndicator()
      return
    }

    const shellRect =
      shell.getBoundingClientRect()

    const editorRect =
      activeContainer.getBoundingClientRect()

    const blockRects =
      blocks.map(
        (block) =>
          block.getBoundingClientRect()
      )

    const hoveredBlockIndex =
        blockRects.findIndex(
            (rect) =>
                event.clientY >= rect.top &&
                event.clientY <= rect.bottom,
        )

    if (
        isRootContainer &&
        hoveredBlockIndex !== -1
    ) {
      const hoveredBlock =
          blocks[hoveredBlockIndex]

      const hoveredRect =
          blockRects[hoveredBlockIndex]

      const draggedPos =
          draggedBlockPosRef.current

      const draggedNode =
          draggedPos !== null && editor
              ? editor.state.doc.nodeAt(
                  draggedPos,
              )
              : null

      const canSideDrop =
          draggedNode?.attrs.id !==
          hoveredBlock.dataset.id &&
          hoveredBlock.dataset.type !==
          'columns'

      if (canSideDrop) {
        const sideZoneWidth =
            hoveredRect.width * 0.2

        const leftBoundary =
            hoveredRect.left +
            sideZoneWidth

        const rightBoundary =
            hoveredRect.right -
            sideZoneWidth

        let side:
            | 'left'
            | 'right'
            | null = null

        if (
            event.clientX <= leftBoundary
        ) {
          side = 'left'
        } else if (
            event.clientX >= rightBoundary
        ) {
          side = 'right'
        }

        const blockId =
            hoveredBlock.dataset.id

        if (
            side !== null &&
            blockId
        ) {
          sideDropTargetRef.current = {
            blockId,
            side,
          }

          const indicatorX =
              side === 'left'
                  ? hoveredRect.left
                  : hoveredRect.right

          indicator.style.left =
              `${
                  indicatorX -
                  shellRect.left -
                  3
              }px`

          indicator.style.top =
              `${
                  hoveredRect.top -
                  shellRect.top
              }px`

          indicator.style.width =
              '6px'

          indicator.style.height =
              `${hoveredRect.height}px`

          indicator.style.transform =
              'none'

          indicator.style.opacity = '1'

          return
        }
      }
    }



    sideDropTargetRef.current = null

    //reset the indicator
    indicator.style.height =
        '6px'

    indicator.style.transform =
        'translateY(-50%)'

    type DropZone = {
      start: number
      end: number
      position: number
    }

    const dropZones: DropZone[] = []

    const edgeTolerance = 2

    /*
     * Before the first block
     */
    const firstRect =
      blockRects[0]

    dropZones.push({
      start:
      editorRect.top,

      end:
        firstRect.top +
        edgeTolerance,

      position:
      firstRect.top,
    })

    /*
     * Between blocks
     */
    for (
      let index = 0;
      index < blockRects.length - 1;
      index++
    ) {
      const currentRect =
        blockRects[index]

      const nextRect =
        blockRects[index + 1]

      dropZones.push({
        start:
          currentRect.bottom -
          edgeTolerance,

        end:
          nextRect.top +
          edgeTolerance,

        position:
          (
            currentRect.bottom +
            nextRect.top
          ) / 2,
      })
    }

    /*
     * Below last block
     */
    const lastRect =
      blockRects[
      blockRects.length - 1
        ]

    dropZones.push({
      start:
        lastRect.bottom -
        edgeTolerance,

      end:
      editorRect.bottom,

      position:
        lastRect.bottom + 12,
    })

    /*
     * Only show an indicator when
     * actually inside a drop zone.
     */
    const activeDropZone =
      dropZones.find(
        (zone) =>
          event.clientY >= zone.start &&
          event.clientY <= zone.end
      )

    if (!activeDropZone) {
      hideDropIndicator()
      return
    }

    indicator.style.top =
      `${
        activeDropZone.position -
        shellRect.top
      }px`

    indicator.style.left =
      `${
        editorRect.left -
        shellRect.left
      }px`

    indicator.style.width =
      `${editorRect.width}px`

    indicator.style.opacity = '1'
  }

  function handleToggleBlockMenu() {
    if (
        openHandleMenu === 'insert'
    ) {
      closeHandleMenu()
      return
    }

    const pos =
        activeNodePosRef.current

    lockedHandlePosRef.current = pos

    if (
        pos === null ||
        !editor
    ) {
      return
    }

    const node =
        editor.state.doc.nodeAt(pos)

    if (!node) {
      return
    }

    setInsertMenuInsideColumn(isPositionInsideColumn(editor.state.doc, pos))

    insertPositionRef.current =
        pos + node.nodeSize

    editor.view.dispatch(
        editor.state.tr
            .setMeta(
                'lockDragHandle',
                true,
            )
            .setMeta(
                'addToHistory',
                false,
            ),
    )

    setOpenHandleMenu('insert')
  }

  function handleInsertBlock(
    command: BlockInsertCommand,
  ) {
    const insertPos =
      insertPositionRef.current

    if (
        insertPos === null ||
        !editor
    ) {
      return
    }

    const isInsideColumn = isPositionInsideColumn(editor.state.doc, insertPos)

    if (
        command.type ===
        'columns'
    ) {
      if(isInsideColumn) {
        return
      }
      editor
          .chain()
          .focus()
          .insertContentAt(
              insertPos,
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
              },
          )
          .run()
      closeHandleMenu()
      return
    }

    if (
        command.type ===
        'blockMath'
    ) {
      editor
          .chain()
          .focus()
          .insertContentAt(
              insertPos,
              {
                type: 'blockMath',
                attrs: {
                  latex: '',
                },
              },
          )
          .run()

      closeHandleMenu()

      openBlockMathEditor(
          insertPos,
          '',
          true,
      )

      return
    }

    const content =
      command.type === 'heading'
        ? {
          type: 'heading',
          attrs: {
            level: command.level,
          },
        }
        : {
          type: 'paragraph',
        }

    editor
      .chain()
      .focus()
      .insertContentAt(
        insertPos,
        content,
      )
      .setTextSelection(
        insertPos + 1,
      )
      .run()

    closeHandleMenu()
  }

  useEffect(() => {
    if (!isHandleMenuOpen) {
      return
    }

    function handlePointerDown(
        event: PointerEvent,
    ) {
      const target =
          event.target

      /*
       * Click on + / drag controls.
       */
      if (
          target instanceof Node &&
          handleControlsRef.current?.contains(
              target,
          )
      ) {
        return
      }

      /*
       * Click inside any portalled
       * editor popup.
       */
      if (
          target instanceof Element &&
          (
              target.closest(
                  '[data-block-insert-menu]',
              ) ||
              target.closest(
                  '[data-editor-popup]',
              )
          )
      ) {
        return
      }

      closeHandleMenu()
    }

    function handleKeyDown(
        event: KeyboardEvent,
    ) {
      if (event.key === 'Escape') {
        closeHandleMenu()
      }
    }

    document.addEventListener(
        'pointerdown',
        handlePointerDown,
    )

    document.addEventListener(
        'keydown',
        handleKeyDown,
    )

    return () => {
      document.removeEventListener(
          'pointerdown',
          handlePointerDown,
      )

      document.removeEventListener(
          'keydown',
          handleKeyDown,
      )
    }
  }, [
    isHandleMenuOpen,
    closeHandleMenu,
  ])

  function handleInsertInlineMath() {
    if (!editor) {
      return
    }

    const {
      selection,
    } =
        editor.state

    const {
      from,
      to,
      $from,
      $to,
    } =
        selection

    if (
        from === to
    ) {
      return
    }

    /*
     * An inline equation cannot replace
     * a selection spanning multiple blocks.
     */
    if (
        !$from.sameParent(
            $to,
        ) ||
        !$from.parent.isTextblock
    ) {
      return
    }

    const originalText =
        editor.state.doc.textBetween(
            from,
            to,
            '',
        )

    const initialLatex =
        originalText.trim()

    if (
        !initialLatex
    ) {
      return
    }

    editor
        .chain()
        .focus()
        .insertContentAt(
            {
              from,
              to,
            },
            {
              type:
                  'inlineMath',

              attrs: {
                latex:
                initialLatex,
              },
            },
        )
        .run()

    openInlineMathEditor(
        from,
        initialLatex,
        true,
        originalText,
    )
  }

  function handleToggleActionMenu() {
    if (
        openHandleMenu === 'actions'
    ) {
      closeHandleMenu()
      return
    }

    const pos =
        activeNodePosRef.current

    lockedHandlePosRef.current = pos

    if (
        pos === null ||
        !editor
    ) {
      return
    }

    targetBlockPosRef.current =
        pos

    editor.view.dispatch(
        editor.state.tr
            .setMeta(
                'lockDragHandle',
                true,
            )
            .setMeta(
                'addToHistory',
                false,
            ),
    )

    setOpenHandleMenu('actions')
  }

  function handleDeleteBlock() {
    const pos =
        targetBlockPosRef.current

    if (
        pos === null ||
        !editor
    ) {
      return
    }

    const node =
        editor.state.doc.nodeAt(
            pos,
        )

    if (!node) {
      return
    }

    const to =
        pos + node.nodeSize

    /*
     * Keep one empty paragraph if this
     * is the only remaining block.
     */
    if (
        editor.state.doc.childCount === 1
    ) {
      editor
          .chain()
          .insertContentAt(
              {
                from: pos,
                to,
              },
              {
                type: 'paragraph',
              },
          )
          .setTextSelection(
              pos + 1,
          )
          .run()
    } else {
      editor
          .chain()
          .deleteRange({
            from: pos,
            to,
          })
          .run()
    }

    closeHandleMenu()
  }

  function updateTargetBlockStyle(
      attributes: {
        blockTextColor?: string | null
        blockBackgroundColor?: string | null
      },
  ) {
    const pos =
        targetBlockPosRef.current

    if (
        pos === null ||
        !editor
    ) {
      return
    }

    const node =
        editor.state.doc.nodeAt(
            pos,
        )

    if (!node) {
      return
    }

    const transaction =
        editor.state.tr.setNodeMarkup(
            pos,
            undefined,
            {
              ...node.attrs,
              ...attributes,
            },
        )

    editor.view.dispatch(
        transaction,
    )
  }

  function handleBlockTextColor(
      color: string | null,
  ) {
    updateTargetBlockStyle({
      blockTextColor:
      color,
    })
  }

  function handleBlockBackgroundColor(
      color: string | null,
  ) {
    updateTargetBlockStyle({
      blockBackgroundColor:
      color,
    })
  }

  return (
    <div
      ref={editorShellRef}
      onDragStartCapture={
        handleDragStart
      }
      onDragOver={handleDragOver}
      onDrop={hideDropIndicator}
      onDragEnd={hideDropIndicator}
      className="
      dash-editor-shell
      relative
      items-center
    "
    >
      <div
        ref={dropIndicatorRef}
        className="
          pointer-events-none
          absolute
          z-50

          rounded-full
          bg-accent/30

          opacity-0

          transition-[opacity]
          duration-300
          ease-out
        "
      />

      {editor && (
          <DragHandle
              editor={editor}

              getReferencedVirtualElement={getHandleVirtualElement}

              nested={nestedDragHandleConfig}

              computePositionConfig={
                dragHandlePositionConfig
              }

              onNodeChange={({ node, pos }) => {

                if (
                    node &&
                    pos !== null
                ) {
                  activeNodePosRef.current =
                      pos
                }
              }}
          >
          <div
            className="
              flex
              -translate-x-2
              items-center
              gap-0.5
            "
            ref={handleControlsRef}
          >
            <div
              className="
                relative
                flex
              "
            >
              <Tooltip
                content={
                  <div className="flex items-center gap-1.5">
                    <Plus size={12} />
                    <span>
                      Add a
                      <span className="font-semibold text-foreground">
                        {' '}new block
                      </span>
                    </span>
                  </div>
                }
                active={!isHandleMenuOpen}
              >
                <button
                  type="button"
                  ref={setAddButtonElement}
                  draggable={false}

                  onMouseDown={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}

                  onDragStart={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                  }}

                  onClick={
                    handleToggleBlockMenu
                  }

                  className={`
                    flex
                    h-6
                    w-6
                    cursor-pointer
                    items-center
                    justify-center
                    rounded-md
            
                    transition-colors
            
                    ${
                    isBlockMenuOpen
                      ? 'bg-surface-hover text-foreground'
                      : 'text-muted hover:bg-surface-hover hover:text-foreground'
                    }
                    `}
                >
                  <Plus size={20} />
                </button>
              </Tooltip>

              {isBlockMenuOpen && (
                <BlockInsertMenu
                  onSelect={
                    handleInsertBlock
                  }
                  anchorElement={addButtonElement}
                  excludeColumns={insertMenuInsideColumn}
                />
              )}
            </div>

            <Tooltip
              content={
              <div className="flex items-center gap-1.5">
                <GripVertical size={12} />
                  <span>
                    <span className="font-semibold text-foreground">
                      Drag{' '}
                    </span>
                      to Move
                  </span>
              </div>
              }
              active={!isHandleMenuOpen}
            >
              <button
                type="button"
                ref={setDragButtonElement}
                onClick={handleToggleActionMenu}
                className="
                flex
                h-6
                w-4
                cursor-grab
                items-center
                justify-center
                rounded-md
                text-muted
                transition-colors
                hover:bg-surface-hover
                hover:text-foreground
              "
              >
                <GripVertical size={20} />
              </button>
            </Tooltip>
            {openHandleMenu === 'actions' && (
                <BlockActionMenu
                    anchorElement={
                      dragButtonElement
                    }

                    onDelete={
                      handleDeleteBlock
                    }

                    onTextColor={
                      handleBlockTextColor
                    }

                    onBackgroundColor={
                      handleBlockBackgroundColor
                    }
                />
            )}
          </div>
        </DragHandle>

      )}

      {editor && (
          <TextSelectionMenu
              editor={editor}

              disabled={
                  isHandleMenuOpen ||
                  mathEditorTarget !== null
              }

              onInsertInlineMath={
                handleInsertInlineMath
              }
          />
      )}

      {mathEditorTarget && (
          <MathEditorPopup
              key={
                `${mathEditorTarget.kind}-${mathEditorTarget.pos}`
              }

              anchorElement={
                mathEditorTarget
                    .anchorElement
              }

              getPreviewElement={() => {
                if (!editor) {
                  return null
                }

                const dom =
                    editor.view.nodeDOM(
                        mathEditorTarget.pos,
                    )

                if (
                    !(dom instanceof HTMLElement)
                ) {
                  return null
                }

                if (
                    mathEditorTarget.kind ===
                    'inline'
                ) {
                  return dom
                }

                if (
                    dom.classList.contains(
                        'block-math-inner',
                    )
                ) {
                  return dom
                }

                return dom.querySelector<HTMLElement>(
                    '.block-math-inner',
                )
              }}

              initialLatex={
                mathEditorTarget.latex
              }

              onSave={(latex) => {
                if (!editor) {
                  return
                }

                if (
                    mathEditorTarget.kind ===
                    'block'
                ) {
                  editor
                      .chain()
                      .focus()
                      .updateBlockMath({
                        pos:
                        mathEditorTarget.pos,

                        latex,
                      })
                      .run()
                } else {
                  editor
                      .chain()
                      .focus()
                      .updateInlineMath({
                        pos:
                        mathEditorTarget.pos,

                        latex,
                      })
                      .run()
                }

                setMathEditorTarget(
                    null,
                )
              }}

              onCancel={() => {
                /*
                 * Editing an existing equation:
                 * just abandon the changes.
                 */
                if (
                    !mathEditorTarget.isNew
                ) {
                  setMathEditorTarget(
                      null,
                  )

                  return
                }

                if (
                    mathEditorTarget.kind ===
                    'inline'
                ) {
                  if (editor) {
                    const pos =
                        mathEditorTarget.pos

                    const node =
                        editor.state.doc.nodeAt(
                            pos,
                        )

                    if (
                        node?.type.name ===
                        'inlineMath'
                    ) {
                      editor
                          .chain()
                          .focus()
                          .insertContentAt(
                              {
                                from:
                                pos,

                                to:
                                    pos +
                                    node.nodeSize,
                              },

                              mathEditorTarget
                                  .originalText ??
                              '',
                          )
                          .run()
                    }
                  }

                  setMathEditorTarget(
                      null,
                  )

                  return
                }

                /*
                 * New equation cancelled:
                 * turn it back into an empty
                 * paragraph rather than leaving
                 * an invisible blank math node.
                 */
                if (editor) {
                  const pos =
                      mathEditorTarget.pos

                  const node =
                      editor.state.doc.nodeAt(
                          pos,
                      )

                  if (
                      node?.type.name ===
                      'blockMath'
                  ) {
                    const transaction =
                        editor.state.tr
                            .setNodeMarkup(
                                pos,
                                editor.schema
                                    .nodes
                                    .paragraph,
                                {},
                            )

                    editor.view.dispatch(
                        transaction,
                    )

                    editor.commands
                        .setTextSelection(
                            pos + 1,
                        )
                  }
                }

                setMathEditorTarget(
                    null,
                )
              }}

              placement={
                mathEditorTarget.kind ===
                'inline'
                    ? 'bottom-start'
                    : 'bottom-start'
              }

              offsetDistance={
                mathEditorTarget.kind ===
                'inline'
                    ? 12
                    : 12
              }

              initialCursorSide={
                mathEditorTarget.kind ===
                  'inline'
                  ? mathEditorTarget
                        .entrySide
                    : undefined
              }

              onNavigateOut={
                mathEditorTarget.kind ===
                'inline'
                    ? (
                        direction,
                        latex,
                    ) => {
                      if (!editor) {
                        return
                      }

                      const pos =
                          mathEditorTarget.pos

                      editor
                          .chain()
                          .focus()
                          .updateInlineMath({
                            pos,
                            latex,
                          })
                          .run()

                      const node =
                          editor.state.doc.nodeAt(
                              pos,
                          )

                      if (
                          node?.type.name !==
                          'inlineMath'
                      ) {
                        setMathEditorTarget(
                            null,
                        )

                        return
                      }

                      const destination =
                          direction ===
                          'forward'
                              ? pos +
                              node.nodeSize
                              : pos

                      setMathEditorTarget(
                          null,
                      )

                      editor
                          .chain()
                          .focus()
                          .setTextSelection(
                              destination,
                          )
                          .run()
                    }
                    : undefined
              }
          />
      )}

      <EditorContent editor={editor} />
    </div>
  )
}

export default DashBlockEditor