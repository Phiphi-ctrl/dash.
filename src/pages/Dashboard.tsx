import { useState } from "react"
import TaskList from '../components/dashboard/TodoList/TaskList'
import type { TaskListView } from '../components/dashboard/TodoList/taskListViews.ts'
import ViewSelector from '../components/dashboard/ViewSelector.tsx'
import type { Task } from '../types/Task'
import Button from '../components/ui/Button.tsx'
import {
  PlusIcon,
  Dot,
  UserRound,
  ListSortDescending,
} from 'lucide-react'
import LiveDateTime from '../components/dashboard/LiveDateTime.tsx'
import ActiveTask from '../components/dashboard/Active/ActiveTask.tsx'
import type { Category } from '../types/Category.ts'
import Tooltip from '../components/ui/Tooltip.tsx'
import TimelineBar from '../components/dashboard/TimelineBar/TimelineBar.tsx'
import { useTimeOfDay } from '../context/TimeOfDayContext.ts'
import GradientTaskButton from '../components/ui/GradientTaskButton.tsx'

type DashboardProps = {
  today: Date
  tasks: Task[]
  handleToggleTaskItem: (id: string) => void
  handleDeleteTaskItem: (id: string) => void
  onAddTask: () => void
  handleEditTaskItem: (task: Task) => void
  categories: Category[]
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
                     onAddTask,
                     handleDeleteTaskItem,
                     handleEditTaskItem,
                     categories }: DashboardProps) {

  const [taskListView, setTaskListView] = useState<TaskListView>('upcoming')

  const { now, theme: timeOfDay } = useTimeOfDay()

  function renderGreeting() {
    return (
      <div className="flex flex-wrap items-center gap-6">
        <h1 className="text-8xl font-bold tracking-tight">
        <span className="text-foreground">
          Good{" "}
        </span>

          <span
            className={`${timeOfDay.gradient} bg-clip-text text-transparent`}
          >
          {timeOfDay.label}
        </span>
        </h1>


        <GradientTaskButton onClick={onAddTask} />

      </div>
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
      <header>
        <div className="flex-start flex-col gap-1 items-center justify-start pt-10">
          {renderGreeting()}
          {renderGreetingUnderline("Philipp Saboi")}
        </div>
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
              <ListSortDescending className="size-5" />
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
                onClick={onAddTask}
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
