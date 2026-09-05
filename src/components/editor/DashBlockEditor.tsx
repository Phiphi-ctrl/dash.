import {
  EditorContent,
  useEditor,
} from '@tiptap/react'
import type {
  Editor,
} from '@tiptap/core'
import {
  BackgroundColor,
  Color,
  TextStyle,
} from '@tiptap/extension-text-style'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import UniqueID from '@tiptap/extension-unique-id'
import {
  TaskItem,
  TaskList,
} from '@tiptap/extension-list'
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
  type PointerEvent as ReactPointerEvent,
} from 'react'
import BlockInsertMenu
  from './Menus/BlockInsertMenu.tsx'
import type {
  BlockInsertCommand
} from "./utils/blockDefinitions.ts"
import type {
  DashDocument,
} from '../../types/Block.ts'
import Tooltip from '../ui/Tooltip.tsx'
import TextSelectionMenu from './Menus/TextSelectionMenu.tsx'
import BlockActionMenu from "./Menus/BlockActionMenu.tsx";
import BlockStyle from './extensions/BlockStyle.ts'
import SlashCommands
  from './extensions/SlashCommands.ts'
import Columns from './extensions/Columns.ts'
import Column from './extensions/Column.ts'
import CodeBlock from './extensions/CodeBlock.ts'
import AudioBlock from "./extensions/AudioBlock.ts";
import ImageBlock from './extensions/ImageBlock.ts'
import PdfBlock from './extensions/PdfBlock.ts'
import {
  Mathematics,
} from '@tiptap/extension-mathematics'
import MathEditorPopup
  from './Menus/MathEditorPopup.tsx'
import 'katex/dist/katex.min.css'
import {findNodePosById, isPositionInsideColumn} from "../../utils/editorUtils.ts";
import {removeSourceForMove} from "../../utils/blockMovement.ts";
import type {
  NestedOptions,
} from '@tiptap/extension-drag-handle'

type DashBlockEditorProps = {
  value: DashDocument
  onChange: (
    document: DashDocument
  ) => void
}

const MIN_COLUMN_RATIO = 0.2
const MAX_COLUMN_RATIO = 0.8
const COLUMN_RESIZE_HIT_WIDTH = 24
const HEADING_OUTLINE_SCROLL_OFFSET = 80
const HEADING_OUTLINE_VIEWPORT_TOP_OFFSET = 40
const HEADING_OUTLINE_VIEWPORT_BOTTOM_INSET = 24
const HEADING_OUTLINE_VIEWPORT_MIN_HEIGHT = 160

const DEBUG_DROP_ZONES = false

type HeadingOutlineItem = {
  key: string
  id: string | null
  pos: number
  level: 1 | 2 | 3
  title: string
}

type HeadingOutlineViewportPosition = {
  top: number
  right: number
  maxHeight: number
}

function getHeadingOutlineItems(
    editor: Editor,
): HeadingOutlineItem[] {
  const items:
      HeadingOutlineItem[] = []

  editor.state.doc.descendants(
      (node, pos) => {
        if (
            node.type.name !==
            'heading'
        ) {
          return
        }

        const level =
            node.attrs.level

        if (
            level !== 1 &&
            level !== 2 &&
            level !== 3
        ) {
          return
        }

        const id =
            typeof node.attrs.id ===
            'string'
                ? node.attrs.id
                : null

        const title =
            node.textContent
                .trim() ||
            `Heading ${level}`

        items.push({
          key:
              id ??
              `${pos}-${level}`,

          id,
          pos,
          level,
          title,
        })
      },
  )

  return items
}

function areHeadingOutlineItemsEqual(
    first: HeadingOutlineItem[],
    second: HeadingOutlineItem[],
) {
  if (
      first.length !==
      second.length
  ) {
    return false
  }

  return first.every(
      (item, index) => {
        const other =
            second[index]

        return (
            other !== undefined &&
            item.key === other.key &&
            item.pos === other.pos &&
            item.level === other.level &&
            item.title === other.title
        )
      },
  )
}

function getHeadingOutlineBarClassName(
    level: HeadingOutlineItem['level'],
) {
  switch (level) {
    case 1:
      return 'w-5'

    case 2:
      return 'w-3'

    case 3:
      return 'w-1.5'
  }
}

function getHeadingOutlineTitleClassName(
    level: HeadingOutlineItem['level'],
) {
  switch (level) {
    case 1:
      return 'pl-0 text-sm font-semibold text-accent'

    case 2:
      return 'pl-5 text-sm font-medium text-foreground-secondary'

    case 3:
      return 'pl-10 text-xs font-normal text-muted'
  }
}

function getHeadingOutlineItemPos(
    editor: Editor,
    item: HeadingOutlineItem,
) {
  return item.id
      ? findNodePosById(
          editor.state.doc,
          item.id,
      ) ??
      item.pos
      : item.pos
}

const dragHandlePositionConfig = {
  placement: 'left-start' as const,
}

function isListContainerNodeName(
    value: string | null | undefined,
) {
  return (
      value === 'bulletList' ||
      value === 'taskList'
  )
}

function isListItemNodeName(
    value: string | null | undefined,
) {
  return (
      value === 'listItem' ||
      value === 'taskItem'
  )
}

function canDropListItemIntoContainer(
    itemNodeName: string | null | undefined,
    containerNodeName: string | null | undefined,
) {
  return (
      (
          itemNodeName === 'listItem' &&
          containerNodeName === 'bulletList'
      ) ||
      (
          itemNodeName === 'taskItem' &&
          containerNodeName === 'taskList'
      )
  )
}

function getDropContainerFromElement(
    element: Element | null,
    shell: HTMLElement,
) {
  if (!element) {
    return null
  }

  const listContainer =
      element.closest<HTMLElement>(
          'ul[data-type="bulletList"], ul[data-type="taskList"]',
      )

  if (
      listContainer &&
      shell.contains(listContainer)
  ) {
    return listContainer
  }

  const layoutContainer =
      element.closest<HTMLElement>(
      '.dash-column, .dash-editor',
      )

  return layoutContainer &&
      shell.contains(layoutContainer)
      ? layoutContainer
      : null
}

