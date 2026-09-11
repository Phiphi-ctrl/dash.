import {
  inputFormatter,
  parseDateTimeInput,
} from '../../../../utils/Datetime.ts'

export type DateTimeFields = {
  date: string
  time: string
}

export function getInitialTaskDateRange(
  initialValues: { startAt: string | null; endAt: string | null },
  now: Date,
): { startAt: string; endAt: string } {
  if (initialValues.startAt || initialValues.endAt) {
    return { startAt: initialValues.startAt ?? '', endAt: initialValues.endAt ?? '' }
  }

  const quarterHour = 15 * 60_000
  const start = Math.ceil(now.getTime() / quarterHour) * quarterHour
  return {
    startAt: new Date(start).toISOString(),
    endAt: new Date(start + 60 * 60_000).toISOString(),
  }
}

export function formatDateTimeFields(value: string): DateTimeFields {
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return { date: '', time: '' }

  const parts = Object.fromEntries(inputFormatter.formatToParts(date)
    .map((part) => [part.type, part.value]))
  return { date: `${parts.month} ${parts.day}, ${parts.year}`, time: `${parts.hour}:${parts.minute}` }
}

export function parseDateTimeFields(fields: DateTimeFields): string | null {
  const date = fields.date.trim().match(/^([A-Za-z]+),?\s+(\d{1,2}),?\s+(\d{4})$/)
  if (!date) return null

  const [, month, day, year] = date
  return parseDateTimeInput(`${month} ${day}, ${year} ${fields.time.trim()}`)
}

export function isValidDateTimeRange(startAt: string | null, endAt: string | null): boolean {
  return startAt !== null && endAt !== null
    && new Date(endAt).getTime() > new Date(startAt).getTime()
}
