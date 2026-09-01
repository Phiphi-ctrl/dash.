import {
  FilePlus,
  FolderPlus,
  Maximize2,
  Minimize2,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import type { Note } from '../types/Note.ts'
import { useRef, useState } from 'react'
import Button from '../components/ui/Button.tsx'
import DashBlockEditor from "../components/editor/DashBlockEditor.tsx";
import {dateTimeFormatter} from "../utils/Datetime.ts";
import type { Category } from '../types/Category.ts'
import type { NoteFolder } from '../types/NoteFolder.ts'
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

  const noteActionButtonClass = `
    bg-app-surface
    border-border
    text-muted
    hover:bg-accent-soft
    hover:border-accent
    hover:text-accent
  `

  const createControlButtonClass = `
    flex
    h-10
    w-10
    shrink-0
    cursor-pointer
    items-center
    justify-center
    rounded-4xl
    border
    border-border
    bg-app-surface
    text-muted
    transition-colors
    duration-400

    hover:border-accent
    hover:bg-accent-soft
    hover:text-accent
    disabled:cursor-default
    disabled:opacity-40
    disabled:hover:border-border
    disabled:hover:bg-app-surface
    disabled:hover:text-muted
  `

  const deleteNoteButtonClass = `
    bg-app-surface
    border-border
    text-muted
    hover:bg-accent-danger-soft
    hover:border-danger
    hover:text-danger
  `

  function handleDeleteSelectedNote() {
    if (selectedNote === null) {
      return
    }

    onDeleteNote(selectedNote.id)
    setSelectedNoteId(null)
    setIsNoteFullscreen(false)
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
    setSelectedNoteId(noteId)
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
  }

  function handleEmptyTrash() {
    const shouldClearSelectedNote =
      selectedNote !== null &&
      (
        selectedNote.deletedAt !== null ||
        getNoteFolderId(selectedNote) === NOTES_TRASH_FOLDER_ID ||
        isFolderInTrash(
          noteFolders,
          selectedNote.folderId,
        )
      )
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

  function renderSelectedNoteHeader(isFullscreen: boolean) {
    if (selectedNote === null) {
      return null
    }

    return (
      <div
        className="
          absolute
          inset-x-0
          top-0
          z-20

          flex
          items-center
          justify-between

          pl-4
          py-4

          bg-canvas/90
          backdrop-blur-xs
        "
      >
        <div className="flex flex-col">
          <input
            type="text"
            value={selectedNote.title}
            onChange={(event) => {
              onUpdateNote(selectedNote.id, {
                title: event.target.value,
              })
            }}
            className="
              w-full

              pl-15

              bg-transparent
              text-2xl
              font-bold
              text-foreground
              outline-none
            "
          />
          <span className="text-muted text-xs pl-15">
            {dateTimeFormatter.format(Date.parse(selectedNote.createdAt))}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => setIsNoteFullscreen((current) => !current)}
            Icon={isFullscreen ? Minimize2 : Maximize2}
            className={noteActionButtonClass}
          />
          <Button
            onClick={handleDeleteSelectedNote}
            Icon={Trash2}
            className={deleteNoteButtonClass}
          />
        </div>
      </div>
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

  return (
    <main className="flex flex-1 flex-col px-10 gap-2">
      <header
        className="
          flex
          min-h-8
          min-w-0
          items-center
          text-xs
          text-muted
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
      <section className="flex flex-col gap-1 h-168">
        <div className="flex items-center mb-2">
          <div className="flex min-w-0 items-center gap-3 text-foreground">
            <div className="flex shrink-0 items-center">
              <Button
                onClick={() => {
                  setIsNotesSidebarOpen(
                    (current) => !current
                  )
                }}
                Icon={
                  isNotesSidebarOpen
                    ? PanelLeftClose
                    : PanelLeftOpen
                }
                className={`
                  bg-app-surface
                  border-border
                  text-muted
                  hover:bg-accent-soft
                  hover:border-accent
                  hover:text-accent
                `}
              />

              <div
                aria-hidden={!isNotesSidebarOpen}
                className={`
                  flex
                  origin-left
                  items-center
                  gap-2
                  overflow-hidden
                  transition-[width,margin-left,opacity,transform,filter]
                  duration-300
                  ease-out

                  ${
                    isNotesSidebarOpen
                      ? 'ml-2 w-[5.5rem] translate-x-0 scale-100 opacity-100 blur-0'
                      : 'ml-0 w-0 -translate-x-7 scale-75 opacity-0 blur-[1px]'
                  }
                `}
              >
                <button
                  type="button"
                  disabled={!canCreateInActiveFolder || !isNotesSidebarOpen}
                  tabIndex={isNotesSidebarOpen ? 0 : -1}
                  onClick={handleAddFolderToActiveFolder}
                  aria-label="New folder"
                  title="New folder"
                  className={createControlButtonClass}
                >
                  <FolderPlus className="size-4" />
                </button>

                <button
                  type="button"
                  disabled={!canCreateInActiveFolder || !isNotesSidebarOpen}
                  tabIndex={isNotesSidebarOpen ? 0 : -1}
                  onClick={handleAddNoteToActiveFolder}
                  aria-label="New file"
                  title="New file"
                  className={createControlButtonClass}
                >
                  <FilePlus className="size-4" />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-semibold">Notes.</h3>
          </div>
        </div>
        <div className="flex min-h-0 flex-1">
          <aside
            className={`
              shrink-0
              overflow-hidden
              transition-[width,opacity,padding]
              duration-300
              ${
                isNotesSidebarOpen
                  ? 'w-64 border-r border-border pr-10 opacity-100'
                  : 'w-0 pr-0 opacity-0'
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
              ${isNotesSidebarOpen ? 'pl-10' : 'pl-0'}
            `}
          >
              {selectedNote !== null ? (
                  <div className="relative h-full overflow-hidden">
                      {renderSelectedNoteHeader(false)}
                      {!isSelectedNoteFullscreen && (
                        <div
                            data-note-scroll-viewport
                            className="
                              h-full
                              overflow-y-auto
                              scrollbar-none
                              pl-4
                              pr-8
                              pt-20
                            "
                        >
                            {renderSelectedNoteEditor()}
                        </div>
                      )}
                  </div>
              ) : (
                  <div className="flex h-full items-center justify-center text-muted">
                      .  .  .
                  </div>
              )}
          </section>
        </div>
      </section>
      {selectedNote !== null && isSelectedNoteFullscreen && (
        <div className="fixed inset-0 z-50 bg-canvas px-10">
          <div className="relative h-full overflow-hidden">
            {renderSelectedNoteHeader(true)}
            <div
              data-note-scroll-viewport
              className="
                h-full
                overflow-y-auto
                scrollbar-none
                pl-4
                pr-8
                pt-20
              "
            >
              {renderSelectedNoteEditor()}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default Notes