function getBulletListHandleOffset(
    element: HTMLElement,
    rect: DOMRect,
) {
  const list =
      element.closest<HTMLElement>(
          'ul[data-type="bulletList"]',
      )

  if (!list) {
    return 24
  }

  const listRect =
      list.getBoundingClientRect()

  const computedPadding =
      Number.parseFloat(
          window.getComputedStyle(list).paddingLeft,
      )

  return Math.min(
      Math.max(
          rect.left - listRect.left,
          Number.isFinite(computedPadding)
              ? computedPadding
              : 0,
          24,
      ),
      40,
  )
}

function getDragHandleReferenceRect(
    nodeName: string | null | undefined,
    element: HTMLElement,
) {
  const rect =
      element.getBoundingClientRect()

  if (
      nodeName !== 'listItem'
  ) {
    return rect
  }

  const offset =
      getBulletListHandleOffset(
          element,
          rect,
      )

  return new DOMRect(
      rect.left - offset,
      rect.top,
      rect.width + offset,
      rect.height,
  )
}

function getInsertPositionAfterHandleNode(
    editor: Editor,
    pos: number,
    nodeName: string,
    nodeSize: number,
) {
  if (
      !isListItemNodeName(
          nodeName,
      )
  ) {
    return pos + nodeSize
  }

  const $pos =
      editor.state.doc.resolve(
          pos,
      )

  for (
      let depth = $pos.depth;
      depth > 0;
      depth--
  ) {
    if (
        isListContainerNodeName(
            $pos.node(depth).type.name,
        )
    ) {
      return $pos.after(depth)
    }
  }

  return pos + nodeSize
}

