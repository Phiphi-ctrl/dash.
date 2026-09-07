import Dashboard from './pages/Dashboard'
import Sidebar from './components/layout/Sidebar.tsx'
import Categories from './pages/Categories.tsx'
import Stats from './pages/Stats.tsx'
import Notes from './pages/Notes.tsx'
import { Routes, Route } from 'react-router'
import CalendarPage from './pages/CalendarPage.tsx'
import { useEffect, useState } from 'react'
import type { NewTask, Task } from './types/Task.ts'
import { inputFormatter } from './utils/Datetime.ts'
import TaskForm from './components/dashboard/TaskForm/TaskForm.tsx'
import Settings from './pages/Settings.tsx'
import type { NewCategory, Category } from './types/Category.ts'
import CategoryForm from './components/dashboard/CategoryForm/CategoryForm.tsx'
import FormPanel from './components/dashboard/forms/FormPanel.tsx'
import type { Note } from './types/Note.ts'
import { createEmptyDashDocument } from './types/Block.ts'
import type { NoteFolder } from './types/NoteFolder.ts'
import {
  canMoveFolder,
  emptyTrash,
  getFolderBranchIds,
  isFolderInTrash,
  moveCategoryContentsToTrash,
  moveFolderBranchToTrash,
  normalizeStoredNoteFolders,
  normalizeStoredNotes,
  NOTES_INBOX_FOLDER_ID,
  NOTES_TRASH_FOLDER_ID,
  resolveFolderCategoryId,
} from './utils/noteTree.ts'

function readStoredArray(key: string) {
  const storedValue = localStorage.getItem(key)

  if (!storedValue) {
    return []
  }

  try {
    const parsedValue = JSON.parse(storedValue)

    return Array.isArray(parsedValue) ? parsedValue : []
  } catch {
    return []
  }
}

function createEmptyTaskValues(): NewTask {
  return {
    title: '',
    priority: 'medium',
    startAt: null,
    endAt: null,
    emoji: null,
    completed: false,
    categoryId: null,
  }
}

