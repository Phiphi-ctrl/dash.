import {
  getStartOfWeek,
  dayFormatter,
  monthFormatter,
  getDayRange, getHourRange, getTimeRange,
} from '../../../utils/Datetime.ts'
import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { ChevronLeft, ChevronRight, Pen, Trash2, X } from 'lucide-react'
import type { Task } from '../../../types/Task.ts'

type CalendarProps = {
  today: Date
  tasks: Task[]
  onUpdateTask: (
      id: string,
      changes: Partial<Task>
  ) => void
  onCreateTaskAt: ( startAt: Date ) => void
  onEdit: (task: Task ) => void,
  onDelete: (id: string) => void,
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

export type DragState =
  | {
  mode: 'resize-end'
  taskId: string
  previewStartAt: string
  previewEndAt: string
}
  | {
  mode: 'move'
  taskId: string
  durationMs: number
  previewStartAt: string
  previewEndAt: string
}
  | null

function CalendarElement ({ today, tasks, onUpdateTask, onCreateTaskAt, onEdit, onDelete} : CalendarProps) {
  const [visibleWeekStart, setVisibleWeekStart] = useState(
    () => getStartOfWeek(today)
  )

  const [dragState, setDragState] =
      useState<DragState>(null)

  useEffect(() => {
    if (dragState === null) return

    function handlePointerUp() {
      if (dragState === null) return

      onUpdateTask(dragState.taskId, {
        startAt: dragState.previewStartAt,
        endAt: dragState.previewEndAt,
      })

      setDragState(null)
    }

    function handlePointerCancel() {
      setDragState(null)
    }

    window.addEventListener(
        'pointerup',
        handlePointerUp
    )

    window.addEventListener(
        'pointercancel',
        handlePointerCancel
    )

    return () => {
      window.removeEventListener(
          'pointerup',
          handlePointerUp
      )

      window.removeEventListener(
          'pointercancel',
          handlePointerCancel
      )
    }
  }, [dragState, onUpdateTask])

  const draggedCardRef =
      useRef<HTMLDivElement | null>(null)

  const firstRectRef =
      useRef<DOMRect | null>(null)

  const flipAnimationRef =
      useRef<Animation | null>(null)

  const draggedLayoutRef =
      useRef<HTMLDivElement | null>(null)

  const draggedSurfaceRef =
      useRef<HTMLDivElement | null>(null)

  function captureFirstRect() {
    firstRectRef.current =
        draggedLayoutRef.current?.getBoundingClientRect()
        ?? null
  }

  useLayoutEffect(() => {
    const layoutElement = draggedLayoutRef.current
    const cardElement = draggedCardRef.current
    const surfaceElement = draggedSurfaceRef.current
    const first = firstRectRef.current

    if (
        layoutElement === null ||
        first === null ||
        dragState === null
    ) {
      return
    }

    flipAnimationRef.current?.cancel()

    const last =
        layoutElement.getBoundingClientRect()

    const deltaX = first.left - last.left
    const deltaY = first.top - last.top

    const scaleX = first.width / last.width
    const scaleY = first.height / last.height

    if (
        dragState.mode === 'move' &&
        cardElement !== null
    ) {
      flipAnimationRef.current =
          cardElement.animate(
              [
                {
                  transform:
                      `translate(${deltaX}px, ${deltaY}px)`,
                },
                {
                  transform: 'translate(0, 0)',
                },
              ],
              {
                duration: 120,
                easing: 'ease-out',
              }
          )
    }

    if (
        dragState.mode === 'resize-end' &&
        surfaceElement !== null
    ) {
      flipAnimationRef.current =
          surfaceElement.animate(
              [
                {
                  transform:
                      `scale(${scaleX}, ${scaleY})`,
                  transformOrigin: 'top left',
                },
                {
                  transform: 'scale(1, 1)',
                  transformOrigin: 'top left',
                },
              ],
              {
                duration: 120,
                easing: 'ease-out',
              }
          )
    }
    firstRectRef.current = null
  }, [
      dragState?.previewStartAt,
      dragState?.previewEndAt,
      dragState
  ])

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
            onClick={() => {
              if (dragState !== null) return

              const startAt = getDateFromTimeSlot(
                  day,
                  timeSlot
              )

              onCreateTaskAt(startAt)
            }}
            onPointerEnter={() => {

              if (dragState === null) return


              if (dragState.mode === 'resize-end') {
                const newEnd = getDateFromTimeSlot(
                    day,
                    timeSlot + 1
                )

                captureFirstRect()
                setDragState((current) => {
                  if (current?.mode !== 'resize-end') {
                    return current
                  }

                  if (newEnd <= new Date(current.previewStartAt)) {
                    return current
                  }

                  return {
                    ...current,
                    previewEndAt: newEnd.toISOString(),
                  }
                })
              }

              if (dragState.mode === 'move') {
                const newStart = getDateFromTimeSlot(
                    day,
                    timeSlot
                )

                const newEnd = new Date(
                    newStart.getTime() + dragState.durationMs
                )
                captureFirstRect()
                setDragState((current) => {
                  if (current?.mode !== 'move') {
                    return current
                  }

                  return {
                    ...current,
                    previewStartAt: newStart.toISOString(),
                    previewEndAt: newEnd.toISOString(),
                  }
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

  const displayTasks = tasks.map((task) => {
    if (
        dragState === null ||
        task.id !== dragState.taskId
    ) {
      return task
    }

    return {
      ...task,
      startAt: dragState.previewStartAt,
      endAt: dragState.previewEndAt,
    }
  })

  function buildTaskSegments (taskList: Task[]) {
    const taskSegments: CalendarTaskSegment[] = []
    days.forEach((day, dayIndex) => {
      taskList.forEach((task) => {
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

  const taskSegments = buildTaskSegments(displayTasks)

  const positionedTaskSegments =
      layoutTaskSegments(taskSegments)

  const [isInfoOpen, setIsInfoOpen] = useState(false)

  const [infoTaskId, setInfoTaskId] = useState<string | null>(null)

  return (
    <div className="flex flex-col w-full gap-8">
      <div className="flex">
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
      {/*Day grid*/}
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
          h-140 overflow-y-auto
          ${dragState !== null ? 'select-none' : ''}
          `}
        >
          {timeSlots.map((timeSlot) => (
            timeSlotRow(timeSlot)
          ))}
          {positionedTaskSegments.map((segment) => {
            const timeRange = getHourRange(
              segment.task.startAt,
              segment.task.endAt
            )
            const startRange = timeRange[0]
            const popupToLeft = segment.dayIndex >= 5
            const endRange = timeRange[1]
            return (
              <div
                ref={
                  segment.task.id === dragState?.taskId
                    ? draggedLayoutRef
                    : undefined
                }
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
                m-0.5
                ${
                  infoTaskId === segment.task.id
                    ? 'z-50'
                    : 'z-10'
                }
                
                ${dragState !== null ? 'pointer-events-none' : ''}
                `}
              >
                <div
                  ref={
                    segment.task.id === dragState?.taskId
                      ? draggedCardRef
                      : undefined
                  }
                  className={`
                  relative
                  h-full
                  w-full
                  `}
                >
                  <div
                    ref={
                      segment.task.id === dragState?.taskId
                        ? draggedSurfaceRef
                        : undefined
                    }
                    className="
                      absolute
                      inset-0
                      overflow-hidden
                      rounded-md
                      bg-surface
                      "
                  >
                    <span
                      className="
                        absolute
                        left-1
                        top-1
                        bottom-1
                        w-1
                        rounded-lg
                        bg-surface-hover
                      "
                    />
                  </div>
                  <div>
                    <button
                      className={`
                      relative
                      z-10
                      h-full
                      w-full
                      flex
                      flex-col
                      ml-3
                      `}
                      onClick={() => {
                        setIsInfoOpen((current) => !current)
                        setInfoTaskId(segment.task.id)
                      }}
                    >
                      <div className="flex gap-1">
                        <span>{segment.task.emoji}</span>
                        <span className="truncate">{segment.task.title}</span>
                      </div>
                      <span className="flex text-foreground-secondary">
                        {startRange}–{endRange}
                      </span>
                    </button>
                    {isInfoOpen && infoTaskId === segment.task.id && (
                      <div
                        className={`
                        absolute
                        ${popupToLeft ? 'right-full mr-3' : 'left-full ml-3'}
                        top-0
                        z-50
                        w-64
                        glass-popover
                        p-4
                        flex
                        flex-col
                        gap-4
                        `}
                      >
                        <div className="flex items-center justify-end gap-4">
                          <div className="flex gap-4">
                            <button
                              onClick={() => {onEdit(segment.task)}}
                            >
                              <Pen className="size-4"/>
                            </button>
                            <button
                              onClick={() => {onDelete(segment.task.id)}}
                            >
                              <Trash2 className="size-4"/>
                            </button>
                          </div>
                          <button
                            onClick={() => setIsInfoOpen((current) => !current)}
                          >
                            <X className="size-4"/>
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <span>{segment.task.emoji}</span>
                          <span>{segment.task.title}</span>
                        </div>
                        <div className="flex flex-col text-foreground-secondary">
                          <span>{getTimeRange(segment.task.startAt, segment.task.endAt, today)}</span>
                          <span>{segment.task.completed ? 'Completed' : 'Pending'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div
                  className="
                    absolute
                    bottom-0
                    left-0
                    right-0
                    h-2
                    z-20
                    cursor-ns-resize
                    "
                  onPointerDown={(event) => {
                    event.preventDefault()

                    setDragState({
                      mode: 'resize-end',
                      taskId: segment.task.id,
                      previewStartAt: segment.task.startAt,
                      previewEndAt: segment.task.endAt,
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
                    z-20
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
                      previewStartAt: segment.task.startAt,
                      previewEndAt: segment.task.endAt,
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