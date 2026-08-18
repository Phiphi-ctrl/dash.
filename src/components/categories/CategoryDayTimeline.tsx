import type { Task } from '../../types/Task.ts'
import type { Category } from '../../types/Category.ts'
import { getHourRange } from '../../utils/Datetime.ts'

type CategoryDayTimelineProps = {
  now: Date,
  currentDayTasks: Task[],
  category: Category,
}

type TimelineSegment = {
  id: string
  title: string
  emoji: string | null
  timeRange: string
  leftPercent: number
  widthPercent: number
}

function CategoryDayTimeline ( {now, currentDayTasks, category }: CategoryDayTimelineProps ) {

  const dayStart = new Date(now)
  dayStart.setHours(0, 0, 0, 0)

  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayEnd.getDate() + 1)

  const minutesPerDay = 24 * 60

  const timelineSegments: TimelineSegment[] = currentDayTasks.map((task) => {
    const taskStart = new Date(task.startAt)
    const taskEnd = new Date(task.endAt)

    const visibleStartMs = Math.max(
      taskStart.getTime(),
      dayStart.getTime()
    )

    const visibleEndMs = Math.min(
      taskEnd.getTime(),
      dayEnd.getTime()
    )

    const startMinutes =
      (visibleStartMs - dayStart.getTime()) /
      (60 * 1000)

    const endMinutes =
      (visibleEndMs - dayStart.getTime()) /
      (60 * 1000)

    const leftPercent =
      (startMinutes / minutesPerDay) * 100

    const widthPercent =
      ((endMinutes - startMinutes) / minutesPerDay) * 100

    const timeRange = getHourRange(task.startAt, task.endAt)

    const timeRangeString = timeRange[0] + ' → ' + timeRange[1]

    return {
      id: task.id,
      title: task.title,
      emoji: task.emoji ?? null,
      timeRange: timeRangeString,
      leftPercent: leftPercent,
      widthPercent: widthPercent,
    }
  })

  const currentMinutes =
    now.getHours() * 60 +
    now.getMinutes() +
    now.getSeconds() / 60

  const currentTimePercent =
    (currentMinutes / (24 * 60)) * 100

  return (
    <div className="flex w-full flex-col gap-1">
      <div
        className="
      relative
      h-8
      w-full
      rounded-full
      bg-surface-hover
    "
      >
        <div
          className="
            absolute
            inset-0
            rounded-full
            bg-surface-hover
          "
        >
          {timelineSegments.map((segment) => (
            <div
              key={segment.id}
              className="
              group
              absolute
              top-0
              h-full
              "
              style={{
                left: `${segment.leftPercent}%`,
                width: `${segment.widthPercent}%`,
              }}
            >
              {/* actual task segment */}
              <div
                className="
                h-full
                w-full
                rounded-full
                "
                style={{
                  backgroundColor: category.color,
                }}
              />

              {/* tooltip */}
              <div
                className="
                pointer-events-none
                absolute
                top-full
                left-1/2
                z-40
                mt-6
                -translate-x-1/2

                whitespace-nowrap
                rounded-lg
                px-2
                py-1

                text-xs
                text-foreground
                glass-popover

                opacity-0
                transition-opacity
                duration-150

                group-hover:opacity-100
                "
              >
                <div className="flex gap-2">
                  <span className="text-foreground">{segment.emoji ?? ''}</span>
                  <span className="text-foreground">{segment.title}</span>
                  <span className="text-muted">{segment.timeRange}</span>
                </div>

              </div>
            </div>
          ))}
        </div>
        <div
          className="
          pointer-events-none
          absolute
          top-0
          z-30
          h-full
          w-0.5
          bg-calendar-today
        "
          style={{
            left: `${currentTimePercent}%`,
          }}
        />
      </div>
      <div className="flex justify-between text-[0.65rem] text-muted">
        <span>00:00</span>
        <span>24:00</span>
      </div>
    </div>
  )
}

export default CategoryDayTimeline;