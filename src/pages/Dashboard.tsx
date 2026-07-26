import { useState, useEffect } from 'react'
import TaskList from '../components/dashboard/tasks/TaskList'
import AddTaskForm from '../components/dashboard/AddTaskForm'
import type { newTask, Task} from '../types/Task'

function Dashboard() {
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

  function handleAddTask(newTask : newTask) {
    if (newTask.title.trim() === '') {
      return
    }
    const task : Task = {
      id: crypto.randomUUID(),
      title: newTask.title,
      completed: false,
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      createdAt: getTodayDate()
    }
    setTasks((currentTasks) => [...currentTasks, task])
  }
  function handleDeleteTask(id : string) {
    setTasks((currentTasks) => currentTasks.filter(task => task.id !== id))
  }
  function handleToggleTask(id: string) {
    setTasks((currentTasks) => currentTasks.map((task) => task.id === id ? {...task, completed: !task.completed} : task))
  }
  function getTodayDate() {
    return new Date().toISOString()
  }

  return (
    <main className="flex flex-1 flex-col bg-app-background p-8">
      <header className="mb-8">
        <p className="text-sm text-text-primary">{getTodayDate()}</p>

        <h2 className="text-3xl font-semibold">Dashboard</h2>
      </header>
      <section className="flex flex-1 max-w-2xl flex-col rounded-xl border border-app-border bg-app-background p-6">
        <h3 className="mb-4 text-xl font-semibold">Today's plan</h3>
        <TaskList
          tasks={tasks}
          onToggle={handleToggleTask}
          onDelete={handleDeleteTask}
        />
        <AddTaskForm
          onAddTask={handleAddTask}
        />
      </section>
    </main>
  )
}

export default Dashboard
