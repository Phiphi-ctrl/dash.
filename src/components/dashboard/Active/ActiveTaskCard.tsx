import type { Task } from '../../../types/Task.ts'
import Checkbox from '../../ui/Checkbox.tsx'
import { ArrowDownUp, Calendar, SlidersHorizontal } from 'lucide-react'
import PulseDot from '../../ui/PulseDot.tsx'
import { useRef, useState } from 'react'
import * as React from 'react'
import { getTimeRange } from '../../../utils/Datetime.ts'

type ActiveTaskCardProps = {
  activeTask: Task | undefined
  today: Date
  onToggle: ( id: string ) => void,
  now: Date
}

type ToolTipPosition ={
  x: number
  y: number
}

function ActiveTaskCard({ activeTask, today, onToggle, now } : ActiveTaskCardProps) {



  const [tooltipPosition, setTooltipPosition] = useState<ToolTipPosition | null>(null)

  const progressCircleRef = useRef<HTMLDivElement>(null)


  function getTaskProgress (task: Task, currentTime: Date) {
    const start = new Date(task.startAt)
    const end = new Date(task.endAt)
    const total = (end.getTime() - start.getTime())
    const elapsed = (currentTime.getTime() - start.getTime())
    return Math.min(Math.max((elapsed / total), 0), 1)
  }

  function formatMinutesToString (m: number, keyword: string): string {
    const h = Math.floor(m/60)

    const minutes = Math.round(m%60)
    const days = Math.round(Math.floor(h/24))
    const hours = Math.round(h%24)

    if(days === 0 && hours === 0) {
      return `${minutes}m ${keyword}`
    }
    if(days === 0) {
      return `${hours}h ${minutes}m ${keyword}`
    }
    return `${days}d ${hours}h ${minutes}m ${keyword}`
  }

  function getTimeTillEndString (task: Task, currentTime: Date) {
    if(!task) {
      return '.  .  .'
    }
    const end = new Date(task.endAt)
    const current = new Date(currentTime)

    const m = (end.getTime() - current.getTime()) / 1000 / 60

    return formatMinutesToString(m, 'left')
  }

  function getMinutesSinceStart (task: Task, currentTime: Date) {
    if(!task) {
      return '.  .  .'
    }
    const start = new Date(task.startAt)
    const current = new Date(currentTime)

    const m = (current.getTime() - start.getTime()) / 1000 / 60

    return formatMinutesToString(m, 'elapsed')
  }

  const viewBoxSize = 180

  const radius = viewBoxSize * 0.4

  const circumference = 2 * Math.PI * radius

  const progress = activeTask ? getTaskProgress(activeTask, now) : 0

  const offset = circumference * (1 - progress)

  function handleProgressMouseMove (event: React.MouseEvent<SVGCircleElement>) {
    if (progressCircleRef.current === null) {
      return
    }
    const rect = progressCircleRef.current.getBoundingClientRect()

    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setTooltipPosition({
      x,
      y
    })
  }

  return (
    <div>
      {activeTask ? (
        <div className="grid grid-cols-1 rounded-lg gap-4 pt-8">
          {/*Functionality Buttons*/}
          <div className="flex gap-2 text-foreground-secondary">
            <div className="flex items-center justify-center">
              <div className="flex">
                <Checkbox
                  checked={activeTask.completed}
                  onChange={() => onToggle(activeTask.id)}
                  className={`
                text-muted
                hover:border-accent
                hover:text-accent
                `}

                />
              </div>
              <div className="">
                {'Pending'}
              </div>
            </div>
            <div className="flex ml-auto gap-2 items-center justify-center">
              <div className="flex">
                <SlidersHorizontal className="size-4"/>
              </div>
              <div>
                Details
              </div>
            </div>
          </div>
          {/*Task title*/}
          <div className="flex flex-col gap-4 p-2">
            <div className="flex h-9">
              <div className="flex justify-center items-center gap-2">
                <span className="text-5xl">{activeTask.emoji}</span>
                <span className="text-4xl font-bold">{activeTask.title}</span>
              </div>
              <div className="relative ml-auto">
                <PulseDot className="absolute right-3 top-3"/>
              </div>
            </div>
          </div>
          {/*Progress Circle*/}
          <div className="flex justify-center items-center p-6">
            <div
              className={`relative size-[${viewBoxSize}px]`}
              ref={progressCircleRef}
            >
              <svg
                className="overflow-visible"
                width={viewBoxSize}
                height={viewBoxSize}
                viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
              >
                {/* background track */}
                <circle
                  className="text-border stroke-surface"
                  cx={viewBoxSize / 2}
                  cy={viewBoxSize / 2}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="25"
                />

                {/* progress */}
                <circle
                  cx={viewBoxSize / 2}
                  cy={viewBoxSize / 2}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="25"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap={'round'}
                  className="
                  active-task-progress-circle
                  stroke-accent-secondary
                  "

                  onMouseMove={handleProgressMouseMove}
                  onMouseLeave={() => setTooltipPosition(null)}
                  transform={`rotate(-90 ${viewBoxSize / 2} ${viewBoxSize / 2})`}
                  style={{
                    '--progress-start': circumference,
                    '--progress-end': offset,
                  } as React.CSSProperties}

                />

              </svg>
              {/* center content */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-semibold text-3xl">
                  {Math.round(progress * 100)}%
                </span>
                <span className="text-xs text-foreground-secondary">
                  {getTimeTillEndString(activeTask, now)}
                </span>
              </div>
              {tooltipPosition && (
                <div
                  className="
                  pointer-events-none
                  absolute
                  rounded-lg
                  border border-border
                  bg-surface
                  px-2
                  py-1
                  text-xs
                  text-foreground
                  translate-x-1/3
                  -translate-y-1/2
                  w-max
                  "
                  style={{
                    left: tooltipPosition.x - 8,
                    top: tooltipPosition.y,
                  }}
                >
                  {getMinutesSinceStart(activeTask, now)}
                </div>
              )
              }
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
        <div className="grid grid-cols-1 rounded-lg gap-4 pt-8">
          {/*Functionality Buttons*/}
          <div className="flex gap-2 text-foreground-secondary">
            <div className="flex items-center justify-center">
              <div className="flex">
                <Checkbox
                  checked={false}
                  onChange={() => onToggle('')}
                  className={`
                text-muted
                `}

                />
              </div>
              <div className="">
                {'Pending'}
              </div>
            </div>
            <div className="flex ml-auto gap-2 items-center justify-center">
              <div className="flex">
                <SlidersHorizontal className="size-4"/>
              </div>
              <div>
                Details
              </div>
            </div>
          </div>
          {/*Task title*/}
          <div className="flex flex-col gap-4 p-2">
            <div className="flex h-9">
              <div className="flex justify-center items-center gap-2">
                <span className="text-5xl">{''}</span>
                <span className="text-muted text-4xl font-bold">{'Nothing here'}</span>
              </div>
            </div>
          </div>
          {/*Progress Circle*/}
          <div className="flex justify-center items-center p-6">
            <div
              className={`relative size-[${viewBoxSize}px]`}
              ref={progressCircleRef}
            >
              <svg
                className="overflow-visible"
                width={viewBoxSize}
                height={viewBoxSize}
                viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
              >
                {/* background track */}
                <circle
                  className="text-border stroke-surface"
                  cx={viewBoxSize / 2}
                  cy={viewBoxSize / 2}
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="25"
                />

              </svg>
              {/* center content */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-semibold text-3xl text-muted">
                  {Math.round(progress * 100)}%
                </span>
                <span className="text-xs text-foreground-secondary">
                  {'. . .'}
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
                {'. . .'}
              </div>
            </div>
            <div className="flex ml-auto gap-2">
              <div className="flex items-center justify-center">
                <ArrowDownUp className="size-4"/>
              </div>
              <div>
                {'. . .'}
              </div>
            </div>
          </div>
        </div>
      )
      }
    </div>
  )
}

export default ActiveTaskCard