import type { Task } from '../../../types/Task.ts'

export const TIMELINE_BAR_HEIGHT = 28
const LANE_GAP = 8
const TOP_PADDING = 8

type TimelineSegment = {
  task: Task
  start: number
  end: number
  lane: number
}

export type TimelineEntry = TimelineSegment & {
  left: number
  width: number
  barY: number
  pastCompleted: boolean
}

export function getTimelineDay(date: Date) {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start: start.getTime(), end: end.getTime() }
}

export function layoutTimeline(tasks: Task[], date: Date, width: number) {
  const day = getTimelineDay(date)
  const duration = day.end - day.start
  const segments: TimelineSegment[] = tasks.flatMap((task) => {
    const start = Math.max(Date.parse(task.startAt), day.start)
    const end = Math.min(Date.parse(task.endAt), day.end)
    return Number.isFinite(start) && Number.isFinite(end) && end > start
      ? [{ task, start, end, lane: 0 }]
      : []
  }).sort((a, b) => a.start - b.start || b.end - a.end || a.task.id.localeCompare(b.task.id))

  const laneEnds: number[] = []
  for (const segment of segments) {
    let lane = laneEnds.findIndex((end) => end <= segment.start)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = segment.end
    segment.lane = lane
  }

  const laneCount = Math.max(1, laneEnds.length)
  const lanePositions = Array.from({ length: laneCount }, (_, lane) =>
    TOP_PADDING + TIMELINE_BAR_HEIGHT / 2 + lane * (TIMELINE_BAR_HEIGHT + LANE_GAP)
  )
  const entries: TimelineEntry[] = segments.map((segment) => ({
    ...segment,
    left: (segment.start - day.start) / duration * width,
    width: (segment.end - segment.start) / duration * width,
    barY: lanePositions[segment.lane],
    pastCompleted: segment.task.completed && Date.parse(segment.task.endAt) <= date.getTime(),
  }))

  entries.sort((a, b) => a.start - b.start || a.lane - b.lane)
  return { entries, day, lanePositions, height: TOP_PADDING + laneCount * (TIMELINE_BAR_HEIGHT + LANE_GAP) + 20 }
}

export function getTimelineTicks(date: Date) {
  const day = getTimelineDay(date)
  const ticks: { hour: number; position: number }[] = []
  let previousTime = -Infinity
  for (let hour = 0; hour <= 24; hour++) {
    const time = new Date(day.start)
    time.setHours(hour, 0, 0, 0)
    // Skip duplicate ticks when the local clock jumps over an hour.
    if (time.getTime() <= previousTime) continue
    previousTime = time.getTime()
    ticks.push({ hour, position: (time.getTime() - day.start) / (day.end - day.start) })
  }
  return ticks
}
