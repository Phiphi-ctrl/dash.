import LiveDateTime from '../components/dashboard/LiveDateTime.tsx'
import {
  Maximize2,
  Minimize2,
  Notebook,
  PlusIcon,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import type { Note, NoteFolder } from '../types/Note.ts'
import { useState } from 'react'
import Button from '../components/ui/Button.tsx'
import 'katex/dist/katex.min.css'
import BlockNoteEditor from '../components/notes/BlockNoteEditor.tsx'
import {dateTimeFormatter} from "../utils/Datetime.ts";

type NotesProps = {
    notes: Note[],
    noteFolders: NoteFolder[],

    onAddNote: () => string,
    onUpdateNote: (
        id: string,
        changes: Partial<Pick<Note, 'title' | 'content' | 'folderId'>>
    ) => void,
    onDeleteNote: (id: string) => void,
}

function Notes({notes, onAddNote, onUpdateNote, onDeleteNote}: NotesProps) {

  const [selectedNoteId, setSelectedNoteId] =
    useState<string | null>(null)

  const selectedNote =
    notes.find(
      (note) => note.id === selectedNoteId
    ) ?? null

  const [isNotesSidebarOpen, setIsNotesSidebarOpen] =
    useState(true)

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
          py-4

          bg-canvas/90
          backdrop-blur-xs
          h-12
        "
      >
        <div className="flex-col ml-13">
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
              bg-transparent
              text-xl
              font-bold
              text-foreground
              outline-none
            "
          />
          <span className="flex text-xs text-muted">
            {dateTimeFormatter.format(new Date(selectedNote.createdAt))}
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
      <BlockNoteEditor
        key={selectedNote.id}
        content={selectedNote.content}
        onChange={(content) => {
          onUpdateNote(selectedNote.id, {
            content,
          })
        }}
      />
    )
  }



  return (
    <main className="flex flex-1 flex-col px-10 gap-2">
      <header className="flex gap-1 items-center justify-between">
        <LiveDateTime />
        <div className="flex gap-1 text-foreground-secondary">
          <Notebook />
          <span>notes.</span>
        </div>
      </header>
      <section className="flex flex-col gap-1 h-168">
        <div className="flex justify-between mb-2">
          <div className="flex justify-center items-center gap-3 text-foreground">
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
            <h3 className="text-xl font-semibold">Active Notes.</h3>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                const id = onAddNote()
                setIsNoteFullscreen(false)
                setSelectedNoteId(id)
              }}
              Icon={PlusIcon}
              className={`
              bg-app-surface 
              border-border 
              text-muted 
              hover:bg-accent-soft
              hover:border-accent
              hover:text-accent
            `}
            />
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
            {notes.map((note) => (
              <div className="flex gap-2" key={note.id}>
                <button
                  type="button"
                  onClick={() => {
                    setIsNoteFullscreen(false)
                    setSelectedNoteId(note.id)
                  }}
                  className={`
                flex
                w-full
                cursor-pointer
                rounded-xl
                px-3
                py-2
                text-left
                transition-colors
          
                ${
                    selectedNoteId === note.id
                      ? 'bg-surface-hover text-foreground'
                      : 'text-foreground-secondary hover:bg-surface-hover/50'
                  }
              `}
                >
                  <span className="truncate">{note.title || 'Untitled'}</span>
                </button>
              </div>
            ))}
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
                    className="
                      h-full
                      overflow-y-auto
                      scrollbar-none
                      pt-20
                      pb-10
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
              className="
                h-full
                overflow-y-auto
                scrollbar-none
                pt-20
                pb-10
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