function App() {

  const [categories, setCategories] = useState<Category[]>(() => {
    const storedCategories = localStorage.getItem("dash.categories")
    if(!storedCategories) return []
    return JSON.parse(storedCategories)
  })

  useEffect(() => {
    localStorage.setItem("dash.categories", JSON.stringify(categories))
  }, [categories])

  const [tasks, setTasks] = useState<Task[]>(() => {
    const storedTasks = localStorage.getItem("dash.tasks")
    if(storedTasks === null) {
      return []
    }
    return JSON.parse(storedTasks)
  })

  useEffect(() => {
    localStorage.setItem("dash.tasks", JSON.stringify(tasks))
  }, [tasks])

  const [noteFolders, setNoteFolders] = useState<NoteFolder[]>(() =>
    normalizeStoredNoteFolders(
      readStoredArray('dash.noteFolders'),
    ),
  )

  useEffect(() => {
    localStorage.setItem("dash.noteFolders", JSON.stringify(noteFolders))
  }, [noteFolders])

  const [notes, setNotes] = useState<Note[]>(() =>
    normalizeStoredNotes(
      readStoredArray('dash.notes'),
      categories,
      noteFolders,
    ),
  )

  useEffect(() => {
    localStorage.setItem("dash.notes", JSON.stringify(notes))
  }, [notes])

  //note handlers
  function handleAddNote(
    folderId: string | null = NOTES_INBOX_FOLDER_ID,
  ) {
    const now = new Date().toISOString()
    const targetFolderId =
      folderId ?? NOTES_INBOX_FOLDER_ID
    const isTrashTarget =
      targetFolderId === NOTES_TRASH_FOLDER_ID ||
      isFolderInTrash(
        noteFolders,
        targetFolderId,
      )

    const note: Note = {
      id: crypto.randomUUID(),
      title: 'Untitled',

      document:
        createEmptyDashDocument(),

      categoryId:
        isTrashTarget
          ? null
          : resolveFolderCategoryId(
            noteFolders,
            targetFolderId,
          ),
      folderId:
        targetFolderId,
      createdAt: now,
      updatedAt: now,
      deletedAt:
        isTrashTarget
          ? now
          : null,
    }

    setNotes((currentNotes) => [
      ...currentNotes,
      note,
    ])

    return note.id
  }

  function handleUpdateNote(
    id: string,
    changes: Partial<
      Pick<
        Note,
        'title' | 'document' | 'categoryId' | 'folderId' | 'deletedAt'
      >
    >
  ) {
    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === id
          ? {
            ...note,
            ...changes,
            updatedAt: new Date().toISOString(),
          }
          : note
      )
    )
  }

  function handleDeleteNote(id: string) {
    const deletedAt =
      new Date().toISOString()

    setNotes((currentNotes) =>
      currentNotes.flatMap(
        (note) => {
          if (note.id !== id) {
            return [
              note,
            ]
          }

          const isAlreadyInTrash =
            note.folderId === NOTES_TRASH_FOLDER_ID ||
            note.deletedAt !== null ||
            isFolderInTrash(
              noteFolders,
              note.folderId,
            )

          if (isAlreadyInTrash) {
            return []
          }

          return [
            {
              ...note,
              categoryId:
                null,
              folderId:
              NOTES_TRASH_FOLDER_ID,
              updatedAt:
              deletedAt,
              deletedAt,
            },
          ]
        },
      )
    )
  }

  function handleAddNoteFolder(
    parentId: string | null = NOTES_INBOX_FOLDER_ID,
  ) {
    const normalizedParentId =
      parentId ?? NOTES_INBOX_FOLDER_ID

    if (
      normalizedParentId === NOTES_TRASH_FOLDER_ID ||
      isFolderInTrash(
        noteFolders,
        normalizedParentId,
      )
    ) {
      return null
    }

    const now =
      new Date().toISOString()

    const folder: NoteFolder = {
      id:
        crypto.randomUUID(),
      name:
        'New folder',
      parentId:
      normalizedParentId,
      createdAt:
      now,
      updatedAt:
      now,
      deletedAt:
        null,
    }

    setNoteFolders((currentFolders) => [
      ...currentFolders,
      folder,
    ])

    return folder.id
  }

  function handleRenameNoteFolder(
    folderId: string,
    name: string,
  ) {
    const trimmedName =
      name.trim()

    setNoteFolders((currentFolders) =>
      currentFolders.map((folder) =>
        folder.id === folderId
          ? {
            ...folder,
            name:
              trimmedName || 'Untitled folder',
            updatedAt:
              new Date().toISOString(),
          }
          : folder,
      ),
    )
  }

  function handleDeleteNoteFolder(folderId: string) {
    const deletedAt =
      new Date().toISOString()

    setNoteFolders((currentFolders) => {
      const movedTree =
        moveFolderBranchToTrash(
          notes,
          currentFolders,
          folderId,
          deletedAt,
        )

      setNotes(
        movedTree.notes,
      )

      return movedTree.folders
    })
  }

  function handleEmptyNoteTrash() {
    setNoteFolders((currentFolders) => {
      const emptiedTree =
        emptyTrash(
          notes,
          currentFolders,
        )

      setNotes(
        emptiedTree.notes,
      )

      return emptiedTree.folders
    })
  }

  function handleMoveNote(
    noteId: string,
    targetFolderId: string,
  ) {
    const movedAt =
      new Date().toISOString()
    const isTrashTarget =
      targetFolderId === NOTES_TRASH_FOLDER_ID ||
      isFolderInTrash(
        noteFolders,
        targetFolderId,
      )

    setNotes((currentNotes) =>
      currentNotes.map((note) =>
        note.id === noteId
          ? {
            ...note,
            categoryId:
              isTrashTarget
                ? null
                : resolveFolderCategoryId(
                  noteFolders,
                  targetFolderId,
                ),
            folderId:
            targetFolderId,
            updatedAt:
            movedAt,
            deletedAt:
              isTrashTarget
                ? note.deletedAt ?? movedAt
                : null,
          }
          : note,
      ),
    )
  }

  function handleMoveNoteFolder(
    folderId: string,
    targetParentId: string,
  ) {
    const movedAt =
      new Date().toISOString()

    setNoteFolders((currentFolders) => {
      if (
        !canMoveFolder(
          currentFolders,
          folderId,
          targetParentId,
        )
      ) {
        return currentFolders
      }

      const movedFolderIds =
        getFolderBranchIds(
          currentFolders,
          folderId,
        )
      const isTrashTarget =
        targetParentId === NOTES_TRASH_FOLDER_ID ||
        isFolderInTrash(
          currentFolders,
          targetParentId,
        )
      const nextFolders =
        currentFolders.map((folder) =>
          movedFolderIds.has(folder.id)
            ? {
              ...folder,
              parentId:
                folder.id === folderId
                  ? targetParentId
                  : folder.parentId,
              updatedAt:
              movedAt,
              deletedAt:
                isTrashTarget
                  ? folder.deletedAt ?? movedAt
                  : null,
            }
            : folder,
        )
      const nextCategoryId =
        isTrashTarget
          ? null
          : resolveFolderCategoryId(
            nextFolders,
            folderId,
          )

      setNotes((currentNotes) =>
        currentNotes.map((note) =>
          note.folderId && movedFolderIds.has(note.folderId)
            ? {
              ...note,
              categoryId:
              nextCategoryId,
              updatedAt:
              movedAt,
              deletedAt:
                isTrashTarget
                  ? note.deletedAt ?? movedAt
                  : null,
            }
            : note,
        ),
      )

      return nextFolders
    })
  }

  const sortedTasks = [...tasks].sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt))

  const [newTaskInitialValues, setNewTaskInitialValues] =
    useState<NewTask>(() => createEmptyTaskValues())

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)

  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false)

  function handleAddCategory(newCategory: NewCategory) {
    if (newCategory.name.trim() === '') {
      return false
    }
    if (newCategory.color.trim() === '') {
      return false
    }
    const category: Category = {
      id: crypto.randomUUID(),
      name: newCategory.name,
      color: newCategory.color,
      createdAt: new Date().toISOString(),
    }
    setCategories((currentCategories) => [...currentCategories, category])
    return true
  }

  function handleDeleteCategory(id: string) {
    const deletedAt =
      new Date().toISOString()

    setNoteFolders((currentFolders) => {
      const movedTree =
        moveCategoryContentsToTrash(
          notes,
          currentFolders,
          id,
          deletedAt,
        )

      setNotes(
        movedTree.notes,
      )

      return movedTree.folders
    })

    setCategories((currentCategories) => currentCategories.filter((c) => c.id !== id))
  }

  const [editingTask, setEditingTask] = useState<Task | null>(null)

  function handleAddTask(newTask : NewTask) {
    if (newTask.title.trim() === '') {
      // the title is empty
      return false
    }
    if (newTask.startAt === null || newTask.endAt === null) {
      // no startAt defined or no endAt defined
      return false
    }
    if (Date.parse(newTask.endAt) <= Date.parse(newTask.startAt)) {
      // the end is smaller or equal than the start
      return false
    }
    const task: Task = {
      id: crypto.randomUUID(),
      title: newTask.title.trim(),
      completed: false,
      priority: newTask.priority,
      createdAt: new Date().toISOString(),
      startAt: newTask.startAt,
      endAt: newTask.endAt,
      emoji: newTask.emoji,
      completedAt: '',
      categoryId: newTask.categoryId,
    }
    setTasks((currentTasks) => [...currentTasks, task])
    return true
  }

  function handleDeleteTaskItem(id : string) {
    setTasks((currentTasks) => currentTasks.filter(task => task.id !== id))
  }

  function handleToggleTaskItem(id: string) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id ?
          {
            ...task,
            completed: !task.completed,
            completedAt: !task.completed ? inputFormatter.format(new Date()) : '',
          } : task))
  }

  function handleEditTaskForm(
    id: string,
    updatedValues: NewTask,
  ) {
    if (updatedValues.title.trim() === '') {
      return false
    }

    const { startAt, endAt } = updatedValues

    if (startAt === null || endAt === null) {
      return false
    }

    if (Date.parse(endAt) <= Date.parse(startAt)) {
      return false
    }

    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? {
            ...task,
            ...updatedValues,
            startAt,
            endAt,
          }
          : task,
      ),
    )

    return true
  }

  function handleUpdateTask(
    id: string,
    changes: Partial<Task>
  ) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === id
          ? { ...task, ...changes }
          : task
      )
    )
  }

  function handleCreateTaskAt(startAt: Date) {
    const endAt = new Date(
      startAt.getTime() + 60 * 60 * 1000
    )

    setEditingTask(null)

    setNewTaskInitialValues({
      ...createEmptyTaskValues(),
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
    })

    setIsAddTaskOpen(true)
  }

  function handleEditTaskItem(task: Task) {
    setEditingTask(task)
    setIsAddTaskOpen(true)
  }

  function submitTaskAdd(values: NewTask) { // here we are gonna have two different ones one for adding a new task and one for editing
    if(handleAddTask(values)) {
      setEditingTask(null)
      setIsAddTaskOpen(false)
    }
  }

  function submitCategoryAdd(values: NewCategory) {
    if(handleAddCategory(values)) {
      setIsAddCategoryOpen(false)
    }
  }

  function submitTaskEdit(values: NewTask) {
    if(editingTask === null) {
      return
    }// here we are gonna have two different ones one for adding a new task and one for editing
    if(handleEditTaskForm(editingTask.id, values)) {
      setEditingTask(null)
      setIsAddTaskOpen(false)
    }
  }

  const today = new Date();

  return (
    <div className="flex h-dvh text-white overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 min-h-0 flex-1 overflow-y-auto dash-scrollbar">
        <Routes>
          <Route
            path="/"
            element={<Dashboard
              today={today}
              tasks={sortedTasks}
              setEditingTask={setEditingTask}
              setIsAddTaskOpen={setIsAddTaskOpen}
              handleDeleteTaskItem={handleDeleteTaskItem}
              handleEditTaskItem={handleEditTaskItem}
              handleToggleTaskItem={handleToggleTaskItem}
              categories={categories}
            />}
          />

          <Route
            path="/calendar"
            element={<CalendarPage
              tasks={sortedTasks}
              today={today}
              handleCreateTaskAt={handleCreateTaskAt}
              handleUpdateTask={handleUpdateTask}
              onEdit={handleEditTaskItem}
              onDelete={handleDeleteTaskItem}
              categories={categories}
            />}
          />

          <Route
            path="/categories"
            element={<Categories
              categories={categories}
              tasks={tasks}
              setIsAddCategoryOpen={setIsAddCategoryOpen}
              handleDeleteCategory={handleDeleteCategory}
            />}
          />

          <Route
            path="/stats"
            element={<Stats />}
          />

          <Route
            path="/notes"
            element={<Notes
              notes={notes}
              categories={categories}
              noteFolders={noteFolders}
              onAddNote={handleAddNote}
              onAddFolder={handleAddNoteFolder}
              onRenameFolder={handleRenameNoteFolder}
              onDeleteFolder={handleDeleteNoteFolder}
              onEmptyTrash={handleEmptyNoteTrash}
              onMoveNote={handleMoveNote}
              onMoveFolder={handleMoveNoteFolder}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
            />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />
        </Routes>
      </div>
      <div>
        {isAddTaskOpen && editingTask === null && (
          <FormPanel label="New task">
              <TaskForm
                onClose={() => {
                  setIsAddTaskOpen(false)
                }}
                onSubmit={submitTaskAdd}
                initialValues={newTaskInitialValues}
                categories={categories}
                today={today}
              />
          </FormPanel>
        )}
        {isAddTaskOpen && editingTask !== null && (
          <FormPanel label="Edit task">
              <TaskForm
                onClose={() => {
                  setIsAddTaskOpen(false)
                  setEditingTask(null)
                }}
                onSubmit={submitTaskEdit}
                initialValues={{
                  title: editingTask.title,
                  priority: editingTask.priority,
                  startAt: editingTask.startAt,
                  endAt: editingTask.endAt,
                  emoji: editingTask.emoji,
                  completed: editingTask.completed,

                  categoryId: editingTask.categoryId,
                }}
                categories={categories}
                today={today}
              />
          </FormPanel>
        )}
        {isAddCategoryOpen && (
          <FormPanel label="New category">
              <CategoryForm
                onClose={() => {
                  setIsAddCategoryOpen(false)
                }}
                onSubmit={submitCategoryAdd}
                initialValues={{
                  name: '',
                  color: '#D38B5D',
                }}
              />
          </FormPanel>
        )}
      </div>
    </div>
  )
}

export default App
