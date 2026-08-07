import type { Task } from '../../../types/Task.ts'
import { useEffect, useState } from 'react'
import { Calendar, ArrowDownUp } from 'lucide-react'
import PulseDot from '../../ui/PulseDot.tsx'
import { getTimeRange } from '../../../utils/Datetime.ts'

type ActiveTaskProps = {
  tasks: Task[]
  today: Date
}

function ActiveTask ({tasks, today}: ActiveTaskProps) {

  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  const activeTask = tasks.find((task) => {
    const start = new Date(task.startAt)
    const end = new Date(task.endAt)

    return start <= now && now < end;
  })

  function getTaskProgress (task: Task, currentTime: Date) {
    const start = new Date(task.startAt)
    const end = new Date(task.endAt)
    const total = (end.getTime() - start.getTime())
    const elapsed = (currentTime.getTime() - start.getTime())
    return Math.min(Math.max((elapsed / total), 0), 1)
  }

  function getMinutesTillEnd (task: Task, currentTime: Date) {
    const end = new Date(task.endAt)
    const current = new Date(currentTime)
    return (end.getTime() - current.getTime()) / 1000 / 60
  }

  const minutesTillEndString = activeTask ? `${ Math.round(getMinutesTillEnd(activeTask, now))}m left` : ''

  const viewBoxSize = 180

  const radius = viewBoxSize * 0.4

  const circumference = 2 * Math.PI * radius

  const progress = activeTask ? getTaskProgress(activeTask, now) : 0

  const offset = circumference * (1 - progress)

  return (
    <div>
      {activeTask ? (
        <div className="grid grid-cols-1 border border-border rounded-lg p-8">
          {/*Task title*/}
          <div className="flex flex-col gap-4 p-2">
            <div className="flex text-muted h-9">
              <div className="flex justify-center items-center">In Progress</div>
              <div className="relative ml-auto">
                <PulseDot className="absolute right-3 top-3"/>
              </div>
            </div>
            <div className="text-xl">
              {activeTask.emoji} {activeTask.title}
            </div>
          </div>
          {/*Progress Circle*/}
          <div className="flex justify-center items-center p-6">
            <div className={`relative size-[${viewBoxSize}px]`}>
              <svg
                width={viewBoxSize}
                height={viewBoxSize}
                viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
              >
                {/* background track */}
                <circle
                  className="text-border"
                  cx={viewBoxSize / 2}
                  cy={viewBoxSize / 2}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="25"
                />

                {/* progress */}
                <circle
                  className="stroke-accent-secondary"
                  cx={viewBoxSize / 2}
                  cy={viewBoxSize / 2}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="25"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap={'round'}
                  transform={`rotate(-90 ${viewBoxSize / 2} ${viewBoxSize / 2})`}

                />

              </svg>
              {/* center content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-semibold text-3xl">
                  {Math.round(progress * 100)}%
                </span>
                <span className="text-xs text-foreground-secondary">
                  {minutesTillEndString}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2 p-6 text-foreground-secondary">
            <div className="flex gap-2">
              <div className="flex items-center justify-center">
                <Calendar className="size-4"/>
              </div>
              <div>
                {getTimeRange(activeTask.startAt, activeTask.endAt, today)}
              </div>
            </div>
            <div className="flex ml-auto gap-2">
              <div className="flex items-center justify-center">
                <ArrowDownUp className="size-4"/>
              </div>
              <div>
                {activeTask.priority}
              </div>
            </div>
          </div>
        </div>
        ) : (
        <span className="text-foreground-secondary">No current task enjoy your Free time!</span>
        )
      }
    </div>
  )
}

export default ActiveTask