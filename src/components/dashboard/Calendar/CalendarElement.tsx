import {
  arrow,
  autoUpdate,
  flip,
  FloatingPortal,
  hide,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react'
import {
  dayFormatter,
  monthFormatter,
  getDayRange, getHourRange, getTimeRange, isSameDay, getDuration, timeFormatter,
} from '../../../utils/Datetime.ts'
import {
  Fragment,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import { CheckCheck, ChevronLeft, ChevronRight, ClockFading, LayoutDashboard, Pen, Trash2, X } from 'lucide-react'
import type { Task } from '../../../types/Task.ts'
import * as React from 'react'
import type { Category } from '../../../types/Category.ts'
import { getTaskCategory, getTaskColor } from '../../../utils/Category.ts'
import ViewSelector from '../ViewSelector.tsx'
import GradientTaskButton from '../../ui/GradientTaskButton.tsx'
import { useTimeOfDay } from '../../../context/TimeOfDayContext.ts'
import { useResponsive } from '../../../context/ResponsiveContext.ts'
import {
  buildTaskSegments,
  getCalendarDays,
  getDateFromTimeSlot,
  layoutTaskSegments,
  shiftCalendarDate,
  type PositionedCalendarTaskSegment,
  type CalendarView,
} from './calendarLayout.ts'
import MonthCalendarWrapper from './MonthCalendarWrapper.tsx'

type CalendarProps = {
  today: Date
  tasks: Task[]
  onUpdateTask: (
      id: string,
      changes: Partial<Task>
  ) => void
  onCreateTaskAt: ( startAt: Date ) => void
  onAddTask: () => void
  onEdit: (task: Task ) => void,
  onDelete: (id: string) => void,
  categories: Category[]
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

type PendingSegmentInteraction = {
  pointerId: number
  taskId: string
  anchorElement: HTMLButtonElement
  startX: number
  startY: number
  durationMs: number
  grabOffsetSlots: number
  previewStartAt: string
  previewEndAt: string
  dragStarted: boolean
}

type MovePreview = {
  previewStartAt: string
  previewEndAt: string
}

const taskSegmentDragThresholdPx = 5
const calendarViewOptions = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
] as const
const calendarSlotDurationMs = 15 * 60 * 1000
const taskInfoArrowWidthPx = 18
const taskInfoArrowHeightPx = 9
const taskInfoArrowTipRadiusPx = 2
const taskInfoArrowShoulderPx = 4
const taskInfoCornerRadiusPx = 32
const taskInfoSurfacePaddingPx = taskInfoArrowHeightPx + 3

function getTaskInfoSurfacePath(
    width: number,
    height: number,
    placementSide: string,
    arrowX: number | undefined,
    arrowY: number | undefined
): string {
  const padding = taskInfoSurfacePaddingPx
  const left = padding + 0.5
  const top = padding + 0.5
  const right = padding + width - 0.5
  const bottom = padding + height - 0.5
  const radius = Math.min(taskInfoCornerRadiusPx, (width - 1) / 2, (height - 1) / 2)
  const half = taskInfoArrowWidthPx / 2
  const depth = taskInfoArrowHeightPx
  const tip = taskInfoArrowTipRadiusPx
  const shoulder = taskInfoArrowShoulderPx
  const slope = shoulder / 2
  const x = padding + (arrowX ?? 0) + half
  const y = padding + (arrowY ?? 0) + half

  // The same silhouette clips the glass and draws its border, leaving no join to cover.
  return [
    `M ${left + radius} ${top}`,
    placementSide === 'bottom'
      ? `H ${x - half - shoulder} Q ${x - half} ${top} ${x - half + slope} ${top - slope} L ${x - tip} ${top - depth + tip} Q ${x} ${top - depth} ${x + tip} ${top - depth + tip} L ${x + half - slope} ${top - slope} Q ${x + half} ${top} ${x + half + shoulder} ${top}`
      : '',
    `H ${right - radius} A ${radius} ${radius} 0 0 1 ${right} ${top + radius}`,
    placementSide === 'left'
      ? `V ${y - half - shoulder} Q ${right} ${y - half} ${right + slope} ${y - half + slope} L ${right + depth - tip} ${y - tip} Q ${right + depth} ${y} ${right + depth - tip} ${y + tip} L ${right + slope} ${y + half - slope} Q ${right} ${y + half} ${right} ${y + half + shoulder}`
      : '',
    `V ${bottom - radius} A ${radius} ${radius} 0 0 1 ${right - radius} ${bottom}`,
    placementSide === 'top'
      ? `H ${x + half + shoulder} Q ${x + half} ${bottom} ${x + half - slope} ${bottom + slope} L ${x + tip} ${bottom + depth - tip} Q ${x} ${bottom + depth} ${x - tip} ${bottom + depth - tip} L ${x - half + slope} ${bottom + slope} Q ${x - half} ${bottom} ${x - half - shoulder} ${bottom}`
      : '',
    `H ${left + radius} A ${radius} ${radius} 0 0 1 ${left} ${bottom - radius}`,
    placementSide === 'right'
      ? `V ${y + half + shoulder} Q ${left} ${y + half} ${left - slope} ${y + half - slope} L ${left - depth + tip} ${y + tip} Q ${left - depth} ${y} ${left - depth + tip} ${y - tip} L ${left - slope} ${y - half + slope} Q ${left} ${y - half} ${left} ${y - half - shoulder}`
      : '',
    `V ${top + radius} A ${radius} ${radius} 0 0 1 ${left + radius} ${top} Z`,
  ].join(' ')
}

function getCalendarMovePreviewAtPoint(
    clientX: number,
    clientY: number,
    durationMs: number,
    grabOffsetSlots: number
): MovePreview | null {
  const slotElement =
      document.elementsFromPoint(clientX, clientY).find(
          (element): element is HTMLElement =>
            element instanceof HTMLElement &&
            element.dataset.calendarSlotStartAt !== undefined
      )

  const slotStartAt =
      slotElement?.dataset.calendarSlotStartAt

  if (slotStartAt === undefined) {
    return null
  }

  const cursorSlotStart = new Date(slotStartAt)

  if (Number.isNaN(cursorSlotStart.getTime())) {
    return null
  }

  const newStart =
      new Date(
          cursorSlotStart.getTime() -
          grabOffsetSlots * calendarSlotDurationMs
      )

  const newEnd =
      new Date(newStart.getTime() + durationMs)

  return {
    previewStartAt: newStart.toISOString(),
    previewEndAt: newEnd.toISOString(),
  }
}

function CalendarElement ({ today, tasks, onUpdateTask, onCreateTaskAt, onAddTask, onEdit, onDelete, categories} : CalendarProps) {
  const { theme: timeOfDay } = useTimeOfDay()
  const [view, setView] = useState<CalendarView>('week')
  const [visibleDate, setVisibleDate] = useState(
    () => getCalendarDays(today, 'day')[0]
  )

  const [now, setNow] = useState(() => new Date())

  const { isMobile } = useResponsive()

  const effectiveView: CalendarView =
    isMobile ? 'day' : view

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date())
    }, 10000)

    return () => {
      window.clearInterval(intervalId)
    }
  },[])

  const [dragState, setDragState] =
      useState<DragState>(null)

  const [infoTaskId, setInfoTaskId] = useState<string | null>(null)

  const [infoPortalElement, setInfoPortalElement] = useState<HTMLDivElement | null>(null)

  const [
    infoAnchorElement,
    setInfoAnchorElement,
  ] =
    useState<HTMLButtonElement | null>(null)

  const [
    infoFloatingElement,
    setInfoFloatingElement,
  ] =
    useState<HTMLDivElement | null>(null)

  const [
    infoArrowElement,
    setInfoArrowElement,
  ] =
    useState<HTMLSpanElement | null>(null)

  const isTaskInfoOpen =
    infoTaskId !== null &&
    infoAnchorElement !== null

  const [isSelectionCalendarOpen, setSelectionCalendarOpen] = useState<boolean>(false)

  function toggleSelectionCalendarOpen() {
    setSelectionCalendarOpen((current) => !current)
  }

  const {
    floatingStyles: taskInfoFloatingStyles,
    isPositioned: isTaskInfoPositioned,
    middlewareData: taskInfoMiddlewareData,
    placement: taskInfoPlacement,
  } = useFloating({
    open:
      isTaskInfoOpen,

    elements: {
      reference:
        infoAnchorElement,

      floating:
        infoFloatingElement,
    },

    placement:
      'right-start',

    strategy:
      'absolute',

    whileElementsMounted:
      autoUpdate,

    middleware: [
      offset(16),

      flip({
        padding:
          12,

        fallbackPlacements: [
          'left-start',
          'right-start',
          'bottom-start',
          'top-start',
        ],
      }),

      shift({
        padding:
          12,
      }),

      arrow({
        element:
          infoArrowElement,

        padding:
          taskInfoCornerRadiusPx + taskInfoArrowShoulderPx + 1,
      }),

      hide({ strategy: 'referenceHidden' }),

      {
        name: 'surface',
        fn: ({ rects, placement, middlewareData }) => ({
          data: {
            path: getTaskInfoSurfacePath(
              rects.floating.width,
              rects.floating.height,
              placement.split('-')[0],
              middlewareData.arrow?.x,
              middlewareData.arrow?.y
            ),
          },
        }),
      },
    ],
  })

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

  const calendarGridRef =
      useRef<HTMLDivElement | null>(null)

  const currentTimeIndicatorRef =
      useRef<HTMLDivElement | null>(null)

  const hasScrolledToCurrentTimeRef =
      useRef(false)

  const pendingSegmentInteractionRef =
      useRef<PendingSegmentInteraction | null>(null)

  function captureFirstRect() {
    firstRectRef.current =
        draggedLayoutRef.current?.getBoundingClientRect()
        ?? null
  }

  useEffect(() => {
    function updateMovePreviewFromPointer(
        event: PointerEvent,
        pending: PendingSegmentInteraction
    ): MovePreview | null {
      const preview =
          getCalendarMovePreviewAtPoint(
              event.clientX,
              event.clientY,
              pending.durationMs,
              pending.grabOffsetSlots
          )

      if (preview === null) {
        return null
      }

      firstRectRef.current =
          draggedLayoutRef.current?.getBoundingClientRect()
          ?? null

      setDragState((current) => {
        if (
            current?.mode !== 'move' ||
            current.taskId !== pending.taskId
        ) {
          return current
        }

        if (
            current.previewStartAt === preview.previewStartAt &&
            current.previewEndAt === preview.previewEndAt
        ) {
          return current
        }

        return {
          ...current,
          previewStartAt: preview.previewStartAt,
          previewEndAt: preview.previewEndAt,
        }
      })

      return preview
    }

    function handlePointerMove(event: PointerEvent) {
      const pending =
          pendingSegmentInteractionRef.current

      if (
          pending === null ||
          pending.pointerId !== event.pointerId
      ) {
        return
      }

      if (pending.dragStarted) {
        updateMovePreviewFromPointer(event, pending)
        return
      }

      const deltaX = event.clientX - pending.startX
      const deltaY = event.clientY - pending.startY
      const distance =
          Math.hypot(deltaX, deltaY)

      if (distance < taskSegmentDragThresholdPx) {
        return
      }

      pending.dragStarted = true
      setInfoTaskId(null)
      setInfoAnchorElement(null)

      const preview =
          getCalendarMovePreviewAtPoint(
              event.clientX,
              event.clientY,
              pending.durationMs,
              pending.grabOffsetSlots
          )

      setDragState({
        mode: 'move',
        taskId: pending.taskId,
        durationMs: pending.durationMs,
        previewStartAt:
          preview?.previewStartAt ?? pending.previewStartAt,
        previewEndAt:
          preview?.previewEndAt ?? pending.previewEndAt,
      })
    }

    function handlePointerUp(event: PointerEvent) {
      const pending =
          pendingSegmentInteractionRef.current

      if (
          pending === null ||
          pending.pointerId !== event.pointerId
      ) {
        return
      }

      pendingSegmentInteractionRef.current = null

      if (pending.dragStarted) {
        return
      }

      const isClosingCurrentInfo =
        infoTaskId === pending.taskId &&
        infoAnchorElement === pending.anchorElement

      setInfoTaskId(
        isClosingCurrentInfo
          ? null
          : pending.taskId
      )

      setInfoAnchorElement(
        isClosingCurrentInfo
          ? null
          : pending.anchorElement
      )
    }

    function handlePointerCancel(event: PointerEvent) {
      const pending =
          pendingSegmentInteractionRef.current

      if (
          pending === null ||
          pending.pointerId !== event.pointerId
      ) {
        return
      }

      pendingSegmentInteractionRef.current = null
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerCancel)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerCancel)
    }
  }, [infoAnchorElement, infoTaskId])

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

  function closeTaskInfo() {
    setInfoTaskId(null)
    setInfoAnchorElement(null)
  }

  function toggleTaskInfo(
      taskId: string,
      anchorElement: HTMLButtonElement
  ) {
    const isClosingCurrentInfo =
      infoTaskId === taskId &&
      infoAnchorElement === anchorElement

    setInfoTaskId(
      isClosingCurrentInfo
        ? null
        : taskId
    )

    setInfoAnchorElement(
      isClosingCurrentInfo
        ? null
        : anchorElement
    )
  }

  function handleTaskSegmentPointerDown(
      event: ReactPointerEvent<HTMLButtonElement>,
      segment: PositionedCalendarTaskSegment
  ) {
    if (event.button !== 0) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const start = new Date(segment.task.startAt)
    const end = new Date(segment.task.endAt)
    const segmentRect =
        event.currentTarget.getBoundingClientRect()
    const segmentSlotSpan =
        segment.endSlot - segment.startSlot
    const grabOffsetRatio =
        segmentRect.height === 0
          ? 0
          : (event.clientY - segmentRect.top) / segmentRect.height
    const grabOffsetSlots =
        Math.min(
            Math.max(
                Math.floor(grabOffsetRatio * segmentSlotSpan),
                0
            ),
            Math.max(segmentSlotSpan - 1, 0)
        )

    pendingSegmentInteractionRef.current = {
      pointerId: event.pointerId,
      taskId: segment.task.id,
      anchorElement: event.currentTarget,
      startX: event.clientX,
      startY: event.clientY,
      durationMs: end.getTime() - start.getTime(),
      grabOffsetSlots,
      previewStartAt: segment.task.startAt,
      previewEndAt: segment.task.endAt,
      dragStarted: false,
    }
  }

  function resetCalendarInteraction() {
    closeTaskInfo()
    pendingSegmentInteractionRef.current = null
    setDragState(null)
  }

  function changeView(nextView: CalendarView) {
    if (nextView === effectiveView) return
    resetCalendarInteraction()
    setView(nextView)
  }

  function navigateCalendar(direction: -1 | 1) {
    resetCalendarInteraction()
    setVisibleDate((current) => shiftCalendarDate(current, effectiveView, direction))
  }

  const days = getCalendarDays(visibleDate, effectiveView)
  const visibleStart = days[0]
  const visibleEnd = days[days.length - 1]
  const gridTemplateColumns = `4rem repeat(${days.length}, minmax(0, 1fr))`

  const timeSlots = Array.from(
    { length: 96 },
    (_, index) => index
  )

  function isFullHour (timeSlot: number) {
    return timeSlot % 4 === 0
  }

  const currentDayIndex = days.findIndex((day) => isSameDay(day, now))

  const currentMinutes =
    now.getHours() * 60 +
    now.getMinutes() +
    now.getSeconds() / 60

  const currentSlotIndex =
    Math.floor(currentMinutes / 15)

  const currentSlotFraction =
    (currentMinutes % 15) / 15

  const currentTimeOffsetRem =
    currentSlotFraction * 1.25

  useLayoutEffect(() => {
    if (
        hasScrolledToCurrentTimeRef.current ||
        currentDayIndex === -1
    ) {
      return
    }

    const scrollElement =
        calendarGridRef.current
    const currentTimeIndicator =
        currentTimeIndicatorRef.current

    if (
        scrollElement === null ||
        currentTimeIndicator === null
    ) {
      return
    }

    const animationFrameId =
        window.requestAnimationFrame(() => {
          const scrollRect =
              scrollElement.getBoundingClientRect()
          const indicatorRect =
              currentTimeIndicator.getBoundingClientRect()

          const indicatorCenter =
              indicatorRect.top -
              scrollRect.top +
              scrollElement.scrollTop +
              indicatorRect.height / 2
          const maxScrollTop =
              Math.max(
                  scrollElement.scrollHeight -
                  scrollElement.clientHeight,
                  0
              )

          scrollElement.scrollTop =
              Math.min(
                  Math.max(
                      indicatorCenter -
                      scrollElement.clientHeight / 2,
                      0
                  ),
                  maxScrollTop
              )

          hasScrolledToCurrentTimeRef.current = true
        })

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [
      currentDayIndex,
      currentSlotIndex,
      currentTimeOffsetRem
  ])

  function timeSlotRow(timeSlot: number) {
    return (
      <Fragment key={timeSlot}>
        {isFullHour(timeSlot) ? (
          <time
            style={{
              gridRow: timeSlot + 1,
              gridColumn: 1,
            }}
            className="text-muted -translate-y-1/2 select-none"
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
            data-calendar-slot-start-at={
              getDateFromTimeSlot(day, timeSlot).toISOString()
            }
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
            border-r-1
            border-border/40
            select-none
            transition-[border-radius,background-color,color]
            duration-600
            ease-out
            ${isFullHour(timeSlot) ? 'border-t-2' : ''}
            ${dayIndex === days.length - 1 ? '!border-r-0' : ''}
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

  const taskSegments = buildTaskSegments(displayTasks, days)

  const positionedTaskSegments =
      layoutTaskSegments(taskSegments, days.length)

  const infoTask =
    infoTaskId === null
      ? undefined
      : displayTasks.find((task) => task.id === infoTaskId)

  const infoTaskColor =
    getTaskColor(infoTask, categories)

  const taskInfoPlacementSide =
    taskInfoPlacement.split('-')[0]

  const taskInfoSurfacePath = taskInfoMiddlewareData.surface?.path as string | undefined

  function renderTaskInfoPopover() {
    if (
      !isTaskInfoOpen ||
      infoTask === undefined ||
      infoPortalElement === null
    ) {
      return null
    }

    return (
      <FloatingPortal root={infoPortalElement}>
        <div
          ref={setInfoFloatingElement}
          data-placement={taskInfoPlacementSide}
          style={{
            ...taskInfoFloatingStyles,
            '--task-info-surface-padding': `${taskInfoSurfacePaddingPx}px`,
            borderRadius: taskInfoCornerRadiusPx,
            visibility:
              isTaskInfoPositioned && taskInfoSurfacePath && !taskInfoMiddlewareData.hide?.referenceHidden
                ? 'visible'
                : 'hidden',
          } as React.CSSProperties}
          className="
            z-50
            pointer-events-auto
            w-78
            max-w-[calc(100%-1.5rem)]
            calendar-task-info-popover
            p-4
            flex
            flex-col
            gap-8
          "
        >
          <span
            ref={setInfoArrowElement}
            aria-hidden="true"
            style={{ width: taskInfoArrowWidthPx, height: taskInfoArrowWidthPx }}
            className="absolute invisible pointer-events-none"
          />
          <div
            aria-hidden="true"
            className="glass-surface calendar-task-info-surface"
            style={{ clipPath: taskInfoSurfacePath ? `path('${taskInfoSurfacePath}')` : undefined }}
          />
          <svg aria-hidden="true" className="calendar-task-info-outline">
            <path d={taskInfoSurfacePath} fill="none" strokeWidth={1} strokeLinejoin="round" />
          </svg>
          <div className="flex items-center justify-end gap-4 text-foreground">
            <div className="flex gap-4">
              <button
                onClick={() => {onEdit(infoTask)}}
              >
                <Pen className="size-4"/>
              </button>
              <button
                onClick={() => {
                  onDelete(infoTask.id)
                  closeTaskInfo()
                }}
              >
                <Trash2 className="size-4"/>
              </button>
            </div>
            <button
              onClick={closeTaskInfo}
            >
              <X className="size-4"/>
            </button>
          </div>
          <div className="flex gap-2 text-foreground">
            <span>{infoTask.emoji}</span>
            <span>{infoTask.title}</span>
          </div>
          <div className="flex flex-col text-foreground-secondary gap-2">
            <div className="flex gap-2 items-center">
              <span
                style={{
                  '--task-color-task': infoTaskColor,
                } as React.CSSProperties}
                className="bg-[var(--task-color-task)] rounded-full size-4"
              />
              <span>{getTimeRange(infoTask.startAt, infoTask.endAt, today)}</span>
            </div>
            <div className="flex gap-2 items-center">
              <LayoutDashboard className="size-4"/>
              <span>{getTaskCategory(infoTask, categories)}</span>
            </div>
            <div className="flex gap-2 items-center">
              <ClockFading className="size-4"/>
              <span>{getDuration(infoTask.startAt, infoTask.endAt)}</span>
            </div>
            <div className="flex gap-2 items-center">
              <CheckCheck className="size-4"/>
              <span>{infoTask.completed ? 'Completed' : 'Pending'}</span>
            </div>

          </div>
        </div>
      </FloatingPortal>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col w-full gap-8">
      <div className="flex flex-col gap-3 mt-5">
        {/*Year*/}
        <div className="text-3xl font-bold text-foreground whitespace-nowrap">
          {monthFormatter.formatToParts(visibleStart).map((part, index) => (
            <span
              key={`${part.type}-${index}`}
              className={part.type === 'year' ? `${timeOfDay.gradient} bg-clip-text text-transparent` : undefined}
            >
                {part.value}
              </span>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          {/*Buttons*/}
          <div className="flex items-center gap-2">
            <ViewSelector
              view={effectiveView}
              options={calendarViewOptions}
              label="Calendar view"
              onSelect={changeView}
              disabled={isMobile}
            />
            <GradientTaskButton size="compact" onClick={onAddTask} />
          </div>
          {/*Chevron day cycle*/}
          <div className={`flex gap-4 text-foreground-secondary ml-auto glass-surface justify-between ${effectiveView === 'week' ? 'w-50' : 'w-35'}  max-w-full shrink-0 py-1`}>
            <button
              type="button"
              aria-label={`Previous ${effectiveView}`}
              className="cursor-pointer hover:scale-110 hover:text-foreground tranistion-all duration-300"
              onClick={() => navigateCalendar(-1)}
            >
              <ChevronLeft className="size-6" />
            </button>
            <button type="button" onClick={() => toggleSelectionCalendarOpen()} className="flex items-center justify-center text-[14px]">
              {effectiveView === 'day'
                ? dayFormatter.format(visibleStart)
                : getDayRange(visibleStart.toISOString(), visibleEnd.toISOString())}
            </button>
            <button
              type="button"
              aria-label={`Next ${effectiveView}`}
              className="cursor-pointer hover:scale-110 hover:text-foreground tranistion-all duration-300"
              onClick={() => navigateCalendar(1)}
            >
              <ChevronRight className="size-6" />
            </button>
          </div>
        </div>
        {isSelectionCalendarOpen && (
          <MonthCalendarWrapper today={now} initialMonth={visibleDate} focusDate={visibleDate} selectedDate={days} onSelectDate={(day: Date) => {setVisibleDate(day)}}/>
        )}
      </div>
      {/*Day grid*/}
      <div className="flex min-h-0 flex-1 flex-col w-full">
        <div className="lg:grid place-items-center pr-6 mb-4 hidden" style={{ gridTemplateColumns }}>
          <time></time>
          {days.map((day) => (
            <button
              className={`
              flex 
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
                cursor-pointer
                rounded-4xl
                ${isSameDay(day, now) ? '!text-calendar-today' : ''}
                hover:scale-110
                hover:text-foreground
                transition-all
                duration-300
                p-3
                `}>
                {dayFormatter.format(day)}
              </div>
            </button>
          ))}
        </div>
        {/*Calendar grid*/}
        <div className="relative flex min-h-0 flex-1">
        <div className={`
          py-8
          pr-6
          grid
          grid-rows-[repeat(96,1.25rem)]
          w-full
          h-full min-h-0 flex-1 overflow-y-auto
          scrollbar-none
          lg:dash-scrollbar
          ${dragState !== null ? 'select-none' : ''}
          `}
          ref={calendarGridRef}
          style={{ gridTemplateColumns }}
        >
          {/*time slots which are all the buttons for each 15 min slot*/}
          {timeSlots.map((timeSlot) => (
            timeSlotRow(timeSlot)
          ))}
          {/*time indicator line*/}
          {currentDayIndex !== -1 && (

            <div
              ref={currentTimeIndicatorRef}
              style={{
                gridColumn: currentDayIndex + 2,
                gridRow: currentSlotIndex + 1,
                marginTop: `${currentTimeOffsetRem}rem`
              }}
              className="
                relative
                z-30
                self-start
                h-0
                w-full
                border-t-2
                border-dashed
                border-calendar-today
                pointer-events-none
              "
                        >
              <span className="absolute left-0 top-1/2 rounded-4xl -translate-x-11/12 -translate-y-1/2 bg-calendar-today text-[10px] p-1">
                {timeFormatter.format(now)}
              </span>
            </div>


          )}
          {/*Positioned Task Segments*/}
          {positionedTaskSegments.map((segment) => {
            const color = getTaskColor(segment.task, categories)
            const timeRange = getHourRange(
              segment.task.startAt,
              segment.task.endAt
            )
            const startRange = timeRange[0]
            const endRange = timeRange[1]
            const segmentSlotSpan =
                segment.endSlot - segment.startSlot
            const isTinySegment =
                segmentSlotSpan <= 1
            const isShortSegment =
                segmentSlotSpan === 2
            const canShowTimeRange =
                segmentSlotSpan >= 2
            const segmentContentPadding =
                isTinySegment
                  ? 'pl-4 pr-2 py-0'
                  : isShortSegment
                    ? 'pl-4 pr-2 py-0.5'
                    : 'pl-4 pr-2 py-1'

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
                    style={{
                      '--task-color-calendar': color,
                    } as React.CSSProperties}
                    className="
                      absolute
                      inset-0
                      overflow-hidden
                      rounded-xl
                      bg-[var(--task-color-calendar)]/50
                      "
                  >
                    {/*left indicator bar (visual)*/}
                    <span
                      className="
                        absolute
                        left-1
                        top-1
                        bottom-1
                        w-1
                        rounded-lg
                        bg-[var(--task-color-calendar)]
                      "
                    />
                  </div>
                  {/*Text and time display in a segment*/}
                  <button
                    type="button"
                    aria-expanded={infoTaskId === segment.task.id}
                    className={`
                    absolute
                    inset-0
                    z-10
                    cursor-pointer
                    
                    flex
                    flex-col
                    text-left
                    ${isTinySegment ? 'justify-center' : 'justify-start gap-0.5'}
                    
                    min-h-0
                    min-w-0
                    
                    overflow-hidden
                    
                    ${segmentContentPadding}
                    `}
                    onPointerDown={(event) =>
                      handleTaskSegmentPointerDown(event, segment)
                    }
                    onClick={(event) => {
                      if (event.detail !== 0) {
                        return
                      }

                      toggleTaskInfo(
                        segment.task.id,
                        event.currentTarget
                      )
                    }}
                  >

                    <div className="flex min-w-0 max-w-full items-center gap-1 text-xs leading-4">
                      {segment.task.emoji !== null && (
                        <span className="shrink-0 leading-none select-none">
                          {segment.task.emoji}
                        </span>
                      )}
                      <span className="min-w-0 truncate select-none">
                        {segment.task.title}
                      </span>
                    </div>
                    {canShowTimeRange && (
                      <span className="block min-w-0 max-w-full truncate text-[0.65rem] leading-3 text-foreground">
                        {startRange}–{endRange}
                      </span>
                    )}

                  </button>
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
                    event.stopPropagation()

                    setDragState({
                      mode: 'resize-end',
                      taskId: segment.task.id,
                      previewStartAt: segment.task.startAt,
                      previewEndAt: segment.task.endAt,
                    })
                  }}
                />
              </div>
            )
          })}
        </div>
          <div
            ref={setInfoPortalElement}
            className="absolute inset-0 z-50 overflow-hidden pointer-events-none"
          />
          {renderTaskInfoPopover()}
        </div>
      </div>
    </div>
  )
}

export default CalendarElement
