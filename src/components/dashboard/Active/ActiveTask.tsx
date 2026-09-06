import type { Task } from '../../../types/Task.ts'
import { useEffect, useState } from 'react'
import ActiveTaskCard from './ActiveTaskCard.tsx'
import type { DayProgressGradient } from './ActiveTaskCard.tsx'
import { getDuration, getTimeRange, isSameDay } from '../../../utils/Datetime.ts'
import type { Category } from '../../../types/Category.ts'
import PulseDot from '../../ui/PulseDot.tsx'
import { Clock2 } from 'lucide-react'
import { getTaskColor } from '../../../utils/Category.ts'



type ActiveTaskProps = {
  tasks: Task[]
  today: Date
  onToggle: ( id: string ) => void,
  categories: Category[],
  dayProgressGradient: DayProgressGradient
}

function ActiveTask ({tasks, today, onToggle, categories, dayProgressGradient}: ActiveTaskProps) {

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [now, setNow] = useState(new Date())

  //filter only tasks that are today
  const filteredTodayTasks = tasks.filter((task: Task) => isSameDay(today, new Date(task.startAt)))

  //filter for active tasks
  const activeTasks = filteredTodayTasks.filter((task) => {
    const start = new Date(task.startAt)
    const end = new Date(task.endAt)

    return start <= now && now < end && !task.completed;
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



  return (
    <div className="flex gap-4 glass-surface max-h-69 w-fit p-6">
      <div className="flex flex-col gap-1 overflow-hidden overflow-y-auto dash-scrollbar">
        {activeTasks.map((task) => (
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
            ${selectedTaskId === task.id ? 'bg-muted/10' : 'bg-transparent'}
            transition-colors duration-300
            `}
          >
            <div>
              {task.emoji !== null && (
                <span className={`text-3xl size-9 pl-2 pr-2 cursor-default ${selectedTaskId === task.id ? 'opacity-100' : 'opacity-20'} transition-opacity duration-300`}>
              {task.emoji}
            </span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex gap-2 items-center">
                <PulseDot color={getTaskColor(task, categories)} pulse={selectedTaskId === task.id} />
                <span className={`min-w-0 truncate max-w-50 ${selectedTaskId === task.id ? 'text-foreground font-semibold' : 'text-muted font-normal'} transition-colors duration-300`}>
                  {task.title}
                </span>
              </div>
              <div className={`flex items-center gap-2 text-sm ${selectedTaskId === task.id ? 'text-foreground-secondary' : 'text-muted'} transition-colors duration-300`}>
                <span className="flex items-center gap-2 shrink-0">
                  <Clock2 className="size-4"/> {getDuration(task.startAt, task.endAt)}
                </span>
                <span className="max-w-40 truncate">
                  {getTimeRange(task.startAt, task.endAt, today)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
      <ActiveTaskCard
        activeTask={selectedTask}
        today={today}
        onToggle={onToggle}
        now={now}
        totalTasksDurationMs={duration}
        pastCompletedDurationMs={pastCompletedDurationMs}
        categories={categories}
        dayProgressGradient={dayProgressGradient}
        key={selectedTask?.id ?? 'no-active-task'}
      />
    </div>
  )
}

export default ActiveTask
