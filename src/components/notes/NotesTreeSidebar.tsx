import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  Inbox,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import {
  forwardRef,
  useEffect,
  useMemo,
  useImperativeHandle,
  useRef,
  useState,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react'

import type { Category } from '../../types/Category.ts'
import type { Note } from '../../types/Note.ts'
import type { NoteFolder } from '../../types/NoteFolder.ts'
import {
  buildNoteTree,
  canMoveFolder,
  getFolderAncestorIds,
  isFolderInTrash,
  NOTES_INBOX_FOLDER_ID,
  NOTES_TRASH_FOLDER_ID,
  type NoteTreeFolderNode,
} from '../../utils/noteTree.ts'
import { dateTimeFormatter } from '../../utils/Datetime.ts'

type DraggedTreeItem =
  | {
      type: 'note'
      id: string
    }
  | {
      type: 'folder'
      id: string
    }

type NotesTreeSidebarProps = {
  categories: Category[]
  folders: NoteFolder[]
  notes: Note[]
  activeFolderId: string
  selectedNoteId: string | null
  onActiveFolderChange: (folderId: string) => void
  onRenameFolder: (folderId: string, name: string) => void
  onDeleteFolder: (folderId: string) => void
  onEmptyTrash: () => void
  onMoveNote: (noteId: string, targetFolderId: string) => void
  onMoveFolder: (folderId: string, targetFolderId: string) => void
  onSelectNote: (noteId: string) => void
}

export type NotesTreeSidebarHandle = {
  startEditingFolder: (
    folderId: string,
    name: string,
    parentId: string | null,
  ) => void
}

const DRAG_MIME_TYPE = 'application/x-dash-note-tree-item'
const NOTE_SEARCH_SNIPPET_RADIUS = 44

type UnknownRecord = Record<string, unknown>

type NoteSearchResult = {
  note: Note
  title: string
  snippet: string
  rank: number
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null
}

function collectDocumentText(value: unknown, parts: string[]) {
  if (Array.isArray(value)) {
    value.forEach((item) => {
      collectDocumentText(
        item,
        parts,
      )
    })

    return
  }

  if (!isRecord(value)) {
    return
  }

  if (typeof value.text === 'string') {
    parts.push(value.text)
  }

  const attrs =
    value.attrs

  if (isRecord(attrs)) {
    const searchableAttrValues = [
      attrs.alt,
      attrs.fileName,
      attrs.name,
    ]

    searchableAttrValues.forEach((attrValue) => {
      if (typeof attrValue === 'string') {
        parts.push(attrValue)
      }
    })
  }

  collectDocumentText(
    value.content,
    parts,
  )
}

function getNoteDocumentText(note: Note) {
  const parts:
    string[] = []

  collectDocumentText(
    note.document,
    parts,
  )

  return parts
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getNoteSearchSnippet(
  documentText: string,
  normalizedQuery: string,
) {
  if (!documentText) {
    return ''
  }

  const normalizedDocumentText =
    documentText.toLowerCase()

  const matchIndex =
    normalizedDocumentText.indexOf(
      normalizedQuery,
    )

  if (matchIndex === -1) {
    return ''
  }

  const startIndex =
    Math.max(
      0,
      matchIndex -
      NOTE_SEARCH_SNIPPET_RADIUS,
    )

  const endIndex =
    Math.min(
      documentText.length,
      matchIndex +
      normalizedQuery.length +
      NOTE_SEARCH_SNIPPET_RADIUS,
    )

  return [
    startIndex > 0 ? '...' : '',
    documentText
      .slice(startIndex, endIndex)
      .trim(),
    endIndex < documentText.length ? '...' : '',
  ].join('')
}

function getNoteSearchResult(
  note: Note,
  normalizedQuery: string,
): NoteSearchResult | null {
  const title =
    note.title.trim() ||
    'Untitled'

  const documentText =
    getNoteDocumentText(note)

  const normalizedTitle =
    title.toLowerCase()

  const normalizedDocumentText =
    documentText.toLowerCase()

  const titleMatchIndex =
    normalizedTitle.indexOf(
      normalizedQuery,
    )

  const documentMatchIndex =
    normalizedDocumentText.indexOf(
      normalizedQuery,
    )

  if (
    titleMatchIndex === -1 &&
    documentMatchIndex === -1
  ) {
    return null
  }

  return {
    note,
    title,
    snippet:
      getNoteSearchSnippet(
        documentText,
        normalizedQuery,
      ),

    rank:
      titleMatchIndex === 0
        ? 0
        : titleMatchIndex > -1
          ? 1
          : 2,
  }
}

const trashActionHoverClass = `
  opacity-0

  focus-visible:opacity-100
  group-hover/folder-row:opacity-100
  group-focus-within/folder-row:opacity-100
`

const rowActionButtonClass = `
  flex
  h-7
  w-7
  shrink-0
  cursor-pointer
  items-center
  justify-center
  rounded-lg
  text-muted
  transition-[background-color,color,opacity]
  duration-200

  hover:bg-accent-danger-soft
  hover:text-danger

  ${trashActionHoverClass}
`

const trashActionButtonClass = `
  flex
  h-7
  w-7
  shrink-0
  cursor-pointer
  items-center
  justify-center
  rounded-lg
  text-muted
  outline-none
  transition-[background-color,color,transform]
  duration-200

  enabled:hover:bg-accent-soft
  enabled:hover:text-accent
  enabled:focus-visible:bg-accent-soft
  enabled:focus-visible:text-accent
  disabled:cursor-default
  disabled:opacity-35
`

const NotesTreeSidebar = forwardRef<NotesTreeSidebarHandle, NotesTreeSidebarProps>(function NotesTreeSidebar({
  categories,
  folders,
  notes,
  activeFolderId,
  selectedNoteId,
  onActiveFolderChange,
  onRenameFolder,
  onDeleteFolder,
  onEmptyTrash,
  onMoveNote,
  onMoveFolder,
  onSelectNote,
}, ref) {
  const draggedItemRef = useRef<DraggedTreeItem | null>(null)
  const emptyTrashSpinTimeoutRef = useRef<number | null>(null)

  const tree = useMemo(
    () => buildNoteTree(categories, folders, notes),
    [
      categories,
      folders,
      notes,
    ],
  )

  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(
    () =>
      new Set([
        NOTES_INBOX_FOLDER_ID,
        ...categories.map((category) => `category:${category.id}`),
      ]),
  )

  const [draggedItem, setDraggedItem] = useState<DraggedTreeItem | null>(null)

  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null)

  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)

  const [editingFolderName, setEditingFolderName] = useState('')

  const [isEmptyTrashAnimating, setIsEmptyTrashAnimating] = useState(false)

  const [noteSearchQuery, setNoteSearchQuery] = useState('')

  const normalizedNoteSearchQuery =
    noteSearchQuery
      .trim()
      .toLowerCase()

  const isSearchingNotes =
    normalizedNoteSearchQuery.length > 0

  const noteSearchResults =
    useMemo(
      () => {
        if (!isSearchingNotes) {
          return []
        }

        return notes
          .flatMap((note) => {
            const result =
              getNoteSearchResult(
                note,
                normalizedNoteSearchQuery,
              )

            return result ? [result] : []
          })
          .sort((firstResult, secondResult) => {
            if (firstResult.rank !== secondResult.rank) {
              return firstResult.rank - secondResult.rank
            }

            return firstResult.title.localeCompare(
              secondResult.title,
            )
          })
      },
      [
        isSearchingNotes,
        normalizedNoteSearchQuery,
        notes,
      ],
    )

  useEffect(() => {
    return () => {
      if (emptyTrashSpinTimeoutRef.current !== null) {
        window.clearTimeout(
          emptyTrashSpinTimeoutRef.current,
        )
      }
    }
  }, [])

  function expandFolder(folderId: string) {
    setExpandedFolderIds((currentFolderIds) => {
      const nextFolderIds = new Set(currentFolderIds)

      nextFolderIds.add(folderId)

      getFolderAncestorIds(folders, folderId).forEach((ancestorId) => {
        nextFolderIds.add(ancestorId)
      })

      return nextFolderIds
    })
  }

  useImperativeHandle(
    ref,
    () => ({
      startEditingFolder(
        folderId: string,
        name: string,
        parentId: string | null,
      ) {
        const normalizedParentId =
          parentId ?? NOTES_INBOX_FOLDER_ID

        setExpandedFolderIds((currentFolderIds) => {
          const nextFolderIds = new Set(currentFolderIds)

          nextFolderIds.add(normalizedParentId)

          getFolderAncestorIds(folders, normalizedParentId).forEach((ancestorId) => {
            nextFolderIds.add(ancestorId)
          })

          return nextFolderIds
        })

        setEditingFolderId(folderId)
        setEditingFolderName(name)
      },
    }),
    [
      folders,
    ],
  )

  function toggleFolder(folderId: string) {
    setExpandedFolderIds((currentFolderIds) => {
      const nextFolderIds = new Set(currentFolderIds)

      if (nextFolderIds.has(folderId)) {
        nextFolderIds.delete(folderId)
      } else {
        nextFolderIds.add(folderId)
      }

      return nextFolderIds
    })
  }

  function startEditingFolder(folder: NoteFolder) {
    setEditingFolderId(folder.id)
    setEditingFolderName(folder.name)
  }

  function commitEditingFolder() {
    if (!editingFolderId) {
      return
    }

    const trimmedName = editingFolderName.trim()

    onRenameFolder(
      editingFolderId,
      trimmedName || 'Untitled folder',
    )

    setEditingFolderId(null)
    setEditingFolderName('')
  }

  function cancelEditingFolder() {
    setEditingFolderId(null)
    setEditingFolderName('')
  }

  function handleEditingFolderKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
      commitEditingFolder()
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      cancelEditingFolder()
    }
  }

  function beginDrag(
    event: DragEvent<HTMLElement>,
    item: DraggedTreeItem,
  ) {
    draggedItemRef.current = item
    setDraggedItem(item)

    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData(
      DRAG_MIME_TYPE,
      JSON.stringify(item),
    )
  }

  function endDrag() {
    draggedItemRef.current = null
    setDraggedItem(null)
    setDragOverFolderId(null)
  }

  function readDraggedItem(event: DragEvent<HTMLElement>) {
    if (draggedItemRef.current) {
      return draggedItemRef.current
    }

    const rawItem = event.dataTransfer.getData(DRAG_MIME_TYPE)

    if (!rawItem) {
      return null
    }

    try {
      const parsedItem = JSON.parse(rawItem) as DraggedTreeItem

      if (
        (
          parsedItem.type === 'note' ||
          parsedItem.type === 'folder'
        ) &&
        typeof parsedItem.id === 'string'
      ) {
        return parsedItem
      }
    } catch {
      return null
    }

    return null
  }

  function canDropOnFolder(
    targetFolderId: string,
    item: DraggedTreeItem | null = draggedItem,
  ) {
    if (!item) {
      return false
    }

    if (item.type === 'note') {
      return true
    }

    return canMoveFolder(
      folders,
      item.id,
      targetFolderId,
    )
  }

  function handleFolderDragOver(
    event: DragEvent<HTMLDivElement>,
    folderId: string,
  ) {
    const item = readDraggedItem(event)

    if (!canDropOnFolder(folderId, item)) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverFolderId(folderId)
  }

  function handleFolderDrop(
    event: DragEvent<HTMLDivElement>,
    folderId: string,
  ) {
    const item = readDraggedItem(event)

    endDrag()

    if (!canDropOnFolder(folderId, item) || !item) {
      return
    }

    event.preventDefault()
    expandFolder(folderId)
    onActiveFolderChange(folderId)

    if (item.type === 'note') {
      onMoveNote(
        item.id,
        folderId,
      )

      return
    }

    onMoveFolder(
      item.id,
      folderId,
    )
  }

  function handleFolderDragLeave(event: DragEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget

    if (
      nextTarget instanceof Node &&
      event.currentTarget.contains(nextTarget)
    ) {
      return
    }

    setDragOverFolderId(null)
  }

  function stopEditingInputClick(event: MouseEvent<HTMLInputElement>) {
    event.stopPropagation()
  }

  function stopRowActionMouseDown(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
  }

  function handleDeleteFolderClick(
    event: MouseEvent<HTMLButtonElement>,
    folderId: string,
  ) {
    event.stopPropagation()
    onDeleteFolder(folderId)
    expandFolder(NOTES_TRASH_FOLDER_ID)
  }

  function handleEmptyTrashClick(
    event: MouseEvent<HTMLButtonElement>,
    hasTrashContent: boolean,
  ) {
    event.stopPropagation()

    if (
      !hasTrashContent ||
      isEmptyTrashAnimating
    ) {
      return
    }

    if (emptyTrashSpinTimeoutRef.current !== null) {
      window.clearTimeout(
        emptyTrashSpinTimeoutRef.current,
      )
    }

    setIsEmptyTrashAnimating(true)

    emptyTrashSpinTimeoutRef.current =
      window.setTimeout(
        () => {
          emptyTrashSpinTimeoutRef.current = null
          setIsEmptyTrashAnimating(false)
        },
        700,
      )

    onEmptyTrash()
  }

  function renderFolderIcon(node: NoteTreeFolderNode, isExpanded: boolean) {
    if (node.kind === 'inbox') {
      return <Inbox size={15} />
    }

    if (node.kind === 'trash') {
      return <Trash2 size={15} />
    }

    if (node.kind === 'category') {
      return (
        <span
          className="
            h-2.5
            w-2.5
            shrink-0
            rounded-full
          "
          style={{
            backgroundColor: node.color ?? 'var(--theme-muted)',
          }}
        />
      )
    }

    return isExpanded ? <FolderOpen size={15} /> : <Folder size={15} />
  }

  function renderFolderNode(
    node: NoteTreeFolderNode,
    depth: number,
  ) {
    const isExpanded = expandedFolderIds.has(node.id)
    const hasChildren = node.childFolders.length > 0 || node.notes.length > 0
    const isActive = activeFolderId === node.id
    const isDropTarget = dragOverFolderId === node.id
    const canRename = node.kind === 'folder' && node.folder !== null
    const canDrag = canRename && editingFolderId !== node.id
    const canDeleteFolder =
      canRename &&
      !isFolderInTrash(
        folders,
        node.id,
      )
    const isTrashRoot = node.kind === 'trash'
    const hasTrashContent =
      tree.trash.childFolders.length > 0 ||
      tree.trash.notes.length > 0

    return (
      <div key={node.id}>
        <div
          draggable={canDrag}
          onDragStart={(event) => {
            if (!canDrag) {
              return
            }

            beginDrag(
              event,
              {
                type: 'folder',
                id: node.id,
              },
            )
          }}
          onDragEnd={endDrag}
          onDragOver={(event) => {
            handleFolderDragOver(
              event,
              node.id,
            )
          }}
          onDragLeave={handleFolderDragLeave}
          onDrop={(event) => {
            handleFolderDrop(
              event,
              node.id,
            )
          }}
          className={`
            flex
            items-center
            gap-1
            group/folder-row
            rounded-xl
            pr-1
            transition-colors

            ${
              isDropTarget
                ? 'bg-accent-soft text-accent'
                : isActive
                  ? 'bg-surface-hover text-foreground'
                  : 'text-foreground-secondary hover:bg-surface-hover/50'
            }
          `}
          style={{
            paddingLeft: `${depth * 24}px`,
          }}
        >
          <button
            type="button"
            disabled={!hasChildren}
            onClick={() => {
              toggleFolder(node.id)
            }}
            className="
              flex
              h-8
              w-6
              shrink-0
              cursor-pointer
              items-center
              justify-center
              text-muted
              transition-colors

              hover:text-foreground
              disabled:cursor-default
              disabled:opacity-30
            "
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>

          <button
            type="button"
            onClick={() => {
              onActiveFolderChange(node.id)

              if (hasChildren && !isExpanded) {
                expandFolder(node.id)
              }
            }}
            onDoubleClick={() => {
              if (canRename && node.folder) {
                startEditingFolder(node.folder)
              }
            }}
            className="
              flex
              min-w-0
              flex-1
              cursor-pointer
              items-center
              gap-2
              rounded-lg
              py-2
              text-left
            "
          >
            {renderFolderIcon(
              node,
              isExpanded,
            )}

            {editingFolderId === node.id ? (
              <input
                autoFocus
                value={editingFolderName}
                onChange={(event) => {
                  setEditingFolderName(event.target.value)
                }}
                onClick={stopEditingInputClick}
                onBlur={commitEditingFolder}
                onKeyDown={handleEditingFolderKeyDown}
                className="
                  min-w-0
                  flex-1
                  bg-transparent
                  text-sm
                  font-medium
                  text-foreground
                  outline-none
                "
              />
            ) : (
              <span className="truncate text-sm font-medium">{node.name}</span>
            )}
          </button>

          {canDeleteFolder && (
            <button
              type="button"
              draggable={false}
              onMouseDown={stopRowActionMouseDown}
              onClick={(event) => {
                handleDeleteFolderClick(
                  event,
                  node.id,
                )
              }}
              aria-label={`Move ${node.name} to trash`}
              title="Move folder to trash"
              className={rowActionButtonClass}
            >
              <Trash2 size={13} />
            </button>
          )}

          {isTrashRoot && (
            <button
              type="button"
              disabled={
                !hasTrashContent &&
                !isEmptyTrashAnimating
              }
              draggable={false}
              onMouseDown={stopRowActionMouseDown}
              onClick={(event) => {
                handleEmptyTrashClick(
                  event,
                  hasTrashContent,
                )
              }}
              aria-label="Empty trash"
              title="Empty trash"
              className={`
                ${trashActionButtonClass}
                ${
                  isEmptyTrashAnimating
                    ? 'bg-accent-soft text-accent'
                    : ''
                }
              `}
            >
              <RefreshCw
                size={13}
                className={`
                  transition-transform
                  duration-200
                  ${
                    isEmptyTrashAnimating
                      ? 'animate-spin'
                      : ''
                  }
                `}
              />
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="mt-0.5 space-y-0.5">
            {node.childFolders.map((childFolder) =>
              renderFolderNode(
                childFolder,
                depth + 1,
              ),
            )}

            {node.notes.map((note) =>
              renderNoteNode(
                note,
                depth + 1,
              ),
            )}
          </div>
        )}
      </div>
    )
  }

  function renderSearchBar() {
    return (
      <div
        className="
          shrink-0
          pr-6
          pt-6
        "
      >
        <div
          className="
            relative
            flex
            items-center
          "
        >
          <Search
            size={14}
            className="
              pointer-events-none
              absolute
              left-1
              text-muted
            "
          />

          <input
            type="text"
            role="searchbox"
            aria-label="Search documents"
            value={noteSearchQuery}
            onChange={(event) => {
              setNoteSearchQuery(event.target.value)
            }}
            placeholder="Search documents"
            className="
              h-9
              w-full
              rounded-xl
              bg-transparent
              pl-7
              pr-9
              text-sm
              text-foreground
              outline-none
              transition-[background-color,border-color,color]
              duration-200

              placeholder:text-muted
            "
          />

          {noteSearchQuery.length > 0 && (
            <button
              type="button"
              onMouseDown={(event) => {
                event.preventDefault()
              }}
              onClick={() => {
                setNoteSearchQuery('')
              }}
              aria-label="Clear note search"
              className="
                absolute
                right-2
                flex
                h-5
                w-5
                cursor-pointer
                items-center
                justify-center
                rounded-md
                text-muted
                transition-colors
                duration-200

                hover:bg-surface-hover
                hover:text-foreground
                focus-visible:bg-surface-hover
                focus-visible:text-foreground
                focus-visible:outline-none
              "
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>
    )
  }

  function renderSearchResults() {
    if (noteSearchResults.length === 0) {
      return (
        <div
          className="
            px-2
            py-6
            text-center
            text-xs
            text-muted
          "
        >
          No matching documents
        </div>
      )
    }

    return (
      <div className="space-y-5 mt-2">
        {noteSearchResults.map((result) => {
          const isSelected =
            selectedNoteId === result.note.id

          return (
            <button
              key={result.note.id}
              type="button"
              onClick={() => {
                onSelectNote(result.note.id)
              }}
              className={`
                flex
                w-full
                cursor-pointer
                items-center
                gap-2
                rounded-xl
                px-2
                py-2
                text-left
                transition-colors

                ${
                  isSelected
                    ? 'bg-surface-hover text-foreground'
                    : 'text-foreground-secondary hover:bg-surface-hover/50'
                }
              `}
            >
              <FileText
                size={16}
                className="
                  mt-0.5
                  shrink-0
                "
              />

              <span
                className="
                  min-w-0
                  flex-1
                "
              >
                <span
                  className="
                    block
                    truncate
                    text-sm
                    font-medium
                  "
                >
                  {result.title}
                </span>

                {result.note.createdAt && (
                  <span
                    className="
                      mt-0.5
                      block
                      truncate
                      text-xs
                      text-muted
                    "
                  >
                    {dateTimeFormatter.format(Date.parse(result.note.createdAt))}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  function renderNoteNode(note: Note, depth: number) {
    const isSelected = selectedNoteId === note.id

    return (
      <div
        key={note.id}
        draggable
        onDragStart={(event) => {
          beginDrag(
            event,
            {
              type: 'note',
              id: note.id,
            },
          )
        }}
        onDragEnd={endDrag}
        style={{
          paddingLeft: `${depth * 24 + 24}px`,
        }}
      >
        <button
          type="button"
          onClick={() => {
            onSelectNote(note.id)
          }}
          className={`
            flex
            w-full
            cursor-pointer
            items-center
            gap-2
            rounded-xl
            px-2
            py-1.5
            text-left
            text-sm
            transition-colors

            ${
              isSelected
                ? 'bg-surface-hover text-foreground'
                : 'text-foreground-secondary hover:bg-surface-hover/50'
            }
          `}
        >
          <FileText
            size={14}
            className="shrink-0"
          />

          <span className="truncate">{note.title || 'Untitled'}</span>
        </button>
      </div>
    )
  }

  return (
    <div
      className="
        flex
        h-full
        min-h-0
        flex-col
        pb-6
        border-r
        border-border
        rounded-4xl
      "
    >
      {renderSearchBar()}
      <div
        className="
        h-[2px]
        bg-surface-hover
        mx-5
        "
      />

      <div
        className="
          min-h-0
          flex-1
          space-y-1
          overflow-y-auto
          pr-6
          scrollbar-none
          py-4
        "
      >
        {isSearchingNotes
          ? renderSearchResults()
          : tree.roots.map((root) =>
              renderFolderNode(
                root,
                0,
              ),
            )}
      </div>

      {!isSearchingNotes && (
        <div
          className="
            shrink-0
            pr-2
          "
        >
          {renderFolderNode(
            tree.trash,
            0,
          )}
        </div>
      )}
    </div>
  )
})

export default NotesTreeSidebar
