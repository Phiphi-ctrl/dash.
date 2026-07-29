import SelectionCalendar from './SelectionCalendar.tsx'
import { useState, useRef, type FocusEvent } from 'react'

export type ActiveField = 'start' | 'end'

type DateTimeRangePickerProps = {
  newStartAt: string
  newEndAt: string
  setNewStartAt: (newStartAt: string) => void
  setNewEndAt: (newEndAt: string) => void
  onCanCloseChange: (canClose: boolean) => void
}

/*
The thing is here i have the way from
newStartAt ("2026-07-15T14:30"-format)
->
new Date(newStartAt) if newStartAt is not ''
->
dateTimeFormatter.format(new Date(newStartAt))

And the other direction needs to be

dateTimeFormatter.format(new Date(newStartAt)) -> newStartAt ("2026-07-15T14:30"-format)

how do i do this??
 */
const inputFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const monthNames = [
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
function dateToLocalDateTimeString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function parseDateTimeInput(value: string): string | null {
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
function formatDateTimeInput(dateString: string): string {
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
function DateTimeRangePicker ({newStartAt, setNewStartAt, newEndAt, setNewEndAt, onCanCloseChange}: DateTimeRangePickerProps) {

  const calendarRef = useRef<HTMLDivElement>(null)

  const isPointerDownInCalendar = useRef(false)

  const [activeField, setActiveField] =
    useState<ActiveField>('start')
  const [startInput, setStartInput] = useState(
    formatDateTimeInput(newStartAt)
  )
  const [endInput, setEndInput] = useState(
    formatDateTimeInput(newEndAt)
  )
  const [startError, setStartError] = useState<boolean>(false)
  const [endError, setEndError] = useState<boolean>(false)
  //calendar picking changes startInput

  function commitStartInput() {
    const parsedValue = parseDateTimeInput(startInput)

    if (parsedValue === null) {
      console.log(`Reached unparsable value while trying to commit User Start Input: commitStartInput()`)
      setStartError(true)
      return
    }

    setStartError(false)
    setNewStartAt(parsedValue)
    setStartInput(formatDateTimeInput(parsedValue))

    onCanCloseChange(!endError)
  }

  function commitEndInput() {
    const parsedValue = parseDateTimeInput(endInput)

    if (parsedValue === null) {
      console.log(`Reached unparsable value while trying to commit User End Input: commitEndInput()`)
      setEndError(true)
      return
    }

    setEndError(false)
    setNewEndAt(parsedValue)
    setEndInput(formatDateTimeInput(parsedValue))

    onCanCloseChange(!startError)
  }

  function handleStartBlur(
    event: FocusEvent<HTMLInputElement>,
  ) {
    const nextFocusedElement =
      event.relatedTarget as HTMLElement | null

    const pointerInCalendar = isPointerDownInCalendar.current

    const movedIntoCalendar =
      nextFocusedElement !== null &&
      calendarRef.current?.contains(nextFocusedElement)

    if (movedIntoCalendar || pointerInCalendar) {
      return
    }

    commitStartInput()
  }

  function handleEndBlur(
    event: FocusEvent<HTMLInputElement>,
  ) {
    const nextFocusedElement =
      event.relatedTarget as HTMLElement | null

    const movedIntoCalendar =
      nextFocusedElement !== null &&
      calendarRef.current?.contains(nextFocusedElement)

    const pointerInCalendar = isPointerDownInCalendar.current

    if (movedIntoCalendar || pointerInCalendar) {
      return
    }
    commitEndInput()
  }

  function handleStartCalendarChange(value: string) {
    setStartError(false)
    setNewStartAt(value)
    setStartInput(formatDateTimeInput(value))

    onCanCloseChange(!endError)
    setActiveField('end')
  }

  function handleEndCalendarChange(value: string) {
    setEndError(false)
    setNewEndAt(value)
    setEndInput(formatDateTimeInput(value))

    onCanCloseChange(!startError)
    setActiveField('start')
  }

  function handleCalendarPointerDown() {
    isPointerDownInCalendar.current = true

    requestAnimationFrame(() => {
      isPointerDownInCalendar.current = false
    })
  }

  function getInputFieldStartStyle () {
    if(startError) {
      return 'border-app-invalid-input-border bg-app-invalid-input'
    }
    if(activeField === 'start') {
      return 'border-app-active-border bg-app-active'
    }
    return 'border-app-border bg-app-surface'
  }

  function getInputFieldEndStyle () {
    if(endError) {
      return 'border-app-invalid-input-border bg-app-invalid-input'
    }
    if(activeField === 'end') {
      return 'border-app-active-border bg-app-active'
    }
    return 'border-app-border bg-app-surface'
  }

  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        onBlur={handleStartBlur}
        value={startInput}
        placeholder="Start date"
        onFocus={() => setActiveField('start')}
        onChange={(event) => {
          setStartInput(event.target.value)
          setStartError(false)
        }}
        className={`
        border ${
          getInputFieldStartStyle()
        }
        flex-1 
        rounded-lg
        p-1 
        outline-none
        `}
      />
      <input
        type="text"
        onBlur={handleEndBlur}
        value={endInput}
        placeholder="End date"
        onFocus={() => setActiveField('end')}
        onChange={(event) => {
          setEndInput(event.target.value)
          setEndError(false)
        }}
        className={`
        border ${
          getInputFieldEndStyle()
        }
        flex-1 
        rounded-lg 
        p-1 
        outline-none
        `}
      />
      <div
        ref={calendarRef}
        onPointerDownCapture={handleCalendarPointerDown}
      >
        <SelectionCalendar
          newStartAt={newStartAt}
          newEndAt={newEndAt}
          activeField={activeField}
          dateToLocalDateTimeString={dateToLocalDateTimeString}
          handleStartCalenderChange={handleStartCalendarChange}
          handleEndCalenderChange={handleEndCalendarChange}
        />
      </div>

    </div>

  )
}

export default DateTimeRangePicker