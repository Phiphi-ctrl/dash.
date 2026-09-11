import { isSameDay } from '../../../../utils/Datetime.ts'

export function parseSelectionDate(value: string): Date | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isFinite(date.getTime()) ? date : null
}

export function getSelectionRangePart(day: Date, start: Date | null, end: Date | null) {
  const isStart = start !== null && isSameDay(day, start)
  const isEnd = end !== null && isSameDay(day, end)

  if ((isStart && (!end || isEnd)) || (isEnd && !start)) return 'single'
  if (isStart) return 'start'
  if (isEnd) return 'end'
  if (!start || !end) return null

  const midnight = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
  return midnight(day) > midnight(start) && midnight(day) < midnight(end) ? 'between' : null
}

export function getSelectionHighlightStyle(day: Date, start: Date | null, end: Date | null) {
  switch (getSelectionRangePart(day, start, end)) {
    case 'single': return 'text-foreground bg-accent rounded-xl'
    case 'start': return 'text-foreground bg-accent rounded-s-xl'
    case 'end': return 'text-foreground bg-accent rounded-e-xl'
    case 'between': return 'text-foreground bg-accent-high'
    default: return undefined
  }
}
