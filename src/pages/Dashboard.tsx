import { useEffect, useState } from "react"
import TaskList from '../components/dashboard/TodoList/TaskList'
import type { Task } from '../types/Task'
import Button from '../components/ui/Button.tsx'
import { PlusIcon, ListChecks, LoaderCircle, ChevronDown, ChevronUp, Dot, UserRound } from 'lucide-react'
import LiveDateTime from '../components/dashboard/LiveDateTime.tsx'
import ActiveTask from '../components/dashboard/Active/ActiveTask.tsx'
import type { Category } from '../types/Category.ts'

type DashboardProps = {
  today: Date
  tasks: Task[]
  handleToggleTaskItem: (id: string) => void
  handleDeleteTaskItem: (id: string) => void
  setEditingTask: (task: Task | null) => void
  setIsAddTaskOpen: (isOpen: boolean) => void
  handleEditTaskItem: (task: Task) => void
  categories: Category[]
}


function Dashboard({
                     today,
                     tasks,
                     handleToggleTaskItem,
                     setEditingTask,
                     setIsAddTaskOpen,
                     handleDeleteTaskItem,
                     handleEditTaskItem,
                     categories }: DashboardProps) {

  const [isActiveOpen, setIsActiveOpen] = useState(true)

  const [isToDoOpen, setIsToDoOpen] = useState(true)

  function useCurrentTime() {
    const [now, setNow] = useState(() => new Date())

    useEffect(() => {
      const interval = setInterval(() => {
        setNow(new Date())
      }, 60_000)

      return () => clearInterval(interval)
    }, [])

    return now
  }

  const now = useCurrentTime()

  function getTimeOfDay(now: Date) {
    const hour = now.getHours()

    if (hour >= 5 && hour < 12) {
      return {
        label: "Morning",
        gradient:
          "bg-linear-to-r from-amber-300 via-orange-400 to-rose-400",
      }
    }

    if (hour >= 12 && hour < 17) {
      return {
        label: "Afternoon",
        gradient:
          "bg-linear-to-r from-sky-400 via-cyan-400 to-blue-500",
      }
    }

    if (hour >= 17 && hour < 22) {
      return {
        label: "Evening",
        gradient:
          "bg-linear-to-r from-orange-500 via-rose-500 to-purple-500",
      }
    }

    return {
      label: "Night",
      gradient:
        "bg-linear-to-r from-indigo-400 via-violet-500 to-purple-600",
    }
  }

  function renderGreeting () {
    const timeOfDay = getTimeOfDay(now)

    return (
      <h1 className="text-8xl font-bold tracking-tight">
        <span className="text-foreground">Good{" "}</span>
        <span
          className={`${timeOfDay.gradient} bg-clip-text text-transparent`}
        >
          {timeOfDay.label}
        </span>
      </h1>
    )
  }

  function renderGreetingUnderline (userName: string) {
    return (
      <div className="flex items-center text-muted gap-2">
        <div className="flex items-center text-muted gap-1">
          <UserRound size={14}/>
          {userName}
        </div>
        <Dot size={14}/>
        <LiveDateTime />
      </div>
    )
  }


  return (
    <main className="flex min-h-full flex-1 z-0 flex-col px-10 gap-8 pb-10">
      <header className="flex-start flex-col gap-1 items-center justify-start pt-20">
        {renderGreeting()}
        {renderGreetingUnderline("Philipp Saboi")}
      </header>


      <section className="grid grid-cols-2 gap-10">
        {/*Active Section*/}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between mb-4 p-2">
            <div className="flex justify-center items-center p-2 gap-3 text-foreground">
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
            <ActiveTask
              tasks={tasks}
              today={today}
              onToggle={handleToggleTaskItem}
              categories={categories}
            />
          )}
        </div>
        {/*To-do section*/}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between mb-4 p-2">
            <div className="flex justify-center items-center p-2 gap-3 text-foreground">
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
              categories={categories}
              today={today}
            />
          )}
        </div>
      </section>
    </main>
  )
}

export default Dashboard
