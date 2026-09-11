import { useEffect, useState } from 'react'
import {
    ChevronRight,
    ChevronLeft,
} from 'lucide-react'
import {
    monthFormatter,
    weekdays
} from '../../../utils/Datetime.ts'

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

function MonthCalendar ({
                                selectedDate,
                                initialMonth,
                                focusDate,
                                today,
                                onSelectDate,
                                getHighlightStyle,
                            }: MonthCalendarProps) {

  const numVisibleDays = 42;

  const [visibleMonth, setVisibleMonth] = useState(
    () => initialMonth ?? selectedDate?.[0] ?? today
  )

  const focusYear = focusDate?.getFullYear()
  const focusMonth = focusDate?.getMonth()

  useEffect(() => {
    if (focusDate === undefined) return

    setVisibleMonth(
      new Date(
        focusDate.getFullYear(),
        focusDate.getMonth(),
        1
      )
    )
  }, [focusYear, focusMonth, focusDate])

  const firstDayThisMonth = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      1,
  )

  const firstWeekday = firstDayThisMonth.getDay()

  const firstVisibleDate = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth(),
      1 - firstWeekday
  )

  const days = Array.from(
      { length: numVisibleDays },
      (_, index) =>
          new Date(
              firstVisibleDate.getFullYear(),
              firstVisibleDate.getMonth(),
              firstVisibleDate.getDate() + index,
          )
  )

  function nextMonth (current: Date) {
      const nextMonth = new Date(current)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      return nextMonth
  }

  function prevMonth (current: Date) {
      const prevMonth = new Date(current)
      prevMonth.setMonth(prevMonth.getMonth() - 1)
      return prevMonth
  }

  function isSameDate(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    )
  }

  function startOfDay(date: Date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    )
  }

  function isBetween(start: Date, day: Date, end: Date) {
    if (start === null || end === null) {
      return false
    }

    const dayTime = startOfDay(day).getTime()
    const startTime = startOfDay(start).getTime()
    const endTime = startOfDay(end).getTime()

    return dayTime > startTime && dayTime < endTime
  }

  function style(day: Date) {
    const highlightStyle = getHighlightStyle?.(day)

    if (isSameDate(day, today)) {
      if(selectedDate === null || selectedDate === undefined) {
        return 'text-foreground bg-calendar-today rounded-xl'
      }
      if (isBetween(selectedDate[0], day, selectedDate[selectedDate.length - 1])) {
        return 'text-foreground bg-calendar-today'
      }
      return 'text-foreground bg-calendar-today rounded-xl'
    }

    if (highlightStyle !== undefined) {
      return highlightStyle
    }

    const selectedIndex =
      selectedDate?.findIndex((selectedDay) =>
        isSameDate(day, selectedDay)
      ) ?? -1

    if (selectedIndex !== -1) {
      if (selectedDate?.length === 1) {
        return 'text-foreground bg-accent-soft rounded-xl'
      }

      if (selectedIndex === 0) {
        return 'text-foreground bg-accent-soft rounded-s-xl'
      }

      if (selectedIndex === selectedDate!.length - 1) {
        return 'text-foreground bg-accent-soft rounded-e-xl'
      }

      return 'text-foreground bg-accent-soft'
    }

    if (day.getMonth() === visibleMonth.getMonth()) {
      return 'text-foreground rounded-xl'
    }

    return 'text-muted rounded-xl'
  }

    return (
        <div className="flex flex-col gap-2 text-sm">
            <div className="flex">
                <div className="w-full text-foreground-secondary">
                    {monthFormatter.format(visibleMonth)}
                </div>
                <div className="flex gap-4 text-foreground-secondary">
                    <button
                        type="button"
                        className=""
                        onClick={() => setVisibleMonth(prevMonth(visibleMonth))}
                    >
                        <ChevronLeft className="size-4" />
                    </button>
                    <button
                        type="button"
                        className=""
                        onClick={() => setVisibleMonth(nextMonth(visibleMonth))}
                    >
                        <ChevronRight className="size-4" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-[repeat(7,2rem)]">
                {weekdays.map((day) => (
                    <div
                        key={day}
                        className="size-8 flex justify-center items-center text-foreground-secondary"
                    >
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-[repeat(7,2rem)]">
                {days.map((day) => (
                    <button
                        type="button"
                        key={`${day.getMonth()}-${day.getTime()}`}
                        onClick={() => onSelectDate(day)}
                        className={`
                            calendar-day-button
                            size-8
                            flex
                            justify-center 
                            items-center 
                            cursor-pointer
                            transition-[border-radius,background-color,color]
                            duration-600
                            ease-out
                            ${style(day)}
                            `}
                    >
                        {day.getDate()}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default MonthCalendar