const nestedDragHandleConfig:
    NestedOptions = {
  edgeDetection: 'none',

  rules: [
    {
      id:
          'excludeListItemContentBlocks',

      evaluate: ({
                   parent,
                 }) => {
        if (
            isListItemNodeName(
                parent?.type.name,
            )
        ) {
          return 1000
        }

        return 0
      },
    },

    {
      id:
          'excludeDashLayoutNodes',

      evaluate: ({
                   node,
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

  const draggedBlockIdRef =
      useRef<string | null>(null)

  const columnResizeRef =
      useRef<{
        columnsId: string
        pointerId: number

        left: number
        gap: number
        usableWidth: number
        pointerOffsetFromDivider: number

        ratio: number
      } | null>(null)

  type ColumnResizeTarget = {
    columnsElement: HTMLElement
    columnsId: string
    rect: DOMRect
    dividerX: number
    gap: number
    usableWidth: number
  }

  type ColumnResizeHandle = {
    columnsId: string
    top: number
    left: number
    height: number
    isActive: boolean
  }

  const [
    columnResizeHandle,
    setColumnResizeHandle,
  ] =
      useState<ColumnResizeHandle | null>(
          null,
      )

  type BlockDropTarget =
      | {
    kind: 'side'
    blockId: string
    side: 'left' | 'right'
  }
      | {
    kind: 'vertical'

    previousBlockId:
        string | null

    nextBlockId:
        string | null

    containerId:
        string | null
  }

  const blockDropTargetRef =
      useRef<BlockDropTarget | null>(
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

  //DEBUG VISUAL
  type DebugDropZone = {
    id: string

    top: number
    left: number
    width: number
    height: number

    label: string

    kind:
        | 'vertical'
        | 'side'
  }

  const [
    debugDropZones,
    setDebugDropZones,
  ] = useState<DebugDropZone[]>([])

  const [
    mathEditorTarget,
    setMathEditorTarget,
  ] =
      useState<MathEditorTarget | null>(
          null,
      )

  const [
    headingOutlineItems,
    setHeadingOutlineItems,
  ] =
      useState<HeadingOutlineItem[]>(
          [],
      )

  const [
    activeHeadingOutlineKey,
    setActiveHeadingOutlineKey,
  ] =
      useState<string | null>(
          null,
      )

  const [
    headingOutlineViewportPosition,
    setHeadingOutlineViewportPosition,
  ] =
      useState<HeadingOutlineViewportPosition | null>(
          null,
      )

  const syncHeadingOutline =
      useCallback(
          (editorInstance: Editor) => {
            const nextItems =
                getHeadingOutlineItems(
                    editorInstance,
                )

            setHeadingOutlineItems(
                (currentItems) =>
                    areHeadingOutlineItemsEqual(
                        currentItems,
                        nextItems,
                    )
                        ? currentItems
                        : nextItems,
            )
          },
          [],
      )

  function clampColumnRatio(
      ratio: number,
  ) {
    return Math.min(
        MAX_COLUMN_RATIO,
        Math.max(
            MIN_COLUMN_RATIO,
            ratio,
        ),
    )
  }

  function readColumnRatio(
      columnsElement: HTMLElement,
  ) {
    const parsedRatio =
        Number(
            columnsElement.dataset
                .columnRatio,
        )

    if (
        !Number.isFinite(
            parsedRatio,
        )
    ) {
      return 0.5
    }

    return clampColumnRatio(
        parsedRatio,
    )
  }

  function getColumnsElementById(
      columnsId: string,
  ) {
    const shell =
        editorShellRef.current

    if (!shell) {
      return null
    }

    return Array
        .from(
            shell.querySelectorAll<HTMLElement>(
                '.dash-columns',
            ),
        )
        .find(
            (element) =>
                element.dataset.id ===
                columnsId,
        ) ?? null
  }

  function getColumnResizeTargetFromElement(
      columnsElement: HTMLElement,
  ): ColumnResizeTarget | null {
    const columnElements =
        Array.from(
            columnsElement.children,
        ).filter(
            (element): element is HTMLElement =>
                element instanceof HTMLElement &&
                element.classList.contains(
                    'dash-column',
                ),
        )

    if (
        columnElements.length !== 2
    ) {
      return null
    }

    const leftRect =
        columnElements[0]
            .getBoundingClientRect()

    const rightRect =
        columnElements[1]
            .getBoundingClientRect()

    const rect =
        columnsElement
            .getBoundingClientRect()

    const computedStyle =
        window.getComputedStyle(
            columnsElement,
        )

    const parsedGap =
        Number.parseFloat(
            computedStyle.columnGap,
        )

    const actualGap =
        Math.max(
            0,
            rightRect.left -
            leftRect.right,
        )

    const gap =
        Number.isFinite(
            parsedGap,
        )
            ? parsedGap
            : actualGap

    const usableWidth =
        Math.max(
            1,
            rect.width -
            gap,
        )

    const dividerX =
        (
            leftRect.right +
            rightRect.left
        ) / 2

    const columnsId =
        columnsElement.dataset.id

    if (!columnsId) {
      return null
    }

    return {
      columnsElement,
      columnsId,
      rect,
      dividerX,
      gap,
      usableWidth,
    }
  }

  function getColumnResizeTarget(
      clientX: number,
      clientY: number,
  ): ColumnResizeTarget | null {
    const element =
        document.elementFromPoint(
            clientX,
            clientY,
        )

    const columnsElement =
        element?.closest<HTMLElement>(
            '.dash-columns',
        )

    const shell =
        editorShellRef.current

    if (
        !columnsElement ||
        !shell?.contains(
            columnsElement,
        )
    ) {
      return null
    }

    const target =
        getColumnResizeTargetFromElement(
            columnsElement,
        )

    if (!target) {
      return null
    }

    const gapHitWidth =
        Math.max(
            COLUMN_RESIZE_HIT_WIDTH,
            target.gap,
        )

    if (
        Math.abs(
            clientX -
            target.dividerX,
        ) > gapHitWidth / 2
    ) {
      return null
    }

    return target
  }

  function syncColumnResizeHandle(
      target: ColumnResizeTarget,
      isActive: boolean,
  ) {
    const shell =
        editorShellRef.current

    if (!shell) {
      return
    }

    const shellRect =
        shell.getBoundingClientRect()

    const nextHandle: ColumnResizeHandle = {
      columnsId:
      target.columnsId,

      top:
        target.rect.top -
        shellRect.top,

      left:
        target.dividerX -
        shellRect.left,

      height:
      target.rect.height,

      isActive,
    }

    setColumnResizeHandle(
        (current) => {
          if (
              current?.columnsId ===
              nextHandle.columnsId &&
              current.isActive ===
              nextHandle.isActive &&
              Math.abs(
                  current.top -
                  nextHandle.top,
              ) < 0.5 &&
              Math.abs(
                  current.left -
                  nextHandle.left,
              ) < 0.5 &&
              Math.abs(
                  current.height -
                  nextHandle.height,
              ) < 0.5
          ) {
            return current
          }

          return nextHandle
        },
    )
  }

  function handleColumnResizeStart(
      event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (!editor) {
      return
    }

    const columns =
        getColumnResizeTarget(
            event.clientX,
            event.clientY,
        )

    if (
        !columns ||
        event.button !== 0
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    event.currentTarget
        .setPointerCapture(
            event.pointerId,
        )

    const ratio =
        readColumnRatio(
            columns.columnsElement,
        )

    columnResizeRef.current = {
      columnsId:
      columns.columnsId,

      pointerId:
      event.pointerId,

      left:
      columns.rect.left,

      gap:
      columns.gap,

      usableWidth:
      columns.usableWidth,

      pointerOffsetFromDivider:
        event.clientX -
        columns.dividerX,

      ratio,
    }

    syncColumnResizeHandle(
        columns,
        true,
    )

    document.body.style.setProperty(
        'user-select',
        'none',
    )

    document.body.style.setProperty(
        'cursor',
        'col-resize',
    )
  }

  function handleColumnResizeMove(
      event: ReactPointerEvent<HTMLDivElement>,
  ) {
    const resize =
        columnResizeRef.current

    if (!resize) {
      const target =
          getColumnResizeTarget(
              event.clientX,
              event.clientY,
          )

      event.currentTarget.style.cursor =
          target
              ? 'col-resize'
              : ''

      if (target) {
        syncColumnResizeHandle(
            target,
            false,
        )
      } else {
        setColumnResizeHandle(
            null,
        )
      }

      return
    }

    if (!editor) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const dividerX =
        event.clientX -
        resize.pointerOffsetFromDivider

    const pointerX =
        dividerX -
        resize.left -
        resize.gap / 2

    const rawRatio =
        pointerX /
        resize.usableWidth

    const ratio =
        clampColumnRatio(
            rawRatio,
        )

    resize.ratio =
        ratio

    const pos =
        findNodePosById(
            editor.state.doc,
            resize.columnsId,
        )

    if (pos === null) {
      return
    }

    const node =
        editor.state.doc.nodeAt(
            pos,
        )

    if (
        node?.type.name !==
        'columns'
    ) {
      return
    }

    editor.view.dispatch(
        editor.state.tr
            .setNodeMarkup(
                pos,
                undefined,
                {
                  ...node.attrs,

                  columnRatio:
                  ratio,
                },
            )
            .setMeta(
                'addToHistory',
                false,
            ),
    )

    const columnsElement =
        getColumnsElementById(
            resize.columnsId,
        )

    if (!columnsElement) {
      return
    }

    const target =
        getColumnResizeTargetFromElement(
            columnsElement,
        )

    if (target) {
      syncColumnResizeHandle(
          target,
          true,
      )
    }
  }

  function handleColumnResizeEnd(
      event: ReactPointerEvent<HTMLDivElement>,
  ) {
    const resize =
        columnResizeRef.current

    if (!resize) {
      return
    }

    if (
        event.currentTarget
            .hasPointerCapture(
                resize.pointerId,
            )
    ) {
      event.currentTarget
          .releasePointerCapture(
              resize.pointerId,
          )
    }

    columnResizeRef.current =
        null

    document.body.style.removeProperty(
        'user-select',
    )

    document.body.style.removeProperty(
        'cursor',
    )

    const target =
        getColumnResizeTarget(
            event.clientX,
            event.clientY,
        )

    if (target) {
      syncColumnResizeHandle(
          target,
          false,
      )
      event.currentTarget.style.cursor =
          'col-resize'
    } else {
      setColumnResizeHandle(
          null,
      )
      event.currentTarget.style.cursor =
          ''
    }
  }

  function handleColumnResizeLeave(
      event: ReactPointerEvent<HTMLDivElement>,
  ) {
    if (columnResizeRef.current) {
      return
    }

    setColumnResizeHandle(
        null,
    )

    event.currentTarget.style.cursor =
        ''
  }

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

        bulletList: {
          HTMLAttributes: {
            'data-type':
              'bulletList',

            class:
              'dash-bullet-list',
          },
        },

        listItem: {
          HTMLAttributes: {
            'data-type':
              'listItem',

            class:
              'dash-list-item',
          },
        },

        trailingNode: false,

        dropcursor: false,

        codeBlock: false,
      }),

      Columns,
      Column,
      CodeBlock,
      TaskList.configure({
        HTMLAttributes: {
          'data-type':
            'taskList',

          class:
            'dash-task-list',
        },
      }),
      TaskItem.configure({
        HTMLAttributes: {
          'data-type':
            'taskItem',

          class:
            'dash-task-item',
        },

        nested:
          false,
      }),
      AudioBlock,
      ImageBlock,
      PdfBlock,

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
          'codeBlock',
          'bulletList',
          'listItem',
          'taskList',
          'taskItem',
          'audioBlock',
          'imageBlock',
          'pdfBlock',
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

    onCreate: ({
                 editor,
               }) => {
      syncHeadingOutline(
          editor,
      )
    },

    editorProps: {
      attributes: {
        class:
            'dash-editor outline-none text-foreground px-8',
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

        if (sourcePos === null) {
          return false
        }

        const target =
            blockDropTargetRef.current

        if (target === null) {
          return true
        }

        let transaction =
            view.state.tr

        const removalResult =
            removeSourceForMove(
                transaction,
                sourcePos,
            )

        if (!removalResult) {
          return true
        }

        transaction =
            removalResult.transaction

        const sourceNode =
            removalResult.sourceNode

        const movedNode =
            sourceNode.type.create(
                sourceNode.attrs,
                sourceNode.content,
                sourceNode.marks,
            )

        switch (target.kind) {
          case 'vertical': {

            let insertPos: number | null = null

            if (
                target.nextBlockId !== null
            ) {
              const nextPos =
                  findNodePosById(
                      transaction.doc,
                      target.nextBlockId,
                  )

              if (nextPos !== null) {
                insertPos =
                    nextPos
              }
            }

            if (
                insertPos === null &&
                target.previousBlockId !== null
            ) {
              const previousPos =
                  findNodePosById(
                      transaction.doc,
                      target.previousBlockId,
                  )

              if (
                  previousPos !== null
              ) {
                const previousNode =
                    transaction.doc.nodeAt(
                        previousPos,
                    )

                if (previousNode) {
                  insertPos =
                      previousPos +
                      previousNode.nodeSize
                }
              }
            }

            if (
                insertPos === null &&
                target.containerId === null
            ) {
              if (
                  target.previousBlockId === null
              ) {
                insertPos = 0
              } else if (
                  target.nextBlockId === null
              ) {
                insertPos =
                    transaction.doc.content.size
              }
            }

            if(insertPos === null && target.containerId !== null) {
              const containerPos = findNodePosById(transaction.doc, target.containerId)
              if (
                  containerPos !== null
              ) {
                const containerNode =
                    transaction.doc.nodeAt(
                        containerPos,
                    )

                if (
                    containerNode?.type.name ===
                    'column' ||
                    isListContainerNodeName(
                        containerNode?.type.name,
                    )
                ) {
                  if (
                      target.previousBlockId ===
                      null
                  ) {
                    insertPos =
                        containerPos + 1
                  } else if (
                      target.nextBlockId ===
                      null
                  ) {
                    insertPos =
                        containerPos +
                        containerNode.nodeSize -
                        1
                  }
                }
              }
            }

            if (
                insertPos === null
            ) {
              return true
            }

            transaction.insert(
                insertPos,
                movedNode,
            )

            break
          }

          case 'side': {
            const targetPos =
                findNodePosById(
                    transaction.doc,
                    target.blockId,
                )

            if (
                targetPos === null
            ) {
              return true
            }

            const targetNode =
                transaction.doc.nodeAt(
                    targetPos,
                )

            if (!targetNode) {
              return true
            }
            const $target =
                transaction.doc.resolve(
                    targetPos,
                )

            if (
                $target.parent.type.name !==
                'doc'
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
                    ? movedNode
                    : targetNode

            const rightNode =
                target.side === 'left'
                    ? targetNode
                    : movedNode

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

            transaction.replaceWith(
                targetPos,
                targetPos +
                targetNode.nodeSize,
                columnsNode,
            )

            break
          }
        }

        event.preventDefault()

        view.dispatch(
            transaction,
        )

        blockDropTargetRef.current =
            null

        draggedBlockPosRef.current =
            null

        draggedBlockIdRef.current =
            null

        return true

        // ---------new changes above work out the rest below

      },
    },

    onUpdate: ({ editor }) => {
      syncHeadingOutline(
          editor,
      )

      onChange(
        editor.getJSON()
      )
    },
  },[])

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

    if (command.type === 'codeBlock') {
      editor
          .chain()
          .focus()
          .insertContentAt(
              insertPos,
              {
                type:
                    'codeBlock',
              },
          )
          .setTextSelection(
              insertPos + 1,
          )
          .run()

      closeHandleMenu()

      return
    }

    if (
        command.type === 'bulletList' ||
        command.type === 'taskList'
    ) {
      const content =
          command.type === 'bulletList'
              ? {
                type: 'bulletList',
                content: [
                  {
                    type: 'listItem',
                    content: [
                      {
                        type: 'paragraph',
                      },
                    ],
                  },
                ],
              }
              : {
                type: 'taskList',
                content: [
                  {
                    type: 'taskItem',
                    attrs: {
                      checked: false,
                    },
                    content: [
                      {
                        type: 'paragraph',
                      },
                    ],
                  },
                ],
              }

      editor
          .chain()
          .focus()
          .insertContentAt(
              insertPos,
              content,
          )
          .setTextSelection(
              insertPos + 3,
          )
          .run()

      closeHandleMenu()

      return
    }

    if (command.type === 'audioBlock') {
      editor
          .chain()
          .focus()
          .insertContentAt(
              insertPos,
              {
                type:
                    'audioBlock',
              },
          )
          .run()

      closeHandleMenu()

      return
    }

    if (command.type === 'imageBlock') {
      editor
          .chain()
          .focus()
          .insertContentAt(
              insertPos,
              {
                type:
                    'imageBlock',
              },
          )
          .run()

      closeHandleMenu()

      return
    }

    if (command.type === 'pdfBlock') {
      editor
          .chain()
          .focus()
          .insertContentAt(
              insertPos,
              {
                type:
                    'pdfBlock',
              },
          )
          .run()

      closeHandleMenu()

      return
    }

    if (command.type === 'columns') {
      const isInsideColumn = isPositionInsideColumn(editor.state.doc, insertPos)
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

    if (command.type === 'blockMath') {
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

  function getHandleVirtualElement() {
    if (!editor) {
      return null
    }

    const pos =
        lockedHandlePosRef.current ??
        activeNodePosRef.current

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

        const node =
            editor.state.doc.nodeAt(
                pos,
            )

        return getDragHandleReferenceRect(
            node?.type.name,
            dom,
        )
      },
    }
  }

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
      }, [
        editor,
        setOpenHandleMenu,
      ])

  function handleHeadingOutlineClick(
      item: HeadingOutlineItem,
  ) {
    if (!editor) {
      return
    }

    const currentPos =
        getHeadingOutlineItemPos(
            editor,
            item,
        )

    const node =
        editor.state.doc.nodeAt(
            currentPos,
        )

    if (
        node?.type.name !==
        'heading'
    ) {
      return
    }

    const dom =
        editor.view.nodeDOM(
            currentPos,
        )

    if (
        !(dom instanceof HTMLElement)
    ) {
      return
    }

    closeHandleMenu()

    const scrollViewport =
        editorShellRef.current
            ?.closest<HTMLElement>(
                '[data-note-scroll-viewport]',
            )

    if (!scrollViewport) {
      dom.scrollIntoView({
        block:
            'start',

        behavior:
            'smooth',
      })

      return
    }

    const viewportRect =
        scrollViewport
            .getBoundingClientRect()

    const headingRect =
        dom.getBoundingClientRect()

    scrollViewport.scrollTo({
      top:
          Math.max(
              0,
              scrollViewport.scrollTop +
              headingRect.top -
              viewportRect.top -
              HEADING_OUTLINE_SCROLL_OFFSET,
          ),

      behavior:
          'smooth',
    })
  }

  function hideDropIndicator() {
    if (!dropIndicatorRef.current) {
      return
    }

    dropIndicatorRef.current.style.opacity = '0'
  }

  function clearDropTarget() {
    blockDropTargetRef.current =
        null

    hideDropIndicator()

    if (DEBUG_DROP_ZONES) {
      setDebugDropZones([])
    }
  }

  function handleDragEnd() {
    hideDropIndicator()

    const draggedBlockId =
        draggedBlockIdRef.current

    if (
        editor &&
        draggedBlockId !== null
    ) {
      const currentPos =
          findNodePosById(
              editor.state.doc,
              draggedBlockId,
          )

      if (currentPos !== null) {
        const currentNode =
            editor.state.doc.nodeAt(
                currentPos,
            )

        if (currentNode) {
          editor.view.dispatch(
              editor.state.tr
                  .setNodeMarkup(
                      currentPos,
                      currentNode.type,
                      currentNode.attrs,
                      currentNode.marks,
                  )
                  .setMeta(
                      'addToHistory',
                      false,
                  ),
          )
        }
      }
    }

    draggedBlockPosRef.current =
        null

    draggedBlockIdRef.current =
        null

    blockDropTargetRef.current =
        null

    if (DEBUG_DROP_ZONES) {
      setDebugDropZones([])
    }
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

    const node =
        editor.state.doc.nodeAt(pos)

    draggedBlockIdRef.current =
        typeof node?.attrs.id === 'string'
            ? node.attrs.id
            : null
  }

  function handleDragImageStart() {
    const pos =
        activeNodePosRef.current

    if (
        pos === null ||
        !editor
    ) {
      return
    }

    const dom =
        editor.view.nodeDOM(pos)

    if (
        !(dom instanceof HTMLElement)
    ) {
      return
    }

    const previousOpacity =
        dom.style.opacity

    /*
     * Tiptap's drag handler runs
     * immediately after this callback
     * and builds its ghost from the
     * node's current computed styles.
     */
    dom.style.opacity = '0.3'

    /*
     * Restore before the browser
     * gets a chance to paint the
     * stationary editor block.
     */
    queueMicrotask(() => {
      dom.style.opacity =
          previousOpacity
    })
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault()

    const shell =
      editorShellRef.current

    const indicator =
      dropIndicatorRef.current

    if (
        !shell ||
        !indicator ||
        !editor
    ) {
      return
    }

    const elementUnderPointer =
        document.elementFromPoint(
            event.clientX,
            event.clientY,
        )

    const activeContainer =
        getDropContainerFromElement(
            elementUnderPointer,
            shell,
        )

    if (!activeContainer) {
      clearDropTarget()
      return
    }

    const activeContainerType =
        activeContainer.dataset.type ??
        null

    const isListContainer =
        isListContainerNodeName(
            activeContainerType,
        )

    const isRootContainer =
        !isListContainer &&
        activeContainer.classList.contains(
            'dash-editor',
        )

    const verticalContainerId =
        isRootContainer
            ? null
            : activeContainer.dataset.id ??
            null

    if (
        isListContainer &&
        !verticalContainerId
    ) {
      clearDropTarget()
      return
    }

    const draggedPos =
        draggedBlockPosRef.current

    const draggedNode =
        draggedPos !== null
            ? editor.state.doc.nodeAt(
                draggedPos,
            )
            : null

    const draggedNodeName =
        draggedNode?.type.name ??
        null

    if (
        isListContainer &&
        !canDropListItemIntoContainer(
            draggedNodeName,
            activeContainerType,
        )
    ) {
      clearDropTarget()
      return
    }

    if (
        !isListContainer &&
        isListItemNodeName(
            draggedNodeName,
        )
    ) {
      clearDropTarget()
      return
    }

    const blocks = Array.from(
      activeContainer.children,
    ).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement &&
        element.hasAttribute('data-id')
    )

    if (blocks.length === 0) {
      clearDropTarget()
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

      const canSideDrop =
          draggedNode?.attrs.id !==
          hoveredBlock.dataset.id &&
          hoveredBlock.dataset.type !==
          'columns'

      if (canSideDrop) {
        const sideZoneWidth =
            hoveredRect.width * 0.2

        if (DEBUG_DROP_ZONES) {
          setDebugDropZones([
            {
              id:
                  'side-left',

              top:
                  hoveredRect.top -
                  shellRect.top,

              left:
                  hoveredRect.left -
                  shellRect.left,

              width:
              sideZoneWidth,

              height:
              hoveredRect.height,

              label:
                  'LEFT',

              kind:
                  'side',
            },

            {
              id:
                  'side-right',

              top:
                  hoveredRect.top -
                  shellRect.top,

              left:
                  hoveredRect.right -
                  sideZoneWidth -
                  shellRect.left,

              width:
              sideZoneWidth,

              height:
              hoveredRect.height,

              label:
                  'RIGHT',

              kind:
                  'side',
            },
          ])
        }

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
          blockDropTargetRef.current = {
            kind: 'side',
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



    blockDropTargetRef.current = null

    //reset the indicator
    indicator.style.height =
        '6px'

    indicator.style.transform =
        'translateY(-50%)'

    type DropZone = {
      start: number
      end: number
      position: number

      target: {
        previousBlockId:
            string | null

        nextBlockId:
            string | null

        containerId:
            string | null
      }
    }

    const dropZones: DropZone[] = []

    const edgeTolerance = 12

    /*
     * Before the first block
     */
    const firstRect =
      blockRects[0]

    const firstBlock =
        blocks[0]

    const firstBlockId =
        firstBlock.dataset.id

    if(firstBlockId === undefined) {
      return
    }

    dropZones.push({
      start:
      editorRect.top,

      end:
        firstRect.top +
        edgeTolerance,

      position:
      firstRect.top,

      target: {
        previousBlockId: null,
        nextBlockId: firstBlockId,
        containerId: verticalContainerId,
      }
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

      const currentBlock =
          blocks[index]

      const nextBlock =
          blocks[index + 1]

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

        target: {
          previousBlockId: currentBlock.dataset.id!,
          nextBlockId: nextBlock.dataset.id!,
          containerId: verticalContainerId,
        }
      })
    }

    /*
     * Below last block
     */
    const lastRect =
      blockRects[
      blockRects.length - 1
        ]

    const lastBlock =
        blocks[blocks.length - 1]

    dropZones.push({
      start:
        lastRect.bottom -
        edgeTolerance,

      end:
      editorRect.bottom,

      position:
        lastRect.bottom + 12,

      target: {
        previousBlockId: lastBlock.dataset.id!,
        nextBlockId: null,
        containerId: verticalContainerId,
      }
    })

    if (DEBUG_DROP_ZONES) {
      const verticalDebugZones =
          dropZones.map(
              (zone, index) => ({
                id: `vertical-${index}`,

                top:
                    zone.start -
                    shellRect.top,

                left:
                    editorRect.left -
                    shellRect.left,

                width:
                editorRect.width,

                height:
                    zone.end -
                    zone.start,

                label:
                    zone.target.previousBlockId === null
                        ? `before ${zone.target.nextBlockId?.slice(0, 5)}`
                        : zone.target.nextBlockId === null
                            ? `after ${zone.target.previousBlockId.slice(0, 5)}`
                            : `${zone.target.previousBlockId.slice(0, 5)} | ${zone.target.nextBlockId.slice(0, 5)}`,

                kind:
                    'vertical' as const,
              }),
          )

      setDebugDropZones(
          verticalDebugZones,
      )
    }

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
      clearDropTarget()
      return
    }

    blockDropTargetRef.current = {
      kind: 'vertical',
      ...activeDropZone.target,
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
        getInsertPositionAfterHandleNode(
            editor,
            pos,
            node.type.name,
            node.nodeSize,
        )

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

  useEffect(() => {
    if (
        headingOutlineItems.length === 0
    ) {
      return
    }

    const editorShell =
        editorShellRef.current

    if (!editorShell) {
      return
    }

    const scrollViewport =
        editorShell
            .closest<HTMLElement>(
                '[data-note-scroll-viewport]',
            )

    if (!scrollViewport) {
      return
    }

    const activeScrollViewport =
        scrollViewport

    let animationFrameId:
        number | null = null

    function updateHeadingOutlinePosition() {
      animationFrameId = null

      const viewportRect =
          activeScrollViewport
              .getBoundingClientRect()

      const top =
          Math.max(
              HEADING_OUTLINE_VIEWPORT_TOP_OFFSET,
              viewportRect.top +
              HEADING_OUTLINE_VIEWPORT_TOP_OFFSET,
          )

      const viewportBottom =
          Math.min(
              window.innerHeight -
              HEADING_OUTLINE_VIEWPORT_BOTTOM_INSET,
              viewportRect.bottom,
          )

      const nextPosition:
          HeadingOutlineViewportPosition = {
        top,

        right:
            Math.max(
                0,
                window.innerWidth -
                viewportRect.right,
            ),

        maxHeight:
            Math.max(
                HEADING_OUTLINE_VIEWPORT_MIN_HEIGHT,
                viewportBottom -
                top,
            ),
      }

      setHeadingOutlineViewportPosition(
          (currentPosition) => {
            if (
                currentPosition &&
                Math.abs(
                    currentPosition.top -
                    nextPosition.top,
                ) < 0.5 &&
                Math.abs(
                    currentPosition.right -
                    nextPosition.right,
                ) < 0.5 &&
                Math.abs(
                    currentPosition.maxHeight -
                    nextPosition.maxHeight,
                ) < 0.5
            ) {
              return currentPosition
            }

            return nextPosition
          },
      )
    }

    function scheduleHeadingOutlinePositionUpdate() {
      if (animationFrameId !== null) {
        return
      }

      animationFrameId =
          window.requestAnimationFrame(
              updateHeadingOutlinePosition,
          )
    }

    scheduleHeadingOutlinePositionUpdate()

    activeScrollViewport.addEventListener(
        'scroll',
        scheduleHeadingOutlinePositionUpdate,
        {
          passive: true,
        },
    )

    window.addEventListener(
        'resize',
        scheduleHeadingOutlinePositionUpdate,
    )

    const resizeObserver =
        typeof ResizeObserver === 'undefined'
            ? null
            : new ResizeObserver(
                scheduleHeadingOutlinePositionUpdate,
            )

    resizeObserver?.observe(
        activeScrollViewport,
    )

    resizeObserver?.observe(
        editorShell,
    )

    return () => {
      activeScrollViewport.removeEventListener(
          'scroll',
          scheduleHeadingOutlinePositionUpdate,
      )

      window.removeEventListener(
          'resize',
          scheduleHeadingOutlinePositionUpdate,
      )

      resizeObserver?.disconnect()

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(
            animationFrameId,
        )
      }
    }
  }, [
    headingOutlineItems.length,
  ])

  useEffect(() => {
    if (
        !editor ||
        headingOutlineItems.length === 0
    ) {
      return
    }

    const scrollViewport =
        editorShellRef.current
            ?.closest<HTMLElement>(
                '[data-note-scroll-viewport]',
            )

    if (!scrollViewport) {
      return
    }

    const activeScrollViewport =
        scrollViewport

    let animationFrameId:
        number | null = null

    function updateActiveHeading() {
      animationFrameId = null

      const viewportRect =
          activeScrollViewport
              .getBoundingClientRect()

      const activeLine =
          viewportRect.top +
          HEADING_OUTLINE_SCROLL_OFFSET

      let activeKey:
          string | null = null

      let firstVisibleKey:
          string | null = null

      for (
          const item of
          headingOutlineItems
      ) {
        const currentPos =
            getHeadingOutlineItemPos(
                editor,
                item,
            )

        const node =
            editor.state.doc.nodeAt(
                currentPos,
            )

        if (
            node?.type.name !==
            'heading'
        ) {
          continue
        }

        const dom =
            editor.view.nodeDOM(
                currentPos,
            )

        if (
            !(dom instanceof HTMLElement)
        ) {
          continue
        }

        const headingRect =
            dom.getBoundingClientRect()

        if (
            firstVisibleKey === null &&
            headingRect.bottom >=
            viewportRect.top
        ) {
          firstVisibleKey =
              item.key
        }

        if (
            headingRect.top <=
            activeLine
        ) {
          activeKey =
              item.key

          continue
        }

        break
      }

      const nextActiveKey =
          activeKey ??
          firstVisibleKey

      setActiveHeadingOutlineKey(
          (currentKey) =>
              currentKey ===
              nextActiveKey
                  ? currentKey
                  : nextActiveKey,
      )
    }

    function scheduleActiveHeadingUpdate() {
      if (animationFrameId !== null) {
        return
      }

      animationFrameId =
          window.requestAnimationFrame(
              updateActiveHeading,
          )
    }

    scheduleActiveHeadingUpdate()

    activeScrollViewport.addEventListener(
        'scroll',
        scheduleActiveHeadingUpdate,
        {
          passive: true,
        },
    )

    window.addEventListener(
        'resize',
        scheduleActiveHeadingUpdate,
    )

    return () => {
      activeScrollViewport.removeEventListener(
          'scroll',
          scheduleActiveHeadingUpdate,
      )

      window.removeEventListener(
          'resize',
          scheduleActiveHeadingUpdate,
      )

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(
            animationFrameId,
        )
      }
    }
  }, [
    editor,
    headingOutlineItems,
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

      onDrop={clearDropTarget}

      onDragEnd={handleDragEnd}

      onPointerDownCapture={
        handleColumnResizeStart
      }

      onPointerMove={
        handleColumnResizeMove
      }

      onPointerUp={
        handleColumnResizeEnd
      }

      onPointerCancel={
        handleColumnResizeEnd
      }

      onPointerLeave={
        handleColumnResizeLeave
      }

      className="
      dash-editor-shell
      relative
      items-center
    "
    >
      {columnResizeHandle && (
          <div
              data-column-resize-handle
              className="
                pointer-events-none
                absolute
                z-40
                flex
                w-6
                -translate-x-1/2
                items-center
                justify-center
                rounded-full
                transition-opacity
                duration-150
              "
              style={{
                top:
                columnResizeHandle.top,

                left:
                columnResizeHandle.left,

                height:
                columnResizeHandle.height,
              }}
          >
            <div
                className={`
                  h-full
                  w-1
                  rounded-full
                  transition-colors
                  ${
                    columnResizeHandle.isActive
                        ? 'bg-surface-hover shadow-lg'
                        : 'bg-surface'
                  }
                `}
            />
          </div>
      )}

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

      {DEBUG_DROP_ZONES &&
          debugDropZones.map(
              (zone) => (
                  <div
                      key={zone.id}

                      className={`
                        pointer-events-none
                        absolute
                        z-40
                        box-border
                        border
              
                        ${
                          zone.kind === 'vertical'
                              ? 'border-blue-400/60 bg-blue-400/10'
                              : 'border-purple-400/60 bg-purple-400/10'
                        }
                      `}

                      style={{
                        top:
                        zone.top,

                        left:
                        zone.left,

                        width:
                        zone.width,

                        height:
                        zone.height,
                      }}
                  >
                    <span
                        className="
                        absolute
                        left-1
                        top-0.5
                        whitespace-nowrap
                        text-[9px]
                        font-medium
                        text-foreground/60
                      "
                    >
                      {zone.label}
                    </span>
                  </div>
              ),
          )}

      {editor && (
          <DragHandle
              editor={editor}

              onElementDragStart={handleDragImageStart}

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
                } else {
                  activeNodePosRef.current =
                      null
                }
              }}
          >
          <div
            className={`
              flex
              -translate-x-2
              items-center
              gap-0.5
            `}
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
                <GripVertical size={20} />
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

      {headingOutlineItems.length > 0 && (
          <div
              className="
                pointer-events-none
                fixed
                z-40
                h-0
                w-7
              "
              style={{
                top:
                    `${headingOutlineViewportPosition?.top ?? 0}px`,

                right:
                    `${headingOutlineViewportPosition?.right ?? 0}px`,

                visibility:
                    headingOutlineViewportPosition
                        ? 'visible'
                        : 'hidden',
              }}
          >
            <nav
                aria-label="Document headings"
                className="
                  group/heading-outline
                  pointer-events-auto
                  absolute
                  right-0
                  top-0

                  flex
                  w-7
                  flex-col
                  items-stretch
                  gap-0.5
                  overflow-x-hidden
                  overflow-y-auto

                  rounded-4xl
                  border
                  border-transparent
                  bg-transparent
                  px-1
                  py-3
                  shadow-none
                  backdrop-blur-none
                  scrollbar-none

                  transition-[width,padding,gap,border-color,background-color,box-shadow,backdrop-filter]
                  duration-300
                  ease-out

                  hover:w-80
                  hover:border-white/10
                  hover:bg-canvas/50
                  hover:gap-1
                  hover:px-6
                  hover:py-8
                  hover:shadow-xl
                  hover:backdrop-blur-xl

                  focus-within:w-80
                  focus-within:border-white/10
                  focus-within:bg-transparent
                  focus-within:gap-1
                  focus-within:px-6
                  focus-within:py-8
                  focus-within:shadow-xl
                  focus-within:backdrop-blur-xl
                "
                style={{
                  maxHeight:
                      headingOutlineViewportPosition
                          ? `${headingOutlineViewportPosition.maxHeight}px`
                          : undefined,
                }}
            >
              {headingOutlineItems.map(
                  (item) => {
                    const isActiveHeading =
                        item.key ===
                        activeHeadingOutlineKey

                    return (
                        <button
                            key={item.key}

                            type="button"

                            aria-label={
                              `Go to ${item.title}`
                            }

                            onMouseDown={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                            }}

                            onClick={() => {
                              handleHeadingOutlineClick(
                                  item,
                              )
                            }}

                            className={`
                              relative
                              flex
                              h-3
                              w-full
                              shrink-0
                              cursor-pointer
                              items-center
                              rounded-lg
                              p-2

                              text-left
                              transition-[height,background-color]
                              duration-200
                              ease-out

                              group-hover/heading-outline:h-8
                              group-focus-within/heading-outline:h-8
                              focus-visible:outline-none
                              focus-visible:ring-1
                              focus-visible:ring-accent/60

                              ${
                                  isActiveHeading
                                      ? `
                                        group-hover/heading-outline:bg-transparent
                                        group-focus-within/heading-outline:bg-surface-hover
                                      `
                                      : `
                                        group-hover/heading-outline:hover:bg-transparent
                                        group-focus-within/heading-outline:hover:bg-surface-hover
                                      `
                              }
                            `}
                        >
                          <span
                              className={`
                                min-w-0
                                max-w-full
                                truncate
                                opacity-0
                                translate-x-2

                                absolute
                                inset-y-0
                                left-0
                                right-0
                                flex
                                items-center

                                transition-[opacity,transform]
                                delay-75
                                duration-150
                                ease-out

                                group-hover/heading-outline:opacity-100
                                group-hover/heading-outline:translate-x-0

                                group-focus-within/heading-outline:opacity-100
                                group-focus-within/heading-outline:translate-x-0

                                ${getHeadingOutlineTitleClassName(
                                    item.level,
                                )}
                              `}
                          >
                            {item.title}
                          </span>

                          <span
                              className={`
                                absolute
                                right-0
                                top-1/2

                                h-1
                                shrink-0
                                rounded-full
                                -translate-y-1/2
                                origin-right

                                transition-[opacity,transform,background-color]
                                duration-300
                                ease-out

                                ${getHeadingOutlineBarClassName(
                                    item.level,
                                )}

                                ${
                                    isActiveHeading
                                        ? 'bg-foreground/80 hover:bg-foreground/90'
                                        : 'bg-foreground/40 hover:bg-foreground/80'
                                }

                                group-hover/heading-outline:opacity-0
                                group-hover/heading-outline:scale-x-75

                                group-focus-within/heading-outline:opacity-0
                                group-focus-within/heading-outline:scale-x-75
                              `}
                          />
                        </button>
                    )
                  },
              )}
            </nav>
          </div>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}

export default DashBlockEditor
