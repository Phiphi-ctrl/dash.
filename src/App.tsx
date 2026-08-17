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
    <div className="flex h-full text-white overflow-hidden">
      <Sidebar />
      <div className="min-w-0 min-h-0 flex-1 overflow-y-auto dash-scrollbar">
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
            element={<Notes />}
          />

          <Route
            path="/settings"
            element={<Settings />}
          />
        </Routes>
      </div>
      <div>
        {isAddTaskOpen && editingTask === null && (
          <div className="fixed inset-0 z-50 flex justify-end p-2 overflow-hidden">
            <div
              className="w-full max-w-lg p-1 glass-surface"
            >
              <TaskForm
                onClose={() => {
                  setIsAddTaskOpen(false)
                }}
                onSubmit={submitTaskAdd}
                initialValues={newTaskInitialValues}
                categories={categories}
                today={today}
              />
            </div>
          </div>
        )}
        {isAddTaskOpen && editingTask !== null && (
          <div className="fixed inset-0 z-50 flex justify-end p-2 overflow-hidden">
            <div
              className="w-full max-w-lg p-1 glass-surface"
            >
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
            </div>
          </div>
        )}
        {isAddCategoryOpen && (
          <div className="fixed inset-0 z-50 flex justify-end p-2 overflow-hidden">
            <div
              className="w-full max-w-lg p-1 glass-surface"
            >
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
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
