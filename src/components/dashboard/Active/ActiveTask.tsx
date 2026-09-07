import type { Task } from '../../../types/Task.ts'
import { useEffect, useState } from 'react'
import ActiveTaskCard from './ActiveTaskCard.tsx'
import type { DayProgressGradient } from './ActiveTaskCard.tsx'
import { getDuration, getDurationMins, getTimeRange, isSameDay } from '../../../utils/Datetime.ts'
import type { Category } from '../../../types/Category.ts'
import PulseDot from '../../ui/PulseDot.tsx'
import { Clock2, Hash, LoaderCircle } from 'lucide-react'
import { getTaskColor } from '../../../utils/Category.ts'
import FormPopover from '../forms/FormPopover.tsx'
import StatusSelectionMenu from './StatusSelectionMenu.tsx'
import ViewSelector from '../ViewSelector.tsx'

type ActiveTaskProps = {
  tasks: Task[]
  today: Date
  onToggle: ( id: string ) => void,
  categories: Category[],
  dayProgressGradient: DayProgressGradient
}

export type ActiveStatus = "Time" | "Completed"

type ActiveView = 'day' | 'task'

const activeViewOptions = [
  { value: 'day', label: 'Day' },
  { value: 'task', label: 'Task' },
] as const

function ActiveTask ({tasks, today, onToggle, categories, dayProgressGradient}: ActiveTaskProps) {

  const [now, setNow] = useState(new Date())

  const [activeStatus, setActiveStatus] = useState<ActiveStatus>("Time")
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false)
  const [preferredView, setPreferredView] = useState<ActiveView>('task')

  //filter only tasks that are today
  const filteredTodayTasks = tasks.filter((task: Task) => isSameDay(today, new Date(task.startAt)))

  //filter for active tasks
  const activeTasks = filteredTodayTasks.filter((task) => {
    const start = new Date(task.startAt)
    const end = new Date(task.endAt)

    return start <= now && now < end && !task.completed;
  })

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(() => {
    if (activeTasks.length === 0) return null
    return activeTasks[0].id
  })

  function getTotalTaskDurationMs () {
    let totalDuration = 0

    for (const task of filteredTodayTasks) {
      const taskStart = new Date(task.startAt)
      const taskEnd = new Date(task.endAt)
      const duration = taskEnd.getTime() - taskStart.getTime()
      totalDuration += duration
    }


    return totalDuration
  }

  const duration = getTotalTaskDurationMs()




  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  function getDurationPastCompletedTasksToday () {
    let pastCompletedDuration = 0

    for (const task of filteredTodayTasks) {
      const end = new Date(task.endAt)
      const start = new Date(task.startAt)

      if (end < now && task.completed) {
        pastCompletedDuration += (end.getTime() - start.getTime())
      }
    }

    return pastCompletedDuration
  }

  const pastCompletedDurationMs = getDurationPastCompletedTasksToday()

  const selectedTask =
    activeTasks.find((task) => task.id === selectedTaskId) ?? activeTasks[0]
  const hasActiveTasks = activeTasks.length > 0
  const view = hasActiveTasks ? preferredView : 'day'
  const showTaskView = view === 'task'
  const displayedTask = showTaskView ? selectedTask : undefined

  type CategoryStats = {
    duration: number
    name: string
    color: string
    numTasks: number
  }

  function getDayStats() {
    const categoriesStats: Record<string, CategoryStats> = {}

    for (const category of categories) {
      const categoryName = category.name

      categoriesStats[categoryName] = {
        duration: 0,
        name: categoryName,
        color: category.color,
        numTasks: 0
      }

      for (const task of filteredTodayTasks) {
        const taskDuration = getDurationMins(task.startAt, task.endAt)
        if (taskDuration === null) {
          continue
        }
        if (task.categoryId === category.id && task.completed) {
          categoriesStats[categoryName].duration += taskDuration
          categoriesStats[categoryName].numTasks += 1
        }
      }
    }

    return categoriesStats
  }

  function renderStatusButtonContent () {
    switch (activeStatus) {
      case 'Time':
        return (
          <div className="flex gap-2 items-center">
            <Clock2 size={14}/>
            {'Time'}
          </div>
        )
      case 'Completed':
        return (
          <div className="flex gap-2 items-center">
            <Hash size={14}/>
            {'Completed'}
          </div>
        )
    }
  }

  function handleStatusButtonToggle () {
    setIsStatusMenuOpen((currentState) => !currentState)
  }

  function handleStatusSelection (selection: ActiveStatus) {
    setActiveStatus(selection)
    setIsStatusMenuOpen(false)
  }



  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between mb-4 p-2">
        <div className="flex justify-center items-center p-2 gap-3 text-foreground">
          <LoaderCircle className="size-5" />
          <h3 className="text-xl font-semibold">status.</h3>
          <ViewSelector
            key={hasActiveTasks ? 'active' : 'idle'}
            label="Overview"
            options={activeViewOptions}
            view={view}
            disabled={!hasActiveTasks}
            onSelect={(selection) => {
              setPreferredView(selection)
              setIsStatusMenuOpen(false)
            }}
          />
        </div>
      </div>
    <div className="flex justify-between gap-4 glass-surface max-h-69 max-w-135 p-6">
      <div className="flex flex-col">
        {!showTaskView && (
          <div className="flex justify-between py-3">
            <div className={`
                  flex 
                  items-center
                  gap-2 
                  px-3
                  text-xs
                `}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex gap-2 items-center">
                  <PulseDot color={dayProgressGradient.glowColor} pulse={false} />
                  <span className={`min-w-0 truncate max-w-50 text-foreground font-normal`}>
                    {'Completed'}
                  </span>
                </div>
              </div>
            </div>
            <FormPopover
              open={isStatusMenuOpen}
              onOpenChange={setIsStatusMenuOpen}
              label={"Choose an option"}
              trigger={({ref, props}) => (
                <button
                  ref={ref} {...props}
                  type="button"
                  className="
                  flex
                  glass-surface
                  text-xs
                  items-center
                  text-foreground
                  p-2
                  cursor-pointer
                  "
                  onClick={handleStatusButtonToggle}
                >
                  {renderStatusButtonContent()}
                </button>
              )}
            >
              <StatusSelectionMenu onSelect={handleStatusSelection} />
            </FormPopover>

          </div>

        )}
        <div className="flex flex-col gap-2 overflow-hidden overflow-y-auto scrollbar-none">
          {showTaskView && (
            activeTasks.map((task) => (
              <button
                type="button"
                key={task.id}
                onClick={() => {
                  setSelectedTaskId(task.id)
                }}
                className={`
                  flex 
                  items-center
                  gap-2 
                  cursor-pointer 
                  p-3
                  rounded-4xl
                  text-xs
                  ${selectedTask?.id === task.id ? 'bg-muted/10' : 'bg-transparent'}
                  transition-colors duration-300
                `}
              >
                <div>
                  {task.emoji !== null && (
                    <span className={`text-3xl size-9 pl-2 pr-2 cursor-default ${selectedTask?.id === task.id ? 'opacity-100' : 'opacity-20'} transition-opacity duration-300`}>
                      {task.emoji}
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex gap-2 items-center">
                    <PulseDot color={getTaskColor(task, categories)} pulse={selectedTask?.id === task.id} />
                    <span className={`min-w-0 truncate max-w-50 ${selectedTask?.id === task.id ? 'text-foreground font-normal' : 'text-muted font-normal'} transition-colors duration-300`}>
                  {task.title}
                </span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs ${selectedTask?.id === task.id ? 'text-foreground-secondary' : 'text-muted'} transition-colors duration-300`}>
                <span className="flex items-center gap-2 shrink-0">
                  <Clock2 className="size-3"/> {getDuration(task.startAt, task.endAt)}
                </span>
                    <span className="max-w-40 truncate">
                  {getTimeRange(task.startAt, task.endAt, today)}
                </span>
                  </div>
                </div>
              </button>
            ))
          )}
          {!showTaskView && (
            <>
              <div className="flex flex-col gap-2 text-foreground-secondary">
                {Object.entries(getDayStats()).map(([categoryName, stats]) => {
                  if (stats.numTasks !== 0) {
                    return (
                      <div
                        key={categoryName}
                        className="
                      flex
                      flex-col
                      gap-2
                      p-3
                      rounded-4xl
                      text-xs
                      bg-muted/10
                      "
                      >
                        <div className="grid grid-cols-3 gap-4">
                          {/*Color dot and name*/}
                          <div className="flex gap-2 items-center">
                            <PulseDot color={stats.color} pulse={false} />
                            <span>{categoryName}</span>
                          </div>
                          {/*Divider*/}
                          <span className="bg-muted/20 w-[2px]"/>

                          {/*Num tasks and total time spent*/}
                          <div className="flex text-muted gap-2">
                            {activeStatus === "Time" && (
                              <>
                                <Clock2 size={14}/>
                                <span> {stats.duration}m</span>
                              </>
                            )}
                            {activeStatus === "Completed" && (
                              <>
                                <Hash size={14}/>
                                <span> {stats.numTasks}</span>
                              </>
                            )}

                          </div>
                        </div>
                      </div>
                    )
                  }
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <ActiveTaskCard
        activeTask={displayedTask}
        today={today}
        onToggle={onToggle}
        now={now}
        totalTasksDurationMs={duration}
        pastCompletedDurationMs={pastCompletedDurationMs}
        categories={categories}
        dayProgressGradient={dayProgressGradient}
        key={displayedTask?.id ?? 'no-active-task'}
      />
    </div>
    </div>
  )
}

export default ActiveTask
