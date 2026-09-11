import MonthCalendar from '../../../ui/MonthCalendar/MonthCalendar.tsx'
import type { ActiveField } from './DateTimeRangePicker.tsx'
import { dateToLocalDateTimeString, replaceDateKeepTime } from '../../../../utils/Datetime.ts'
import { getSelectionHighlightStyle, getSelectionRangePart, parseSelectionDate } from './selectionCalendarRange.ts'

type SelectionCalendarProps = {
  newStartAt: string
  newEndAt: string
  today: Date
  activeField: ActiveField
  handleStartCalenderChange: (date: string) => void
  handleEndCalenderChange: (date: string) => void
}

function SelectionCalendar({
  newStartAt, newEndAt, today, activeField, handleStartCalenderChange, handleEndCalenderChange,
}: SelectionCalendarProps) {
  const start = parseSelectionDate(newStartAt)
  const end = parseSelectionDate(newEndAt)
  const selectedDates = [start, end].filter((date): date is Date => date !== null)
  const todayPart = getSelectionRangePart(today, start, end)

  function handleSelectDate(day: Date) {
    const value = activeField === 'start' ? newStartAt : newEndAt
    const selected = dateToLocalDateTimeString(replaceDateKeepTime(parseSelectionDate(value) ? value : '', day))
    if (activeField === 'start') handleStartCalenderChange(selected)
    else handleEndCalenderChange(selected)
  }

  // MonthCalendar owns today's color; only adapt its corners for a range endpoint.
  const todayCorners = todayPart === 'start'
    ? '[&_.bg-calendar-today]:rounded-e-none'
    : todayPart === 'end' ? '[&_.bg-calendar-today]:rounded-s-none' : undefined

  return (
    <div className={todayCorners}>
      <MonthCalendar
        today={today}
        initialMonth={new Date(today.getFullYear(), today.getMonth(), 1)}
        selectedDate={selectedDates.length ? selectedDates : null}
        onSelectDate={handleSelectDate}
        getHighlightStyle={(day) => getSelectionHighlightStyle(day, start, end)}
      />
    </div>
  )
}

export default SelectionCalendar
