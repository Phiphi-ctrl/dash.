import type { Task } from '../../../types/Task.ts'
import { useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { autoUpdate, flip, FloatingPortal, offset, shift, useFloating } from '@floating-ui/react'
import type { Category } from '../../../types/Category.ts'
import { getTaskColor } from '../../../utils/Category.ts'

type ActiveTaskCardProps = {
  activeTask: Task | undefined
  today: Date
  onToggle: ( id: string ) => void,
  now: Date
  totalTasksDurationMs: number
  pastCompletedDurationMs: number
  categories: Category[]
  dayProgressGradient: DayProgressGradient
}

export type DayProgressGradient = {
  id: string
  glowColor: string
  stops: DayProgressGradientStop[]
}

export type DayProgressGradientStop = {
  offset: string
  color: string
}

type ProgressTooltipKind =
  | 'task'
  | 'day'
  | 'daily'

function ActiveTaskCard({ activeTask, now, totalTasksDurationMs, pastCompletedDurationMs, categories, dayProgressGradient } : ActiveTaskCardProps) {



  const [progressTooltip, setProgressTooltip] =
    useState<ProgressTooltipKind | null>(null)
  const { refs: tooltipRefs, floatingStyles: tooltipStyles, isPositioned: isTooltipPositioned } = useFloating({
    open: progressTooltip !== null,
    placement: 'right',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [offset(12), flip({ padding: 8 }), shift({ padding: 8 })],
  })

  const color = getTaskColor(activeTask, categories)

  function getTaskProgress (task: Task, currentTime: Date) {
    const start = new Date(task.startAt)
    const end = new Date(task.endAt)
    const total = (end.getTime() - start.getTime())
    const elapsed = (currentTime.getTime() - start.getTime())
    return Math.min(Math.max((elapsed / total), 0), 1)
  }

  function getDayProgress (task: Task | undefined, currentTime: Date) {

    const elapsedTask = task ? task.completed ? (currentTime.getTime() - new Date(task.startAt).getTime()) : 0 : 0
    const elapsedDay = pastCompletedDurationMs + elapsedTask
    // guard against division by zero
    if(totalTasksDurationMs === 0) {
      return 0
    }
    return Math.min(Math.max((elapsedDay / totalTasksDurationMs), 0), 1)

  }

  function formatMinutesToString (m: number): string {
    const h = Math.floor(m/60)

    const minutes = Math.round(m%60)
    const days = Math.round(Math.floor(h/24))
    const hours = Math.round(h%24)

    if(days === 0 && hours === 0) {
      return `${minutes}m`
    }
    if(days === 0) {
      return `${hours}h ${minutes}m`
    }
    return `${days}d ${hours}h ${minutes}m`
  }

  function getTimeTillEndString (task: Task, currentTime: Date) {
    if(!task) {
      return '.  .  .'
    }
    const end = new Date(task.endAt)
    const current = new Date(currentTime)

    const m = (end.getTime() - current.getTime()) / 1000 / 60

    return formatMinutesToString(m)
  }

  function getMinutesSinceStart (task: Task, currentTime: Date) {
    if(!task) {
      return '.  .  .'
    }
    const start = new Date(task.startAt)
    const current = new Date(currentTime)

    const m = (current.getTime() - start.getTime()) / 1000 / 60

    return formatMinutesToString(m)
  }

  const viewBoxSize = 180

  const radiusTask = 60
  const radiusDay = 80

  const circumferenceTask = 2 * Math.PI * radiusTask
  const circumferenceDay = 2 * Math.PI * radiusDay

  const progressTask = activeTask ? getTaskProgress(activeTask, now) : 0

  const progressDay = getDayProgress(activeTask, now)

  const offsetTask = circumferenceTask * (1 - progressTask)
  const offsetDay = circumferenceDay * (1 - progressDay)
  const dayProgressStroke = `url(#${dayProgressGradient.id})`

  function formatProgressDay (progress: number) {
    const percentProgress = Math.round(progress * 100)
    return `${percentProgress}%`
  }

  function handleProgressTooltipMouseMove(
    kind: ProgressTooltipKind,
    event: MouseEvent<SVGCircleElement>,
  ) {
    const { clientX, clientY, currentTarget } = event
    tooltipRefs.setPositionReference({
      contextElement: currentTarget,
      getBoundingClientRect: () => new DOMRect(clientX, clientY, 0, 0),
    })
    setProgressTooltip(kind)
  }

  function hideProgressTooltip() {
    setProgressTooltip(null)
  }

  function renderProgressTooltip() {
    if (!progressTooltip) {
      return null
    }

    const tooltipContent =
      progressTooltip === 'task'
        ? activeTask && (
          <div className="flex gap-1">
            {getMinutesSinceStart(activeTask, now)}
            <span className="text-muted">of active task elapsed</span>
          </div>
        )
        : (
          <div className="flex gap-1">
            {formatProgressDay(progressDay)}
            <span className="text-muted">
              {progressTooltip === 'daily'
                ? 'of daily tasks completed'
                : 'of day tasks completed'}
            </span>
          </div>
        )

    if (!tooltipContent) {
      return null
    }

    return (
      <FloatingPortal>
        <div
          ref={tooltipRefs.setFloating}
          role="tooltip"
          className="
            pointer-events-none
            z-[120]

            whitespace-nowrap

            glass-surface

            px-2
            py-2

            text-xs
            font-medium
            text-foreground-secondary

            shadow-lg
          "
          style={{
            ...tooltipStyles,
            visibility: isTooltipPositioned ? 'visible' : 'hidden',
          }}
        >
          {tooltipContent}
        </div>
      </FloatingPortal>
    )
  }

  function renderDayProgressGradient() {
    return (
      <defs>
        <linearGradient
          id={dayProgressGradient.id}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          {dayProgressGradient.stops.map((stop) => (
            <stop
              key={`${stop.offset}-${stop.color}`}
              offset={stop.offset}
              stopColor={stop.color}
            />
          ))}
        </linearGradient>
      </defs>
    )
  }

  return (
    <div>
      {activeTask ? (
        <div className="grid grid-cols-1 rounded-lg gap-4">
          {/*If there is a task*/}
          {/*Progress Circles*/}
          <div className="flex justify-center items-center p-6">
            <div
              className={`relative size-[${viewBoxSize}px]`}
            >
              <svg
                className="overflow-visible"
                width={viewBoxSize}
                height={viewBoxSize}
                viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
              >
                {renderDayProgressGradient()}
                {/*TaskProgress*/}
                {/* background track Task*/}
                {progressTask === 0 ? (
                  <circle
                    className="text-border stroke-surface/10"
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radiusTask}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    onMouseMove={(event) => {
                      handleProgressTooltipMouseMove(
                        'task',
                        event,
                      )
                    }}
                    onMouseLeave={hideProgressTooltip}
                  />
                ) : (
                  <circle
                    className="text-border stroke-surface"
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radiusTask}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                  />
                )}

                {/* progressTask */}
                {progressTask > 0 ? (
                  <circle
                    style={{
                      '--progress-start': circumferenceTask,
                      '--progress-end': offsetTask,
                      '--task-active-color': color,
                    } as CSSProperties}
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radiusTask}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray={circumferenceTask}
                    strokeDashoffset={offsetTask}
                    strokeLinecap={'round'}
                    className="
                    active-task-progress-circle
                    stroke-[var(--task-active-color)]/80
                    "
                    onMouseMove={(event) => {
                      handleProgressTooltipMouseMove(
                        'task',
                        event,
                      )
                    }}
                    onMouseLeave={hideProgressTooltip}
                    transform={`rotate(-90 ${viewBoxSize / 2} ${viewBoxSize / 2})`}
                  />
                ) : (
                  <circle
                    style={{
                      '--progress-start': circumferenceTask,
                      '--progress-end': offsetTask,
                      '--task-active-color': color,
                    } as CSSProperties}
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radiusTask}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray={circumferenceTask}
                    strokeDashoffset={offsetTask}
                    strokeLinecap={'round'}
                    className="
                    active-task-progress-circle
                    stroke-[var(--task-active-color)]/80
                    "
                    transform={`rotate(-90 ${viewBoxSize / 2} ${viewBoxSize / 2})`}
                  />
                )}
                {/*DayProgress*/}
                {/*Background track DayProgress*/}
                {progressDay === 0 ? (
                  <circle
                    className="text-border stroke-surface"
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radiusDay}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    onMouseMove={(event) => {
                      handleProgressTooltipMouseMove(
                        'day',
                        event,
                      )
                    }}
                    onMouseLeave={hideProgressTooltip}
                  />
                ) : (
                  <circle
                    className="text-border stroke-surface"
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radiusDay}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                  />
                )}


                {/* progressTasksDay */}
                {progressDay > 0 ? (
                  <circle
                    style={{
                      '--progress-start': circumferenceDay,
                      '--progress-end': offsetDay,
                      '--task-active-color': dayProgressGradient.glowColor,
                    } as CSSProperties}
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radiusDay}
                    fill="none"
                    stroke={dayProgressStroke}
                    strokeWidth="10"
                    strokeDasharray={circumferenceDay}
                    strokeDashoffset={offsetDay}
                    strokeLinecap={'round'}
                    className="
                    active-task-progress-circle
                    "
                    onMouseMove={(event) => {
                      handleProgressTooltipMouseMove(
                        'day',
                        event,
                      )
                    }}
                    onMouseLeave={hideProgressTooltip}
                    transform={`rotate(-90 ${viewBoxSize / 2} ${viewBoxSize / 2})`}
                  />
                ) : (
                  <circle
                    style={{
                      '--progress-start': circumferenceDay,
                      '--progress-end': offsetDay,
                      '--task-active-color': dayProgressGradient.glowColor,
                    } as CSSProperties}
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radiusDay}
                    fill="none"
                    stroke={dayProgressStroke}
                    strokeWidth="10"
                    strokeDasharray={circumferenceDay}
                    strokeDashoffset={offsetDay}
                    strokeLinecap={'round'}
                    className="
                    active-task-progress-circle
                    "
                    transform={`rotate(-90 ${viewBoxSize / 2} ${viewBoxSize / 2})`}
                  />
                )}

              </svg>
              {/* center content */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-semibold text-3xl text-foreground">
                  {Math.round(progressTask * 100)}%
                </span>
                <span className="text-xs text-foreground-secondary">
                  {getTimeTillEndString(activeTask, now)} left
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 rounded-lg gap-4">
          {/*If there is no task*/}
          {/*Progress Circle*/}
          <div className="flex justify-center items-center p-6">
            <div
              className={`relative size-[${viewBoxSize}px]`}
            >
              <svg
                className="overflow-visible"
                width={viewBoxSize}
                height={viewBoxSize}
                viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
              >
                {renderDayProgressGradient()}
                {/* background track */}
                <circle
                  className="text-border stroke-surface"
                  cx={viewBoxSize / 2}
                  cy={viewBoxSize / 2}
                  r={radiusTask}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                />
                {/*DayProgress*/}
                {/*Background track DayProgress*/}
                {progressDay === 0 ? (
                  <circle
                    className="text-border stroke-surface"
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radiusDay}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    onMouseMove={(event) => {
                      handleProgressTooltipMouseMove(
                        'daily',
                        event,
                      )
                    }}
                    onMouseLeave={hideProgressTooltip}
                  />
                ) : (
                  <circle
                    className="text-border stroke-surface"
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radiusDay}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                  />
                )}

                {/* progressTasksDay */}
                {progressDay > 0 ? (
                  <circle
                    style={{
                      '--progress-start': circumferenceDay,
                      '--progress-end': offsetDay,
                      '--task-active-color': dayProgressGradient.glowColor,
                    } as CSSProperties}
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radiusDay}
                    fill="none"
                    stroke={dayProgressStroke}
                    strokeWidth="10"
                    strokeDasharray={circumferenceDay}
                    strokeDashoffset={offsetDay}
                    strokeLinecap={'round'}
                    className="
                    active-task-progress-circle
                    "
                    onMouseMove={(event) => {
                      handleProgressTooltipMouseMove(
                        'daily',
                        event,
                      )
                    }}
                    onMouseLeave={hideProgressTooltip}
                    transform={`rotate(-90 ${viewBoxSize / 2} ${viewBoxSize / 2})`}
                  />
                ) : (
                  <circle
                    style={{
                      '--progress-start': circumferenceDay,
                      '--progress-end': offsetDay,
                      '--task-active-color': dayProgressGradient.glowColor,
                    } as CSSProperties}
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radiusDay}
                    fill="none"
                    stroke={dayProgressStroke}
                    strokeWidth="10"
                    strokeDasharray={circumferenceDay}
                    strokeDashoffset={offsetDay}
                    strokeLinecap={'round'}
                    className="
                    active-task-progress-circle
                    "
                    transform={`rotate(-90 ${viewBoxSize / 2} ${viewBoxSize / 2})`}
                  />
                )}

              </svg>
              {/* center content */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-semibold text-3xl text-foreground">
                  {progressDay !== 0 ? Math.round(progressDay * 100) : 0}%
                </span>
                <span className="text-xs text-foreground-secondary">
                  {'completed'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )
      }
      {renderProgressTooltip()}
    </div>
  )
}

export default ActiveTaskCard
