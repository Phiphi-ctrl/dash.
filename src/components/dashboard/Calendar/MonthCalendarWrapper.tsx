import MonthCalendar from '../../ui/MonthCalendar/MonthCalendar.tsx'

type MonthCalendarProps = {
  selectedDate?: null | Date[]
  initialMonth?: Date
  focusDate?: Date
  today: Date

  onSelectDate: (date: Date) => void

  getHighlightStyle?: (
    day: Date,
  ) => string | undefined
}

function MonthCalendarWrapper ({selectedDate, initialMonth, focusDate, today, onSelectDate, getHighlightStyle}: MonthCalendarProps) {
  return(
    <div className="flex glass-surface w-fit p-4">
      <MonthCalendar today={today} initialMonth={initialMonth} focusDate={focusDate} selectedDate={selectedDate} onSelectDate={onSelectDate} getHighlightStyle={getHighlightStyle}/>
    </div>
  )
}

export default MonthCalendarWrapper