import LiveDateTime from '../components/dashboard/LiveDateTime.tsx'
import { Notebook, PlusIcon, Trash2, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import type { Note } from '../types/Note.ts'
import { useState } from 'react'
import Button from '../components/ui/Button.tsx'
import DashBlockEditor from "../components/editor/DashBlockEditor.tsx";

type NotesProps = {
    notes: Note[]
    onAddNote: () => string

    onUpdateNote: (
        id: string,
        changes: Partial<
            Pick<
                Note,
                'title' | 'document' | 'categoryId'
            >
        >
    ) => void

    onDeleteNote: (
        id: string
    ) => void
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
                                text-3xl
                                font-bold
                                text-foreground
                                outline-none
                              "
                          />

                          <Button
                              onClick={() => {
                                  onDeleteNote(selectedNote.id)
                                  setSelectedNoteId(null)
                              }}
                              Icon={Trash2}
                              className={`
                              bg-app-surface 
                              border-border 
                              text-muted 
                              hover:bg-accent-danger-soft
                              hover:border-danger
                              hover:text-danger
                            `}
                          />
                      </div>

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
                      </div>
                  </div>
              ) : (
                  <div className="flex h-full items-center justify-center text-muted">
                      .  .  .
                  </div>
              )}
          </section>
        </div>
      </section>
    </main>
  )
}

export default Notes