import { useState, useEffect, useRef } from 'react'
import TaskList from '../components/dashboard/tasks/TaskList'
import AddTaskForm from '../components/dashboard/AddTaskForm'
import type { NewTask, Task} from '../types/Task'
import Button from '../components/ui/Button.tsx'
import { PlusIcon, List } from 'lucide-react'

function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const storedTasks = localStorage.getItem("dash.tasks")
    if(storedTasks === null) {
      return []
    }
    return JSON.parse(storedTasks)
  })
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false)

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
      createdAt: today.toISOString(),
      startAt: newTask.startAt,
      endAt: newTask.endAt,
    }
    setTasks((currentTasks) => [...currentTasks, task])
    return true
  }
  function handleDeleteTask(id : string) {
    setTasks((currentTasks) => currentTasks.filter(task => task.id !== id))
  }
  function handleToggleTask(id: string) {
    setTasks((currentTasks) => currentTasks.map((task) => task.id === id ? {...task, completed: !task.completed} : task))
  }

  const today = new Date();

  return (
    <main className="flex flex-1 z-0 flex-col bg-app-background pl-40 pt-20">
      <header className="mb-8">
        <p className="text-sm text-text-muted">@{today.toISOString()}</p>

        <h2 className="text-5xl font-bold">dash.</h2>
      </header>
      <section className="flex flex-1 max-w-xl flex-col rounded-xl bg-app-background p-0">
        <div className="flex justify-between w-full mb-4 p-2">
          <div className="flex justify-center items-center p-2 gap-3">
            <List className="size-5" />
            <h3 className="text-xl font-semibold">to-do list.</h3>
          </div>
          <Button
            onClick={() => setIsAddTaskOpen((current) => !current)}
            Icon={PlusIcon}
            borderBgTextHoverStyle={'border-app-border bg-app-surface text-text-muted hover:bg-app-surface-hover'}/>
        </div>

        <TaskList
          tasks={tasks}
          onToggle={handleToggleTask}
          onDelete={handleDeleteTask}
          today={today}
        />
      </section>
      <div>
        {isAddTaskOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-transparent p-2">
            <div className="w-full rounded-lg max-w-xl border border-app-border bg-app-surface p-1" ref={addTaskRef}>
              <AddTaskForm onAddTask={handleAddTask} onClose={()=> setIsAddTaskOpen(false)}/>
            </div>
          </div>
        )}
      </div>

    </main>
  )
}

export default Dashboard
