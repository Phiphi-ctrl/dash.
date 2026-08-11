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

function createEmptyTaskValues(): NewTask {
  return {
    title: '',
    priority: 'medium',
    startAt: null,
    endAt: null,
    emoji: null,
    completed: false,
  }
}

function App() {

  const [tasks, setTasks] = useState<Task[]>(() => {
    const storedTasks = localStorage.getItem("dash.tasks")
    if(storedTasks === null) {
      return []
    }
    return JSON.parse(storedTasks)
  })

  const [newTaskInitialValues, setNewTaskInitialValues] =
    useState<NewTask>(() => createEmptyTaskValues())

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)

  const [editingTask, setEditingTask] = useState<Task | null>(null)

  useEffect(() => {
    localStorage.setItem("dash.tasks", JSON.stringify(tasks))
  }, [tasks])

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
    console.log(newTask) // debug
    const task : Task = {
      id: crypto.randomUUID(),
      title: newTask.title.trim(),
      completed: false,
      priority: newTask.priority,
      createdAt: new Date().toISOString(),
      startAt: newTask.startAt,
      endAt: newTask.endAt,
      emoji: newTask.emoji,
      completedAt: null
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
            completedAt: !task.completed ? inputFormatter.format(new Date()) : null,
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
              tasks={tasks}
              setEditingTask={setEditingTask}
              setIsAddTaskOpen={setIsAddTaskOpen}
              handleDeleteTaskItem={handleDeleteTaskItem}
              handleEditTaskItem={handleEditTaskItem}
              handleToggleTaskItem={handleToggleTaskItem}
            />}
          />

          <Route
            path="/calendar"
            element={<CalendarPage
              tasks={tasks}
              today={today}
              handleCreateTaskAt={handleCreateTaskAt}
              handleUpdateTask={handleUpdateTask}
              onEdit={handleEditTaskItem}
              onDelete={handleDeleteTaskItem}
            />}
          />

          <Route
            path="/categories"
            element={<Categories />}
          />

          <Route
            path="/stats"
            element={<Stats />}
          />

          <Route
            path="/notes"
            element={<Notes />}
          />
        </Routes>
      </div>
      <div>
        {isAddTaskOpen && editingTask === null && (
          <div className="fixed inset-0 z-50 flex justify-end p-2">
            <div
              className="w-full max-w-lg p-1 glass-surface"
            >
              <TaskForm
                onClose={() => {
                  setIsAddTaskOpen(false)
                }}
                onSubmit={submitTaskAdd}
                initialValues={newTaskInitialValues}
                today={today}
              />
            </div>
          </div>
        )}
        {isAddTaskOpen && editingTask !== null && (
          <div className="fixed inset-0 z-50 flex justify-end p-2">
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
                }}
                today={today}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
