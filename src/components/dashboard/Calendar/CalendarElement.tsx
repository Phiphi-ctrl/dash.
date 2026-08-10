import {
  getStartOfWeek,
  dayFormatter,
  monthFormatter,
  getDayRange,
  getHourRange,
  isSameDay,
  inputFormatter
} from '../../../utils/Datetime.ts'
import {Fragment, useEffect, useState} from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Task } from '../../../types/Task.ts'

type CalendarProps = {
  today: Date
  tasks: Task[]
  onUpdateTask: (
      id: string,
      changes: Partial<Task>
  ) => void
}

type CalendarTaskSegment = {
  task: Task
  dayIndex: number
  startSlot: number
  endSlot: number
}

type PositionedCalendarTaskSegment = CalendarTaskSegment & {
  laneIndex: number
  laneCount: number
}

function CalendarElement ({ today, tasks, onUpdateTask} : CalendarProps) {
  const [visibleWeekStart, setVisibleWeekStart] = useState(
    () => getStartOfWeek(today)
  )

  type DragState =
      | {
    mode: 'resize-end'
    taskId: string
  }
      | {
    mode: 'move'
    taskId: string
    durationMs: number
  }
      | null

  const [dragState, setDragState] =
      useState<DragState>(null)

  useEffect(() => {
    if (dragState === null) return

    function handlePointerUp() {
      setDragState(null)
    }

    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)

    return () => {
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [dragState])

  function getVisibleWeekEnd (date: Date) {
    const end = new Date(date)
    end.setDate(end.getDate() + 6)
    return end
  }

  function nextWeek (current: Date) {
    const nextWeek = new Date(current)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return nextWeek
  }

  function prevWeek (current: Date) {
    const prevWeek = new Date(current)
    prevWeek.setDate(prevWeek.getDate() - 7)
    return prevWeek
  }

  const days = Array.from(
    { length: 7 },
    (_, index) =>
      new Date(
        visibleWeekStart.getFullYear(),
        visibleWeekStart.getMonth(),
        visibleWeekStart.getDate() + index,
      )
  )

  const timeSlots = Array.from(
    { length: 96 },
    (_, index) => index
  )

  function isFullHour (timeSlot: number) {
    return timeSlot % 4 === 0
  }

  function getDateFromTimeSlot(day: Date, timeSlot: number) {
    const date = new Date(day)

    const hour = Math.floor(timeSlot / 4)
    const minute = (timeSlot % 4) * 15

    date.setHours(hour, minute, 0, 0)

    return date
  }

  function getTimeSlotFromDate(date: Date) {
    return (
      date.getHours() * 4 +
      Math.floor(date.getMinutes() / 15)
    )
  }

  function timeSlotRow(timeSlot: number) {
    return (
      <Fragment key={timeSlot}>
        {isFullHour(timeSlot) ? (
          <time
            style={{
              gridRow: timeSlot + 1,
              gridColumn: 1,
            }}
            className="text-muted -translate-y-1/2"
          >
            {`${timeSlot / 4}:00`}
          </time>
        ) : (
          <time
            style={{
              gridRow: timeSlot + 1,
              gridColumn: 1,
            }}
          />
        )}

        {days.map((day, dayIndex) => (
          <button
            key={day.getTime()}
            type="button"
            style={{
              gridRow: timeSlot + 1,
              gridColumn: dayIndex + 2,
            }}
            onPointerEnter={() => {

              if (dragState === null) return


              if (dragState?.mode === 'resize-end') {
                const newEnd = getDateFromTimeSlot(
                    day,
                    timeSlot + 1
                )

                onUpdateTask(dragState.taskId, {
                  endAt: newEnd.toISOString(),
                })
              }

              if (dragState?.mode === 'move') {
                const newStart = getDateFromTimeSlot(day, timeSlot)

                const newEnd = new Date(newStart.getTime() + dragState?.durationMs)

                onUpdateTask(dragState.taskId, {
                  endAt: newEnd.toISOString(),
                  startAt: newStart.toISOString(),
                })
              }


            }}
            className={`
            h-full
            w-full
            border-r-2
            border-border/10
            ${isFullHour(timeSlot) ? 'border-t-2' : ''}
          `}
          />
        ))}
      </Fragment>
    )
  }

  function buildTaskSegments () {
    const taskSegments: CalendarTaskSegment[] = []
    days.forEach((day, dayIndex) => {
      tasks.forEach((task) => {
        const dayStart = new Date(day)

        const dayEnd = new Date(day)
        dayEnd.setDate(dayEnd.getDate() + 1)

        const overlap = new Date(task.startAt) < dayEnd && new Date(task.endAt) > dayStart

        if(overlap) {
          const segmentStart = new Date(
            Math.max(new Date(task.startAt).getTime(), dayStart.getTime())
          )

          const segmentEnd = new Date(
            Math.min(new Date(task.endAt).getTime(), dayEnd.getTime())
          )

          const endSlot =
            segmentEnd.getTime() === dayEnd.getTime()
              ? 96
              : getTimeSlotFromDate(segmentEnd)

          const segment = {
            task: task,
            dayIndex: dayIndex,
            startSlot: getTimeSlotFromDate(segmentStart),
            endSlot: endSlot,
          }
          taskSegments.push(segment)
        }
      })
    })
    return taskSegments
  }

  function buildCollisionGroups(
      segments: CalendarTaskSegment[]
  ) {
    const sorted = [...segments].sort(
        (a, b) => a.startSlot - b.startSlot
    )

    const groups: CalendarTaskSegment[][] = []

    let currentGroup: CalendarTaskSegment[] = []
    let currentGroupEnd = -1

    sorted.forEach((segment) => {
      if (currentGroup.length === 0) {
        currentGroup.push(segment)
        currentGroupEnd = segment.endSlot
        return
      }

      if (segment.startSlot < currentGroupEnd) {
        currentGroup.push(segment)

        currentGroupEnd = Math.max(
            currentGroupEnd,
            segment.endSlot
        )
      } else {
        groups.push(currentGroup)

        currentGroup = [segment]
        currentGroupEnd = segment.endSlot
      }
    })

    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }

    return groups
  }

  function layoutCollisionGroup(
      group: CalendarTaskSegment[]
  ): PositionedCalendarTaskSegment[] {
    const laneEnds: number[] = []

    const assigned = group.map((segment) => {
      let laneIndex = laneEnds.findIndex(
          (laneEnd) => laneEnd <= segment.startSlot
      )

      if (laneIndex === -1) {
        laneIndex = laneEnds.length
        laneEnds.push(segment.endSlot)
      } else {
        laneEnds[laneIndex] = segment.endSlot
      }

      return {
        segment,
        laneIndex,
      }
    })

    const laneCount = laneEnds.length

    return assigned.map(({ segment, laneIndex }) => ({
      ...segment,
      laneIndex,
      laneCount,
    }))
  }

  function layoutTaskSegments(
      segments: CalendarTaskSegment[]
  ): PositionedCalendarTaskSegment[] {
    const positionedSegments: PositionedCalendarTaskSegment[] = []

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const daySegments = segments.filter(
          (segment) => segment.dayIndex === dayIndex
      )

      const collisionGroups =
          buildCollisionGroups(daySegments)

      collisionGroups.forEach((group) => {
        const positionedGroup =
            layoutCollisionGroup(group)

        positionedSegments.push(...positionedGroup)
      })
    }

    return positionedSegments
  }

  const taskSegments = buildTaskSegments()

  const positionedTaskSegments =
      layoutTaskSegments(taskSegments)

  return (
    <div className="flex flex-col w-full gap-8">
      <div className="flex p-6">
        <div className="text-3xl font-bold">
          {monthFormatter.format(visibleWeekStart)}
        </div>
        <div className="flex gap-4 text-foreground-secondary ml-auto">
          <button
            type="button"
            className="cursor-pointer"
            onClick={() => setVisibleWeekStart((current) => prevWeek(current))}
          >
            <ChevronLeft className="size-6" />
          </button>
          <span className="flex items-center justify-center">{getDayRange(
            visibleWeekStart.toDateString(),
            getVisibleWeekEnd(visibleWeekStart).toDateString()
          )}
          </span>
          <button
            type="button"
            className="cursor-pointer"
            onClick={() => setVisibleWeekStart((current) => nextWeek(current))}
          >
            <ChevronRight className="size-6" />
          </button>
        </div>
      </div>
      <div className="flex flex-col w-full">
        <div className="grid grid-cols-[4rem_repeat(7,minmax(0,1fr))] place-items-center">
          <time></time>
          {days.map((day) => (
            <button
              className={`
              flex 
              
              border-border 
              text-foreground-secondary 
              w-full 
              h-8 
              justify-center
              `}
              key={day.getTime()}
            >
              <div
                className={`
                flex items-center justify-center
                rounded-lg
                p-3
                `}>
                {dayFormatter.format(day)}
              </div>
            </button>
          ))}
        </div>
        {/*Calendar grid*/}
        <div className={`
          grid
          grid-cols-[4rem_repeat(7,minmax(0,1fr))]
          grid-rows-[repeat(96,1.25rem)]
          w-full
          h-120 overflow-y-auto
          ${dragState !== null ? 'select-none' : ''}
          `}
        >
          {timeSlots.map((timeSlot) => (
            timeSlotRow(timeSlot)
          ))}

          {positionedTaskSegments.map((segment) => {
            console.log(positionedTaskSegments)
            const slotSpan = segment.endSlot - segment.startSlot
            const isVeryNarrow = segment.laneCount >= 3
            const timeRange = getHourRange(
              segment.task.startAt,
              segment.task.endAt
            )
            const isTiny = slotSpan <= 2
            const startRange = timeRange[0]
            const endRange = timeRange[1]
            return (
              <div
                key={`${segment.task.id}-${segment.dayIndex}`}
                style={{
                  gridColumn: segment.dayIndex + 2,
                  gridRow: `${segment.startSlot + 1} / ${segment.endSlot + 1}`,

                  width: `${100 / segment.laneCount}%`,
                  transform: `translateX(${segment.laneIndex * 100}%)`,
                  justifySelf: 'start',
                }}
                className={`
                relative
                z-10
                m-0.5
                overflow-hidden
                rounded-md
                bg-accent-soft
                ${dragState !== null ? 'pointer-events-none' : ''}
                ${isTiny ? 'px-1' : 'p-1'}
                transition-[width,height,transform,background-color]
                duration-150
                ease-out
                `}
              >
                <div
                  className={`
                  flex min-w-0
                  pl-3
                  ${isTiny ? 'flex-col text-xs pt-2' : 'flex-col'}
                  cursor-pointer
                  `}

                >
                  <span
                    className="
                    absolute
                    left-1
                    top-1
                    bottom-1
                    w-1
                    rounded-lg
                    bg-accent
                    "
                  />
                  <div className="flex flex-wrap">
                      <span>{segment.task.emoji}</span>
                      <span className="truncate">{segment.task.title}</span>
                  </div>
                  {slotSpan >= 3 && !isVeryNarrow && (
                      <span className="truncate whitespace-nowrap text-foreground-secondary">
                        {startRange}–{endRange}
                      </span>
                  )}
                </div>
                <div
                    className="
                    absolute
                    bottom-0
                    left-0
                    right-0
                    h-2
                    cursor-ns-resize
                    "
                    onPointerDown={(event) => {
                      event.preventDefault()

                      setDragState({
                        mode: 'resize-end',
                        taskId: segment.task.id,
                      })
                    }}
                />
                <div
                    className="
                    absolute
                    top-0
                    left-0
                    right-0
                    h-3
                    cursor-grab
                    "
                    onPointerDown={(event) => {
                      event.preventDefault()
                      event.stopPropagation()

                      const start = new Date(segment.task.startAt)
                      const end = new Date(segment.task.endAt)

                      setDragState({
                        mode: 'move',
                        taskId: segment.task.id,
                        durationMs: end.getTime() - start.getTime(),
                      })
                    }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CalendarElement