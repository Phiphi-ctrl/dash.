export function getDuration(start: string, end: string) {
  if(start === '' || end === '') {
    return ''
  }
  const startDate = new Date(start)
  const endDate = new Date(end)
  const duration = (endDate.getTime() - startDate.getTime()) / 1000 / 60
  const hours = Math.floor(duration / 60)
  const minutes = duration % 60
  if(hours === 0) {
    return `${minutes}m`
  }
  if (minutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${minutes}m`
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
})

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

export function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  )
}

export function getTimeRange(startAt: string, endAt: string, today: Date) {
  if(startAt === '' || endAt === '') {
    return '. . .'
  }
  const start = new Date(startAt)
  const end = new Date(endAt)

  // both today
  if(isSameDay(start, end) && isSameDay(today, start)) {
    return `Today ${timeFormatter.format(start)} → ${timeFormatter.format(end)}`
  }
  if(isSameDay(start, end)) {
    return `${dateTimeFormatter.format(start)} → ${timeFormatter.format(end)}`
  }
  return `${dateTimeFormatter.format(start)} → ${dateTimeFormatter.format(end)}`
}

// Selection Calendar

export function replaceDateKeepTime(currentDateTime: string, selectedDate: Date) {
  if(currentDateTime === '') {
    return selectedDate
  }
  const current = new Date(currentDateTime);
  const hours = current.getHours();
  const minutes = current.getMinutes();

  return new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    hours,
    minutes,
    0,
    0,
  )
}

export const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  year: 'numeric',
})

export const weekdays = [
  'Su',
  'Mo',
  'Tu',
  'We',
  'Th',
  'Fr',
  'Sa',
]

// DatetimeRangePicker
const inputFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

export const monthNames = [
  'jan',
  'feb',
  'mar',
  'apr',
  'may',
  'jun',
  'jul',
  'aug',
  'sep',
  'oct',
  'nov',
  'dec',
]
// ------human readable to canonic (display string -> intrinsic string)
export function dateToLocalDateTimeString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function parseDateTimeInput(value: string): string | null {
  const match = value.trim().match(
    /^([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})\s+(\d{1,2}):(\d{2})$/,
  )

  if (match === null) {
    return null
  }

  const [, monthText, dayText, yearText, hourText, minuteText] =
    match

  const month = monthNames.indexOf(monthText.toLowerCase())
  const day = Number(dayText)
  const year = Number(yearText)
  const hours = Number(hourText)
  const minutes = Number(minuteText)

  if (
    month === -1 ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null
  }

  const date = new Date(
    year,
    month,
    day,
    hours,
    minutes,
    0,
    0,
  )

  // JavaScript silently changes invalid dates:
  // February 31 might become March 3.
  // This verifies that no such correction happened.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes
  ) {
    return null
  }

  return dateToLocalDateTimeString(date)
}
// ------human readable to canonic
// ------canonical to human readable (intrinsic string -> display string)
export function formatDateTimeInput(dateString: string): string {
  if (dateString === '') {
    return ''
  }

  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const parts = Object.fromEntries(
    inputFormatter
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  )

  return `${parts.month} ${parts.day}, ${parts.year} ${parts.hour}:${parts.minute}`
}
// ------canonical to human readable
