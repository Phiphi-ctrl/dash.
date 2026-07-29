import { useState } from 'react';
import type { ActiveField } from './DateTimeRangePicker.tsx'
import {
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

type SelectionCalendarProps = {
  newStartAt: string;
  newEndAt: string;
  activeField: ActiveField;
  dateToLocalDateTimeString: (date: Date)=> string
  handleStartCalenderChange: (date: string) => void;
  handleEndCalenderChange: (date: string) => void;
}

function SelectionCalendar ({
  newStartAt,
  newEndAt,
  activeField,
  dateToLocalDateTimeString,
  handleStartCalenderChange,
  handleEndCalenderChange,

}: SelectionCalendarProps) {

  const today = new Date();
  const numVisibleDays = 42;

  const [visibleMonth, setVisibleMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )

  const monthFormatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  })

  const weekdays = [
    'Su',
    'Mo',
    'Tu',
    'We',
    'Th',
    'Fr',
    'Sa',
  ]

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

  function replaceDateKeepTime(currentDateTime: string, selectedDate: Date) {
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

  function getStart () {
    if(newStartAt === '') {
      return null
    }
    return new Date(newStartAt)
  }

  function getEnd () {
    if(newEndAt === '') {
      return null
    }
    return new Date(newEndAt)
  }

  const start = getStart()

  const end  = getEnd()

  function isStart (day: Date) {
    if(start === null) {
      return false
    }
    return (
      day.getFullYear() === start.getFullYear() &&
      day.getMonth() === start.getMonth() &&
      day.getDate() === start.getDate()
    )
  }

  function isEnd (day: Date) {
    if(end === null) {
      return false
    }
    return (
      day.getFullYear() === end.getFullYear() &&
      day.getMonth() === end.getMonth() &&
      day.getDate() === end.getDate()
    )
  }

  function startOfDay(date: Date) {
    return new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    )
  }

  function isBetweenStartAndEnd(day: Date) {
    if (start === null || end === null) {
      return false
    }

    const dayTime = startOfDay(day).getTime()
    const startTime = startOfDay(start).getTime()
    const endTime = startOfDay(end).getTime()

    return dayTime > startTime && dayTime < endTime
  }

  function getDayStyle (day: Date) {
    if(day.getFullYear() === today.getFullYear() && day.getMonth() === today.getMonth() && day.getDate() === today.getDate()) {
      if(isStart(day)) {
        return 'text-text-primary bg-accent-marked rounded-s-xl'
      }
      if(isEnd(day)) {
        return 'text-text-primary bg-accent-marked rounded-e-xl'
      }
      if(isBetweenStartAndEnd(day)) {
        return 'text-text-primary bg-accent-marked'
      }
      return 'text-text-primary bg-accent-marked rounded-xl'
    }
    if(day.getMonth() === visibleMonth.getMonth()) {
      if(isStart(day)) {
        if(end === null) {
          return 'text-text-primary bg-app-mark-calendar rounded-xl'
        }
        return 'text-text-primary bg-app-mark-calendar rounded-s-xl'
      }
      if(isEnd(day)) {
        if(start === null) {
          return 'text-text-primary bg-app-mark-calendar rounded-xl'
        }
        return 'text-text-primary bg-app-mark-calendar rounded-e-xl'
      }
      if(isBetweenStartAndEnd(day)) {
        return 'text-text-primary bg-app-days-between'
      }
      return 'text-text-primary rounded-xl'
    }
    if(day.getMonth() !== visibleMonth.getMonth()) {
      if(isStart(day)) {
        if(end === null) {
          return 'text-text-primary bg-app-mark-calendar rounded-xl'
        }
        return 'text-text-muted bg-app-mark-calendar-muted rounded-s-xl'
      }
      if(isEnd(day)) {
        if(start === null) {
          return 'text-text-primary bg-app-mark-calendar rounded-xl'
        }
        return 'text-text-muted bg-app-mark-calendar-muted rounded-e-xl'
      }
      if(isBetweenStartAndEnd(day)) {
        return 'text-text-muted bg-app-days-between'
      }
      return 'text-text-muted rounded-xl'
    }
    return ''
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      <div className="flex">
        <div className="w-full text-text-secondary">
          {monthFormatter.format(visibleMonth)}
        </div>
        <div className="flex gap-4 text-text-secondary">
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
            className="size-8 flex justify-center items-center text-text-secondary"
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
            onClick={() => (
              activeField === 'start' ?
                handleStartCalenderChange(dateToLocalDateTimeString(replaceDateKeepTime(newStartAt, day)))
                :
                handleEndCalenderChange(dateToLocalDateTimeString(replaceDateKeepTime(newEndAt, day)))
            )}
            className={`
            size-8
            flex
            justify-center 
            items-center 
            hover:bg-app-surface-hover
            transition-[border-radius,background-color,color]
            duration-600
            ease-out
            ${getDayStyle(day)}
            `}
          >
            {day.getDate()}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SelectionCalendar