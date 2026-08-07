import { useState, useEffect, useRef } from 'react'
import TaskList from '../components/dashboard/TodoList/TaskList'
import TaskForm from '../components/dashboard/TaskForm/TaskForm.tsx'
import type { NewTask, Task} from '../types/Task'
import Button from '../components/ui/Button.tsx'
import { PlusIcon, ListChecks, LoaderCircle } from 'lucide-react'
import LiveDateTime from '../components/dashboard/LiveDateTime.tsx'
import ActiveTask from '../components/dashboard/Active/ActiveTask.tsx'

function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const storedTasks = localStorage.getItem("dash.TodoList")
    if(storedTasks === null) {
      return []
    }
    return JSON.parse(storedTasks)
  })
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)

  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const addTaskRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if(!isAddTaskOpen) {
      return
    }

    function handleDocumentClick(event: MouseEvent) {
      if(!(event.target instanceof Node)) {
        return
      }

      const clickedInside =
        addTaskRef.current?.contains(event.target)

      if(!clickedInside) {
        setIsAddTaskOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentClick)

    return () => {
      document.removeEventListener('mousedown', handleDocumentClick)
    }
  }, [isAddTaskOpen])

  useEffect(() => {
    localStorage.setItem("dash.TodoList", JSON.stringify(tasks))
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
    }
    setTasks((currentTasks) => [...currentTasks, task])
    return true
  }
  function handleDeleteTaskItem(id : string) {
    setTasks((currentTasks) => currentTasks.filter(task => task.id !== id))
  }
  function handleToggleTaskItem(id: string) {
    setTasks((currentTasks) => currentTasks.map((task) => task.id === id ? {...task, completed: !task.completed} : task))
  }
  function handleEditTaskItem(task: Task) {
    setEditingTask(task)
    setIsAddTaskOpen(true)
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

  const emptyTaskValues: NewTask = {
    title: '',
    priority: 'medium',
    startAt: null,
    endAt: null,
    emoji: null,
  }

  const today = new Date();

  return (
    <main className="flex flex-1 z-0 flex-col p-20">
      <header className="mb-8">
        <LiveDateTime />

        <h2 className="text-5xl font-bold">board.</h2>
      </header>
      <section className="grid grid-cols-2 rounded-lg gap-10">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between mb-4 p-2">
            <div className="flex justify-center items-center p-2 gap-3">
              <ListChecks className="size-5" />
              <h3 className="text-xl font-semibold">To-Do list.</h3>
            </div>
            <Button
              onClick={() => {
                setEditingTask(null)
                setIsAddTaskOpen((current) => !current)
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
          <TaskList
            tasks={tasks}
            onToggle={handleToggleTaskItem}
            onDelete={handleDeleteTaskItem}
            onEdit={handleEditTaskItem}
            today={today}
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between mb-4 p-2">
            <div className="flex justify-center items-center p-2 gap-3">
              <LoaderCircle className="size-5" />
              <h3 className="text-xl font-semibold">active.</h3>
            </div>
          </div>
          <ActiveTask tasks={tasks} today={today}/>
        </div>
      </section>

      <div>
        {isAddTaskOpen && editingTask === null && (
          <div className="fixed inset-0 z-50 flex justify-end p-2">
            <div
              className="w-full rounded-lg max-w-lg border border-border bg-surface p-1"
              ref={addTaskRef}
            >
              <TaskForm
                onClose={() => {
                  setIsAddTaskOpen(false)
                }}
                onSubmit={submitTaskAdd}
                initialValues={emptyTaskValues}
                today={today}
              />
            </div>
          </div>
        )}
        {isAddTaskOpen && editingTask !== null && (
          <div className="fixed inset-0 z-50 flex justify-end p-2">
            <div
              className="w-full rounded-lg max-w-lg border border-border bg-surface p-1"
              ref={addTaskRef}
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
                }}
                today={today}
              />
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

export default Dashboard
