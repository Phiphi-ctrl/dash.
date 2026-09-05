import type { Task } from '../../../types/Task.ts'
import { useEffect, useState } from 'react'
import ActiveTaskCard from './ActiveTaskCard.tsx'
import { isSameDay } from '../../../utils/Datetime.ts'
import type { Category } from '../../../types/Category.ts'



type ActiveTaskProps = {
  tasks: Task[]
  today: Date
  onToggle: ( id: string ) => void,
  categories: Category[],
}

function ActiveTask ({tasks, today, onToggle, categories}: ActiveTaskProps) {

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
    <div className="flex flex-col">
      <div className="flex flex-wrap rounded-lg gap-2">
        {activeTasks.map((task) => (
          <button
            type="button"
            key={task.id}
            onClick={() => {
              setSelectedTaskId(task.id)
            }}
            className={`
            flex 
            gap-2 
            cursor-pointer 
            border
            glass-surface
            p-4
            `}
          >
            <span>{task.emoji}</span>
            <span
              className={`
              font-semibold 
              mr-2 
              ${task.id === selectedTaskId ? 'text-foreground' : 'text-muted'}
              transition-colors
              duration-500
              `}
            >
              {task.title}
            </span>
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
        key={selectedTask?.id ?? 'no-active-task'}
      />
    </div>
  )
}

export default ActiveTask
