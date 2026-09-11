import type { Task } from '../../../types/Task.ts'
import { getStartOfWeek } from '../../../utils/Datetime.ts'

export type CalendarView = 'day' | 'week'

export type CalendarTaskSegment = {
  task: Task
  dayIndex: number
  startSlot: number
  endSlot: number
}

export type PositionedCalendarTaskSegment = CalendarTaskSegment & {
  laneIndex: number
  laneCount: number
}

export function getCalendarDays(anchor: Date, view: CalendarView): Date[] {
  const start = view === 'week' ? getStartOfWeek(anchor) : new Date(anchor)
  start.setHours(0, 0, 0, 0)

  return Array.from({ length: view === 'week' ? 7 : 1 }, (_, index) => {
    const day = new Date(start)
    day.setDate(day.getDate() + index)
    return day
  })
}

export function shiftCalendarDate(
  anchor: Date,
  view: CalendarView,
  direction: -1 | 1,
): Date {
  const date = new Date(anchor)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + direction * (view === 'week' ? 7 : 1))
  return date
}

export function getDateFromTimeSlot(day: Date, timeSlot: number) {
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

export function buildTaskSegments(taskList: Task[], days: Date[]) {
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

export function layoutTaskSegments(
    segments: CalendarTaskSegment[],
    dayCount: number
): PositionedCalendarTaskSegment[] {
  const positionedSegments: PositionedCalendarTaskSegment[] = []

  for (let dayIndex = 0; dayIndex < dayCount; dayIndex++) {
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
