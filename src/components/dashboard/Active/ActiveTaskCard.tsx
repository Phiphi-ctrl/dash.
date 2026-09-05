import type { Task } from '../../../types/Task.ts'
import Checkbox from '../../ui/Checkbox.tsx'
import { ArrowDownUp, Calendar, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { getTimeRange } from '../../../utils/Datetime.ts'
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
}

type ProgressTooltipKind =
  | 'task'
  | 'day'
  | 'daily'

type ProgressTooltipState = {
  kind: ProgressTooltipKind
  x: number
  y: number
}

function ActiveTaskCard({ activeTask, today, onToggle, now, totalTasksDurationMs, pastCompletedDurationMs, categories } : ActiveTaskCardProps) {



  const [progressTooltip, setProgressTooltip] =
    useState<ProgressTooltipState | null>(null)

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

  function formatProgressDay (progress: number) {
    const percentProgress = Math.round(progress * 100)
    return `${percentProgress}%`
  }

  function handleProgressTooltipMouseMove(
    kind: ProgressTooltipKind,
    event: MouseEvent<SVGCircleElement>,
  ) {
    setProgressTooltip({
      kind,
      x:
        event.clientX,
      y:
        event.clientY,
    })
  }

  function hideProgressTooltip() {
    setProgressTooltip(null)
  }

  function renderProgressTooltip() {
    if (!progressTooltip) {
      return null
    }

    const tooltipContent =
      progressTooltip.kind === 'task'
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
              {progressTooltip.kind === 'daily'
                ? 'of daily tasks completed'
                : 'of day tasks completed'}
            </span>
          </div>
        )

    if (!tooltipContent) {
      return null
    }

    return (
      <div
        className="
          pointer-events-none
          fixed
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
          left:
            progressTooltip.x,

          top:
            progressTooltip.y,

          transform:
            'translate(12px, -50%)',
        }}
      >
        {tooltipContent}
      </div>
    )
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
                    strokeWidth="15"
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
                      '--task-active-color': color,
                    } as CSSProperties}
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radiusDay}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray={circumferenceDay}
                    strokeDashoffset={offsetDay}
                    strokeLinecap={'round'}
                    className="
                    active-task-progress-circle
                    stroke-[var(--task-active-color)]/50
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
                      '--task-active-color': color,
                    } as CSSProperties}
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radiusDay}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeDasharray={circumferenceDay}
                    strokeDashoffset={offsetDay}
                    strokeLinecap={'round'}
                    className="
                    active-task-progress-circle
                    stroke-[var(--task-active-color)]/50
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
                <span className="text-muted text-4xl font-bold">Tasks</span>
              </div>
            </div>
          </div>
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
                {/* background track */}
                <circle
                  className="text-border stroke-surface"
                  cx={viewBoxSize / 2}
                  cy={viewBoxSize / 2}
                  r={radiusTask}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="25"
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
                    strokeWidth="15"
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
                    strokeWidth="15"
                  />
                )}

                {/* progressTasksDay */}
                {progressDay > 0 ? (
                  <circle
                    style={{
                      '--progress-start': circumferenceDay,
                      '--progress-end': offsetDay,
                      '--task-active-color': '#CC7E85',
                    } as CSSProperties}
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radiusDay}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="15"
                    strokeDasharray={circumferenceDay}
                    strokeDashoffset={offsetDay}
                    strokeLinecap={'round'}
                    className="
                    active-task-progress-circle
                    stroke-[var(--task-active-color)]
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
                      '--task-active-color': '#CC7E85',
                    } as CSSProperties}
                    cx={viewBoxSize / 2}
                    cy={viewBoxSize / 2}
                    r={radiusDay}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="15"
                    strokeDasharray={circumferenceDay}
                    strokeDashoffset={offsetDay}
                    strokeLinecap={'round'}
                    className="
                    active-task-progress-circle
                    stroke-[var(--task-active-color)]
                    "
                    transform={`rotate(-90 ${viewBoxSize / 2} ${viewBoxSize / 2})`}
                  />
                )}

              </svg>
              {/* center content */}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-semibold text-3xl text-foreground">
                  {Math.round(progressDay * 100)}%
                </span>
                <span className="text-xs text-foreground-secondary">
                  {'completed'}
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
      {renderProgressTooltip()}
    </div>
  )
}

export default ActiveTaskCard
