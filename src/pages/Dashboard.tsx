import { useState } from 'react'
import TaskList from '../components/dashboard/TodoList/TaskList'
import type { Task } from '../types/Task'
import Button from '../components/ui/Button.tsx'
import { PlusIcon, ListChecks, LoaderCircle, ChevronDown, ChevronUp, LineStyle } from 'lucide-react'
import LiveDateTime from '../components/dashboard/LiveDateTime.tsx'
import ActiveTask from '../components/dashboard/Active/ActiveTask.tsx'

type DashboardProps = {
  today: Date
  tasks: Task[]
  handleToggleTaskItem: (id: string) => void
  handleDeleteTaskItem: (id: string) => void
  setEditingTask: (task: Task | null) => void
  setIsAddTaskOpen: (isOpen: boolean) => void
  handleEditTaskItem: (task: Task) => void
}


function Dashboard({
                     today,
                     tasks,
                     handleToggleTaskItem,
                     setEditingTask,
                     setIsAddTaskOpen,
                     handleDeleteTaskItem,
                     handleEditTaskItem }: DashboardProps) {

  const [isActiveOpen, setIsActiveOpen] = useState(true)

  const [isToDoOpen, setIsToDoOpen] = useState(true)


  return (
    <main className="flex flex-1 z-0 flex-col p-10 gap-8">
      <header className="flex flex-col gap-2">
        <LiveDateTime />
        <div className="flex gap-4 items-center">
          <LineStyle className="size-12 text-muted"/>
          <h2 className="text-5xl font-bold">board.</h2>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-10">
        {/*Active Section*/}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between mb-4 p-2">
            <div className="flex justify-center items-center p-2 gap-3">
              <LoaderCircle className="size-5" />
              <h3 className="text-xl font-semibold">active.</h3>
              <button
                className="cursor-pointer"
                type="button"
                onClick={() => setIsActiveOpen((current) => !current)}
              >
                {isActiveOpen ? (
                  <ChevronUp className="size-6"/>
                ) : (
                  <ChevronDown className="size-6"/>
                )}
              </button>
            </div>
          </div>
          {isActiveOpen && (
            <ActiveTask tasks={tasks} today={today} onToggle={handleToggleTaskItem} />
          )}
        </div>
        {/*To-do section*/}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between mb-4 p-2">
            <div className="flex justify-center items-center p-2 gap-3">
              <ListChecks className="size-5" />
              <h3 className="text-xl font-semibold">To-Do list.</h3>
              <button
                className="cursor-pointer"
                type="button"
                onClick={() => setIsToDoOpen((current) => !current)}
              >
                {isToDoOpen ? (
                  <ChevronUp className="size-6"/>
                ) : (
                  <ChevronDown className="size-6"/>
                )}
              </button>
            </div>
            <Button
              onClick={() => {
                setEditingTask(null)
                setIsAddTaskOpen(true)
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
          {isToDoOpen && (
            <TaskList
              tasks={tasks}
              onToggle={handleToggleTaskItem}
              onDelete={handleDeleteTaskItem}
              onEdit={handleEditTaskItem}
              today={today}
            />
          )}
        </div>
      </section>
    </main>
  )
}

export default Dashboard
