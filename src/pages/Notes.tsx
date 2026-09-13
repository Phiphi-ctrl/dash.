import {
    Ellipsis,
    FilePlus,
    FolderPlus,
    Maximize2,
    Minimize2,
    Trash2,
    PanelLeftClose,
    PanelLeftOpen, UserRound, Dot, PenLine,
} from 'lucide-react'
import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react'
import type { Note } from '../types/Note.ts'
import { useEffect, useRef, useState } from 'react'
import Button from '../components/ui/Button.tsx'
import Tooltip from '../components/ui/Tooltip.tsx'
import DashBlockEditor from "../components/editor/DashBlockEditor.tsx";
import {dateTimeFormatter} from "../utils/Datetime.ts";
import type { Category } from '../types/Category.ts'
import type { NoteFolder } from '../types/NoteFolder.ts'
import { useResponsive } from '../context/ResponsiveContext.ts'
import NotesTreeSidebar, { type NotesTreeSidebarHandle }
  from '../components/notes/NotesTreeSidebar.tsx'
import {
  getCategoryIdFromFolderId,
  getCategoryFolderId,
  isFolderInTrash,
  isKnownFolderId,
  isSystemFolderId,
  NOTES_INBOX_FOLDER_ID,
  NOTES_TRASH_FOLDER_ID,
} from '../utils/noteTree.ts'

type NotesProps = {
    notes: Note[]
    categories: Category[]
    noteFolders: NoteFolder[]
    onAddNote: (folderId: string) => string
    onAddFolder: (parentId: string) => string | null
    onRenameFolder: (folderId: string, name: string) => void
    onDeleteFolder: (folderId: string) => void
    onEmptyTrash: () => void
    onMoveNote: (noteId: string, targetFolderId: string) => void
    onMoveFolder: (folderId: string, targetFolderId: string) => void

    onUpdateNote: (
        id: string,
        changes: Partial<
            Pick<
                Note,
                'title' | 'document' | 'categoryId' | 'folderId' | 'deletedAt'
            >
        >
    ) => void

    onDeleteNote: (
        id: string
    ) => void
}

