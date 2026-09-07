import SelectionCalendar from './SelectionCalendar.tsx'
import { useState, type FocusEvent } from 'react'
import {
  formatDateTimeFields,
  isValidDateTimeRange,
  parseDateTimeFields,
  type DateTimeFields,
} from './dateTimeFields.ts'

export type ActiveField = 'start' | 'end'

type DateTimeRangePickerProps = {
  newStartAt: string
  newEndAt: string
  setNewStartAt: (newStartAt: string) => void
  setNewEndAt: (newEndAt: string) => void
  onCanCloseChange: (canClose: boolean) => void
  today: Date
}

const fields = ['start', 'end'] as const

function DateTimeRangePicker({newStartAt, setNewStartAt, newEndAt, setNewEndAt, onCanCloseChange, today}: DateTimeRangePickerProps) {
  const [activeField, setActiveField] = useState<ActiveField>('start')
  const [inputs, setInputs] = useState(() => ({
    start: formatDateTimeFields(newStartAt),
    end: formatDateTimeFields(newEndAt),
  }))
  const [errors, setErrors] = useState({ start: false, end: false })

  const parsedStart = parseDateTimeFields(inputs.start)
  const parsedEnd = parseDateTimeFields(inputs.end)
  const rangeError = parsedStart !== null && parsedEnd !== null
    && !isValidDateTimeRange(parsedStart, parsedEnd)

  function commitField(field: ActiveField, draft: DateTimeFields = inputs[field]) {
    const parsed = parseDateTimeFields(draft)
    const nextInputs = { ...inputs, [field]: parsed === null ? draft : formatDateTimeFields(parsed) }
    setInputs(nextInputs)
    setErrors((current) => ({ ...current, [field]: parsed === null }))

    if (parsed !== null) {
      if (field === 'start') setNewStartAt(parsed)
      else setNewEndAt(parsed)
    }

    onCanCloseChange(isValidDateTimeRange(
      parseDateTimeFields(nextInputs.start),
      parseDateTimeFields(nextInputs.end),
    ))
    return parsed !== null
  }

  function handleRowBlur(field: ActiveField, event: FocusEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
    commitField(field)
  }

  function changeInput(field: ActiveField, part: keyof DateTimeFields, value: string) {
    setInputs((current) => ({ ...current, [field]: { ...current[field], [part]: value } }))
    setErrors((current) => ({ ...current, [field]: false }))
    onCanCloseChange(false)
  }

  function handleCalendarChange(field: ActiveField, value: string) {
    // The calendar supplies a date; keep the time from the current text draft.
    const draft = { ...inputs[field], date: formatDateTimeFields(value).date }
    if (commitField(field, draft)) setActiveField(field === 'start' ? 'end' : 'start')
  }

  return (
    <div className="flex flex-col gap-2">
      {fields.map((field) => {
        const label = field === 'start' ? 'Start' : 'End'
        const hasError = errors[field] || (field === 'end' && rangeError)
        const rowStyle = hasError
          ? 'border-error bg-error-soft'
          : activeField === field ? 'border-accent bg-accent-soft' : 'border-transparent'

        return (
          <div
            key={field}
            role="group"
            aria-label={`${label} date and time`}
            onFocus={() => setActiveField(field)}
            onBlur={(event) => handleRowBlur(field, event)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.stopPropagation()
                commitField(field)
              }
            }}
            className={`flex justify-start min-w-0 items-center gap-3 rounded-lg border p-1 ${rowStyle}`}
          >
            <input
              type="text"
              aria-label={`${label} date`}
              aria-invalid={hasError}
              value={inputs[field].date}
              placeholder={`${label} date`}
              onChange={(event) => changeInput(field, 'date', event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="flex-1 w-[10ch] min-w-0 bg-transparent outline-none"
            />

            <span aria-hidden="true" className="h-4 w-px shrink-0 bg-current opacity-20" />

            <input
              type="text"
              aria-label={`${label} time`}
              aria-invalid={hasError}
              value={inputs[field].time}
              placeholder="HH:mm"
              onChange={(event) => changeInput(field, 'time', event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="flex-1 w-[5ch] min-w-0 shrink-0 bg-transparent tabular-nums outline-none"
            />
          </div>
        )
      })}
      <SelectionCalendar
        newStartAt={newStartAt}
        newEndAt={newEndAt}
        today={today}
        activeField={activeField}
        handleStartCalenderChange={(value) => handleCalendarChange('start', value)}
        handleEndCalenderChange={(value) => handleCalendarChange('end', value)}
      />
    </div>
  )
}

export default DateTimeRangePicker
