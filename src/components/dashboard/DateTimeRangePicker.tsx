import SelectionCalendar from './SelectionCalendar.tsx'
import { useState, useRef, type FocusEvent } from 'react'
import { parseDateTimeInput, formatDateTimeInput } from '../../utils/Datetime.ts'

export type ActiveField = 'start' | 'end'

type DateTimeRangePickerProps = {
  newStartAt: string
  newEndAt: string
  setNewStartAt: (newStartAt: string) => void
  setNewEndAt: (newEndAt: string) => void
  onCanCloseChange: (canClose: boolean) => void
  today: Date
}


function DateTimeRangePicker ({newStartAt, setNewStartAt, newEndAt, setNewEndAt, onCanCloseChange, today}: DateTimeRangePickerProps) {

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
      return 'border-error bg-error-soft'
    }
    if(activeField === 'start') {
      return 'border-accent bg-accent-soft'
    }
    return 'border-border bg-surface'
  }

  function getInputFieldEndStyle () {
    if(endError) {
      return 'border-error bg-error-soft'
    }
    if(activeField === 'end') {
      return 'border-accent bg-accent-soft'
    }
    return 'border-border bg-surface'
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
          today={today}
          activeField={activeField}
          handleStartCalenderChange={handleStartCalendarChange}
          handleEndCalenderChange={handleEndCalendarChange}
        />
      </div>
    </div>

  )
}

export default DateTimeRangePicker