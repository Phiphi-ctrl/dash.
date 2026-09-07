import { useEffect, useState } from "react"
import TaskList from '../components/dashboard/TodoList/TaskList'
import type { TaskListView } from '../components/dashboard/TodoList/taskListViews.ts'
import ViewSelector from '../components/dashboard/ViewSelector.tsx'
import type { Task } from '../types/Task'
import Button from '../components/ui/Button.tsx'
import {
  PlusIcon,
  Dot,
  UserRound,
  SquareArrowRight,
} from 'lucide-react'
import LiveDateTime from '../components/dashboard/LiveDateTime.tsx'
import ActiveTask from '../components/dashboard/Active/ActiveTask.tsx'
import type { Category } from '../types/Category.ts'
import Tooltip from '../components/ui/Tooltip.tsx'
import TimelineBar from '../components/dashboard/TimelineBar/TimelineBar.tsx'

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

type DashboardGradientStop = {
  offset: string
  color: string
}

type DashboardDayProgressGradient = {
  id: string
  glowColor: string
  stops: DashboardGradientStop[]
}

type DashboardTimeOfDayTheme = {
  label: string
  gradient: string
  dayProgressGradient: DashboardDayProgressGradient
}

const taskListViewOptions = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
] as const

function Dashboard({
                     today,
                     tasks,
                     handleToggleTaskItem,
                     setEditingTask,
                     setIsAddTaskOpen,
                     handleDeleteTaskItem,
                     handleEditTaskItem,
                     categories }: DashboardProps) {

  const [taskListView, setTaskListView] = useState<TaskListView>('upcoming')

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

  function getTimeOfDay(now: Date): DashboardTimeOfDayTheme {
    const hour = now.getHours()

    if (hour >= 5 && hour < 12) {
      return {
        label: "Morning",
        gradient:
          "bg-linear-to-r from-amber-300 via-orange-400 to-rose-400",
        dayProgressGradient: {
          id: 'dashboard-day-progress-morning',
          glowColor: '#fb923c',
          stops: [
            { offset: '0%', color: '#fcd34d' },
            { offset: '50%', color: '#fb923c' },
            { offset: '100%', color: '#fb7185' },
          ],
        },
      }
    }

    if (hour >= 12 && hour < 17) {
      return {
        label: "Afternoon",
        gradient:
          "bg-linear-to-r from-sky-400 via-cyan-400 to-blue-500",
        dayProgressGradient: {
          id: 'dashboard-day-progress-afternoon',
          glowColor: '#22d3ee',
          stops: [
            { offset: '0%', color: '#38bdf8' },
            { offset: '50%', color: '#22d3ee' },
            { offset: '100%', color: '#3b82f6' },
          ],
        },
      }
    }

    if (hour >= 17 && hour < 22) {
      return {
        label: "Evening",
        gradient:
          "bg-linear-to-r from-orange-500 via-rose-500 to-purple-500",
        dayProgressGradient: {
          id: 'dashboard-day-progress-evening',
          glowColor: '#f43f5e',
          stops: [
            { offset: '0%', color: '#f97316' },
            { offset: '50%', color: '#f43f5e' },
            { offset: '100%', color: '#a855f7' },
          ],
        },
      }
    }

    return {
      label: "Night",
      gradient:
        "bg-linear-to-r from-indigo-400 via-violet-500 to-purple-600",
      dayProgressGradient: {
        id: 'dashboard-day-progress-night',
        glowColor: '#8b5cf6',
        stops: [
          { offset: '0%', color: '#818cf8' },
          { offset: '50%', color: '#8b5cf6' },
          { offset: '100%', color: '#9333ea' },
        ],
      },
    }
  }

  const timeOfDay = getTimeOfDay(now)

  function renderGreeting () {
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
    <main className="flex min-h-full min-w-0 flex-1 z-0 flex-col px-10 gap-8 pb-10">
      <header className="flex-start flex-col gap-1 items-center justify-start pt-10">
        {renderGreeting()}
        {renderGreetingUnderline("Philipp Saboi")}
      </header>

      <TimelineBar tasks={tasks} categories={categories} now={now} onEdit={handleEditTaskItem} onToggle={handleToggleTaskItem} />

      <section className="grid grid-cols-2">
        {/*Active Section*/}
        <ActiveTask
          tasks={tasks}
          today={today}
          onToggle={handleToggleTaskItem}
          categories={categories}
          dayProgressGradient={timeOfDay.dayProgressGradient}
        />
        {/*To-do section*/}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between mb-4 p-2">
            <div className="flex justify-center items-center p-2 gap-3 text-foreground">
              <SquareArrowRight className="size-5" />
              <h3 className="text-xl font-semibold">task-list.</h3>
              <ViewSelector
                label="Task list"
                view={taskListView}
                options={taskListViewOptions}
                onSelect={setTaskListView}
              />
            </div>
            <Tooltip
              content={
                <div className="flex items-center gap-1 text-xs text-muted">
                  <PlusIcon size={14}/>
                  <span className="font-semibold text-foreground-secondary">add new</span>
                  <span>task</span>
                </div>
              }
              delay={800}
              placement="top"
            >
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
                hover:scale-110
                hover:text-foreground
              `}
              />
            </Tooltip>

          </div>
          <TaskList
            tasks={tasks}
            onToggle={handleToggleTaskItem}
            onDelete={handleDeleteTaskItem}
            onEdit={handleEditTaskItem}
            categories={categories}
            view={taskListView}
          />
        </div>
      </section>
    </main>
  )
}

export default Dashboard