function Notes({
  notes,
  categories,
  noteFolders,
  onAddNote,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  onEmptyTrash,
  onMoveNote,
  onMoveFolder,
  onUpdateNote,
  onDeleteNote,
}: NotesProps) {
  const { isMobile } = useResponsive()

  const [selectedNoteId, setSelectedNoteId] =
    useState<string | null>(null)

  const selectedNote =
    notes.find(
      (note) => note.id === selectedNoteId
    ) ?? null

  const [isNotesSidebarOpen, setIsNotesSidebarOpen] =
    useState(true)

  const [activeFolderId, setActiveFolderId] =
    useState(NOTES_INBOX_FOLDER_ID)

  const notesTreeSidebarRef =
    useRef<NotesTreeSidebarHandle | null>(null)

  const selectedNoteTitleInputRef =
    useRef<HTMLInputElement | null>(null)

  const noteScrollViewportRef =
    useRef<HTMLDivElement | null>(null)

  const [
    noteActionsButtonElement,
    setNoteActionsButtonElement,
  ] =
    useState<HTMLButtonElement | null>(null)

  const [
    noteActionsMenuElement,
    setNoteActionsMenuElement,
  ] =
    useState<HTMLDivElement | null>(null)

  const [isNoteActionsMenuOpen, setIsNoteActionsMenuOpen] =
    useState(false)

  const isVisibleNoteActionsMenu =
    selectedNote !== null &&
    isNoteActionsMenuOpen

  const resolvedActiveFolderId =
    isKnownFolderId(
      categories,
      noteFolders,
      activeFolderId,
    )
      ? activeFolderId
      : NOTES_INBOX_FOLDER_ID

  const canCreateInActiveFolder =
    !isFolderInTrash(
      noteFolders,
      resolvedActiveFolderId,
    )

  const [isNoteFullscreen, setIsNoteFullscreen] =
    useState(false)

  const isSelectedNoteFullscreen =
    selectedNote !== null && isNoteFullscreen

  const toolbarButtonClass = `
    !p-3
    !rounded-4xl
    !border-transparent
    bg-transparent
    text-muted
    hover:text-foreground
    hover:scale-110
    transition-all
    duration-300
    disabled:cursor-default
    disabled:opacity-35
    disabled:hover:!border-transparent
    disabled:hover:bg-transparent
    disabled:hover:text-muted
  `



  const {
    floatingStyles:
      noteActionsFloatingStyles,
    isPositioned:
      isNoteActionsMenuPositioned,
    update:
      updateNoteActionsMenuPosition,
  } =
    useFloating({
      open:
        isVisibleNoteActionsMenu,

      onOpenChange:
        setIsNoteActionsMenuOpen,

      elements: {
        reference:
          noteActionsButtonElement,

        floating:
          noteActionsMenuElement,
      },

      placement:
        'bottom',

      strategy:
        'fixed',

      whileElementsMounted:
        autoUpdate,

      middleware: [
        offset(8),

        flip({
          padding: 12,
        }),

        shift({
          padding: 12,
        }),
      ],
    })

  useEffect(() => {
    if (!isVisibleNoteActionsMenu) {
      return
    }

    const animationFrameId =
      window.requestAnimationFrame(
        () => {
          void updateNoteActionsMenuPosition()
        },
      )

    return () => {
      window.cancelAnimationFrame(
        animationFrameId,
      )
    }
  }, [
    isVisibleNoteActionsMenu,
    noteActionsButtonElement,
    noteActionsMenuElement,
    updateNoteActionsMenuPosition,
  ])

  useEffect(() => {
    if (!isVisibleNoteActionsMenu) {
      return
    }

    function handleDocumentPointerDown(event: PointerEvent) {
      const target = event.target

      if (!(target instanceof Node)) {
        return
      }

      const clickedActionsTrigger =
        target instanceof Element &&
        target.closest(
          '[data-notes-actions-trigger]',
        )

      if (
        clickedActionsTrigger ||
        noteActionsButtonElement?.contains(target) ||
        noteActionsMenuElement?.contains(target)
      ) {
        return
      }

      setIsNoteActionsMenuOpen(false)
    }

    function handleDocumentKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsNoteActionsMenuOpen(false)
      }
    }

    document.addEventListener(
      'pointerdown',
      handleDocumentPointerDown,
    )

    document.addEventListener(
      'keydown',
      handleDocumentKeyDown,
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        handleDocumentPointerDown,
      )

      document.removeEventListener(
        'keydown',
        handleDocumentKeyDown,
      )
    }
  }, [
    isVisibleNoteActionsMenu,
    noteActionsButtonElement,
    noteActionsMenuElement,
  ])

  function handleDeleteSelectedNote() {
    if (selectedNote === null) {
      return
    }

    onDeleteNote(selectedNote.id)
    setSelectedNoteId(null)
    setIsNoteFullscreen(false)
    setIsNoteActionsMenuOpen(false)
  }

  function getNoteFolderId(note: Note) {
    if (
      note.folderId &&
      isKnownFolderId(
        categories,
        noteFolders,
        note.folderId,
      )
    ) {
      return note.folderId
    }

    if (note.categoryId) {
      return getCategoryFolderId(note.categoryId)
    }

    return NOTES_INBOX_FOLDER_ID
  }

  function isNoteInTrash(note: Note) {
    return (
      note.deletedAt !== null ||
      getNoteFolderId(note) === NOTES_TRASH_FOLDER_ID ||
      isFolderInTrash(
        noteFolders,
        note.folderId,
      )
    )
  }

  function handleSelectNote(noteId: string) {
    const nextSelectedNote =
      notes.find(
        (note) => note.id === noteId,
      ) ?? null

    if (nextSelectedNote) {
      setActiveFolderId(
        getNoteFolderId(nextSelectedNote),
      )
    }

    setIsNoteFullscreen(false)
    setIsNoteActionsMenuOpen(false)
    setSelectedNoteId(noteId)
    if (isMobile) setIsNotesSidebarOpen(false)
  }

  function handleAddFolderToActiveFolder() {
    if (!canCreateInActiveFolder) {
      return
    }

    const folderId =
      onAddFolder(
        resolvedActiveFolderId,
      )

    if (!folderId) {
      return
    }

    setIsNoteFullscreen(false)
    setActiveFolderId(folderId)
    notesTreeSidebarRef.current?.startEditingFolder(
      folderId,
      'New folder',
      resolvedActiveFolderId,
    )
  }

  function handleAddNoteToActiveFolder() {
    if (!canCreateInActiveFolder) {
      return
    }

    const id =
      onAddNote(
        resolvedActiveFolderId,
      )

    setIsNoteFullscreen(false)
    setSelectedNoteId(id)
    setIsNoteActionsMenuOpen(false)
    if (isMobile) setIsNotesSidebarOpen(false)
  }

  function handleToggleSelectedNoteFullscreen() {
    if (selectedNote === null) {
      return
    }

    setIsNoteActionsMenuOpen(false)
    setIsNoteFullscreen((current) => !current)
  }

  function handleToggleNoteActionsMenu(
    triggerElement: HTMLButtonElement,
  ) {
    if (selectedNote === null) {
      return
    }

    setNoteActionsButtonElement(
      triggerElement,
    )

    setIsNoteActionsMenuOpen((current) => !current)
  }

  function handleRenameSelectedNote() {
    selectedNoteTitleInputRef.current?.focus()
    selectedNoteTitleInputRef.current?.select()
    setIsNoteActionsMenuOpen(false)
  }

  function handleEmptyTrash() {
    const shouldClearSelectedNote =
      selectedNote !== null &&
      isNoteInTrash(selectedNote)
    const shouldResetActiveFolder =
      resolvedActiveFolderId === NOTES_TRASH_FOLDER_ID ||
      isFolderInTrash(
        noteFolders,
        resolvedActiveFolderId,
      )

    onEmptyTrash()

    if (shouldResetActiveFolder) {
      setActiveFolderId(NOTES_INBOX_FOLDER_ID)
    }

    if (shouldClearSelectedNote) {
      setSelectedNoteId(null)
      setIsNoteFullscreen(false)
    }
  }

  function getVirtualFolderName(folderId: string | null) {
    if (folderId === NOTES_TRASH_FOLDER_ID) {
      return 'Trash'
    }

    const categoryId =
      getCategoryIdFromFolderId(folderId)

    if (categoryId) {
      return (
        categories.find((category) => category.id === categoryId)?.name ??
        'Category'
      )
    }

    return 'Inbox'
  }

  function getFolderPathSegments(folderId: string | null) {
    const normalizedFolderId =
      folderId &&
      isKnownFolderId(
        categories,
        noteFolders,
        folderId,
      )
        ? folderId
        : NOTES_INBOX_FOLDER_ID
    const storedFolderSegments: string[] = []
    const visitedFolderIds = new Set<string>()
    let currentFolderId: string | null = normalizedFolderId

    while (
      currentFolderId &&
      !isSystemFolderId(currentFolderId)
    ) {
      if (visitedFolderIds.has(currentFolderId)) {
        break
      }

      visitedFolderIds.add(currentFolderId)

      const folder =
        noteFolders.find((item) => item.id === currentFolderId) ?? null

      if (!folder) {
        break
      }

      storedFolderSegments.unshift(folder.name)
      currentFolderId =
        folder.parentId ?? NOTES_INBOX_FOLDER_ID
    }

    return [
      getVirtualFolderName(currentFolderId),
      ...storedFolderSegments,
    ]
  }

  const pathSegments =
    selectedNote === null
      ? getFolderPathSegments(resolvedActiveFolderId)
      : [
        ...getFolderPathSegments(
          getNoteFolderId(selectedNote),
        ),
        selectedNote.title || 'Untitled',
      ]

  function renderBreadcrumb() {
    return (
      <header
        className="
          flex
          min-h-6
          min-w-0
          items-center
          text-sm
          text-muted
          pt-2
        "
      >
        <nav
          className="
            flex
            min-w-0
            items-center
            gap-1.5
            overflow-hidden
          "
          aria-label="Current note path"
        >
          {pathSegments.map((segment, index) => {
            const isLastSegment =
              index === pathSegments.length - 1

            return (
              <span
                key={`${segment}-${index}`}
                className="
                  flex
                  min-w-0
                  items-center
                  gap-1.5
                "
              >
                {index > 0 && (
                  <span className="shrink-0 text-border">/</span>
                )}

                <span
                  className={`
                    truncate
                    ${
                      isLastSegment
                        ? 'max-w-80 text-foreground-secondary'
                        : 'max-w-36'
                    }
                  `}
                >
                  {segment}
                </span>
              </span>
            )
          })}
        </nav>

      </header>
    )
  }

  function renderNoteActionsMenu() {
    if (
        selectedNote === null ||
        !isVisibleNoteActionsMenu
    ) {
      return null
    }

    return (
        <FloatingPortal>

          <div
              ref={setNoteActionsMenuElement}

              style={{
                ...noteActionsFloatingStyles,

                visibility:
                    isNoteActionsMenuPositioned
                        ? 'visible'
                        : 'hidden',
              }}

              data-notes-actions-menu

              className="
                z-120
                w-48
                overflow-hidden
                p-2
                glass-surface
              "
          >
            <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
                onClick={handleRenameSelectedNote}
                className="
                  flex
                  w-full
                  cursor-pointer
                  items-center
                  gap-2
                  rounded-4xl
                  px-2.5
                  py-2
                  text-left
                  text-xs
                  text-foreground-secondary
                  transition-colors
                  ease-in
                  duration-300

                  hover:bg-surface-hover
                  hover:text-foreground
                "
            >
              <PenLine size={14} />
              Rename
            </button>

            <button
                type="button"
                onMouseDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}
                onClick={handleDeleteSelectedNote}
                className="
                  flex
                  w-full
                  cursor-pointer
                  items-center
                  gap-2
                  rounded-4xl
                  px-2.5
                  py-2
                  text-left
                  text-xs
                  text-danger
                  transition-colors
                  ease-in
                  duration-300

                  hover:bg-danger-soft
                "
            >
              <Trash2 size={14} />
              <span>
              {isNoteInTrash(selectedNote)
                  ? 'Delete permanently'
                  : 'Move to trash'}
            </span>
            </button>
          </div>

        </FloatingPortal>
    )
  }

  function renderNotesToolbar(showActionsMenu = true) {
    const hasSelectedNote =
      selectedNote !== null

    return (
      <div
        className="
          flex
          min-h-10
          shrink-0
          items-center
          justify-between
          gap-2
          py-3
        "
      >
        <div
          className="
            flex
            min-w-0
            items-center
            gap-2
            text-foreground
          "
        >
          <div className="glass-surface">
            <Tooltip
              content={
                isNotesSidebarOpen
                  ? 'Collapse notes sidebar'
                  : 'Expand notes sidebar'
              }
              placement="bottom"
            >
              <Button
                onClick={() => {
                  setIsNotesSidebarOpen(
                    (current) => !current,
                  )
                }}
                Icon={
                  isNotesSidebarOpen
                    ? PanelLeftClose
                    : PanelLeftOpen
                }
                aria-label={
                  isNotesSidebarOpen
                    ? 'Collapse notes sidebar'
                    : 'Expand notes sidebar'
                }
                className={toolbarButtonClass}
              />
            </Tooltip>
          </div>

          <div className="flex glass-surface">
            <div
              aria-hidden={!isNotesSidebarOpen}
              className={`
              flex
              shrink-0
              overflow-hidden
              transition-[width,opacity,transform]
              duration-300
              ease-out

              ${
                isNotesSidebarOpen
                  ? 'w-9 translate-x-0 opacity-100'
                  : 'pointer-events-none w-0 -translate-x-2 opacity-0'
              }
            `}
            >
              <Tooltip
                active={isNotesSidebarOpen}
                content="Create folder"
                placement="bottom"
              >
                <Button
                  disabled={!canCreateInActiveFolder || !isNotesSidebarOpen}
                  tabIndex={isNotesSidebarOpen ? 0 : -1}
                  onClick={handleAddFolderToActiveFolder}
                  Icon={FolderPlus}
                  aria-label="New folder"
                  className={toolbarButtonClass}
                />
              </Tooltip>
            </div>

            <Tooltip
              content="Create note"
              placement="bottom"
            >
              <Button
                disabled={!canCreateInActiveFolder}
                onClick={handleAddNoteToActiveFolder}
                Icon={FilePlus}
                aria-label="New note"
                className={toolbarButtonClass}
              />
            </Tooltip>
          </div>
        </div>

        <div className="flex glass-surface shrink-0 items-center gap-1">
          <Tooltip
            content={
              isSelectedNoteFullscreen
                ? 'Exit fullscreen'
                : 'Open note fullscreen'
            }
            placement="bottom"
          >
            <Button
              disabled={!hasSelectedNote}
              onClick={handleToggleSelectedNoteFullscreen}
              Icon={isSelectedNoteFullscreen ? Minimize2 : Maximize2}
              aria-label={
                isSelectedNoteFullscreen
                  ? 'Exit fullscreen'
                  : 'Open note fullscreen'
              }
              className={toolbarButtonClass}
            />
          </Tooltip>

          <Tooltip
            active={!isVisibleNoteActionsMenu}
            content="Note actions"
            placement="bottom"
          >
            <Button
              ref={
                showActionsMenu
                  ? setNoteActionsButtonElement
                  : undefined
              }
              data-notes-actions-trigger="true"
              disabled={!hasSelectedNote}
              onPointerDown={(event) => {
                setNoteActionsButtonElement(
                  event.currentTarget,
                )
              }}
              onClick={(event) => {
                handleToggleNoteActionsMenu(
                  event.currentTarget,
                )
              }}
              Icon={Ellipsis}
              aria-label="Note actions"
              aria-expanded={
                isVisibleNoteActionsMenu
                  ? true
                  : undefined
              }
              className={`
                ${toolbarButtonClass}
                ${
                  isVisibleNoteActionsMenu
                    ? '!border-transparent bg-surface-hover text-foreground'
                    : ''
                }
              `}
            />
          </Tooltip>
        </div>

        {showActionsMenu && renderNoteActionsMenu()}
      </div>
    )
  }

  function renderSelectedNoteHeader() {
    if (selectedNote === null) {
      return null
    }

    return (
      <header
        className="
          shrink-0
          py-3
          pl-9
        "
      >
        <div className="flex min-w-0 flex-col">
          <input
            ref={selectedNoteTitleInputRef}
            type="text"
            value={selectedNote.title}
            onChange={(event) => {
              onUpdateNote(selectedNote.id, {
                title: event.target.value,
              })
            }}
            className="
              w-full

              pl-4

              bg-transparent
              text-3xl lg:text-6xl
              font-bold
              text-foreground
              outline-none
            "
          />
          <div className="flex flex-wrap lg:flex-nowrap pl-4 text-muted text-xs items-center">
              <span className="flex">
                  {dateTimeFormatter.format(Date.parse(selectedNote.createdAt))}
              </span>
              <Dot />
              <div className="flex items-center gap-2">
                  <UserRound size={14}/>
                  <span>Philipp Saboi</span>
              </div>

          </div>
        </div>
      </header>
    )
  }

  function renderSelectedNoteEditor() {
    if (selectedNote === null) {
      return null
    }

    return (
      <DashBlockEditor
        key={selectedNote.id}
        value={selectedNote.document}
        onChange={(document) => {
          onUpdateNote(
            selectedNote.id,
            {
              document,
            },
          )
        }}
      />
    )
  }

  function renderSelectedNoteWorkspace() {
    if (selectedNote === null) {
      return null
    }

    return (
      <div
        className="
          flex
          h-full
          min-h-0
          min-w-0
          flex-col
          overflow-hidden
        "
      >
        <div
          ref={noteScrollViewportRef}
          data-note-scroll-viewport
          className="
            min-h-0
            min-w-0
            flex-1
            overflow-y-auto
            scrollbar-none
            pr-9 lg:px-8
          "
        >
          {renderSelectedNoteHeader()}

          {renderSelectedNoteEditor()}
        </div>
      </div>
    )
  }

  return (
    <main className="flex min-w-0 flex-1 flex-col px-2 lg:px-10">
      {renderBreadcrumb()}

      <section className="flex flex-1 min-h-0 flex-col">
        {renderNotesToolbar(!isSelectedNoteFullscreen)}

        <div className="flex min-h-0 flex-1">
          <aside
            className={`
              shrink-0
              overflow-hidden
              transition-[width,opacity,padding]
              duration-300
              ${
                isNotesSidebarOpen
                  ? 'w-full lg:w-64 pr-0 opacity-100'
                  : 'pointer-events-none w-0 pr-0 opacity-0'
              }
            `}
          >
            <NotesTreeSidebar
              ref={notesTreeSidebarRef}
              categories={categories}
              folders={noteFolders}
              notes={notes}
              activeFolderId={resolvedActiveFolderId}
              selectedNoteId={selectedNoteId}
              onActiveFolderChange={setActiveFolderId}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onEmptyTrash={handleEmptyTrash}
              onMoveNote={onMoveNote}
              onMoveFolder={onMoveFolder}
              onSelectNote={handleSelectNote}
            />
          </aside>
          <section
            className={`
              min-w-0
              flex-1
              transition-all
              duration-200
              ${isNotesSidebarOpen ? 'hidden lg:block' : 'block'}
            `}
          >
            {selectedNote !== null && !isSelectedNoteFullscreen ? (
              renderSelectedNoteWorkspace()
            ) : (
              <div className="flex h-full items-center justify-center text-muted">
                .  .  .
              </div>
            )}
          </section>
        </div>
      </section>

      {selectedNote !== null && isSelectedNoteFullscreen && (
        <div className="fixed inset-0 z-50 bg-canvas px-2 lg:px-10">
          <div className="flex h-full min-h-0 flex-col">
            {renderBreadcrumb()}
            {renderNotesToolbar()}

            <section className="min-h-0 flex-1">
              {renderSelectedNoteWorkspace()}
            </section>
          </div>
        </div>
      )}
    </main>
  )
}

export default Notes
