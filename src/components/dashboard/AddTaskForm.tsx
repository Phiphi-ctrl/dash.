import { useState, useRef, useEffect } from 'react'
import type { NewTask, TaskPriority } from '../../types/Task.ts'
import SubmitButton from '../ui/SubmitButton.tsx'
import CancelButton from '../ui/CancelButton.tsx'
import PriorityButton from './PriorityButton.tsx'
import DateTimeRangePicker from './DateTimeRangePicker.tsx'
import { ArrowDownUpIcon, Calendar, FileText } from 'lucide-react'

type AddTaskFormProps = {
  onAddTask: (newTask : NewTask) => boolean
  onClose: () => void
}

type PriorityOption = {
  priority: TaskPriority
  icon: string
  background: string
}

function AddTaskForm ({onAddTask, onClose}: AddTaskFormProps) {
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [newStartAt, setNewStartAt] = useState('2026-12-06T00:00')
  const [newEndAt, setNewEndAt] = useState('2026-12-07T00:00')
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [titleEmpty, setTitleEmpty] = useState(true)
  const datePickerRef = useRef<HTMLDivElement>(null)
  const canCloseDatePickerRef = useRef(true)

  function handleCanCloseChange(canClose: boolean) {
    canCloseDatePickerRef.current = canClose
  }

  useEffect(() => {
    if(!isDatePickerOpen) {
      return
    }

    function handleDocumentClick(event: MouseEvent) {
      if(!(event.target instanceof Node)) {
        return
      }
      const clickedInside =
        datePickerRef.current?.contains(event.target)

      if(!clickedInside) {
        if(!canCloseDatePickerRef.current) {
          console.log('Cannot close date picker there is an invalid input')
          return
        }
        setIsDatePickerOpen(false)
      }
      // detect whether event.target is outside the datePickRef
    }

    document.addEventListener('click', handleDocumentClick)

    return () => {
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [isDatePickerOpen])

  const priorities: PriorityOption[] = [
    { priority: 'high', icon: '↑', background: 'bg-app-priority-high'},
    { priority: 'medium', icon: '-', background: 'bg-app-priority-medium'},
    { priority: 'low', icon: '↓', background: 'bg-app-priority-low'},
  ]

  function constructNewTask() {
    return {
      title: newTitle,
      priority: newPriority,
      startAt: newStartAt === '' ? null : new Date(newStartAt).toISOString(),
      endAt: newEndAt === '' ? null : new Date(newEndAt).toISOString()
    }
  }

  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  const dateFormatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  function isSameDay(first: Date, second: Date) {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    )
  }

  function getTimeRangeString (start: string, end: string) {
    if(start === "" || end === "") {
      return '.  .  .'
    }
    const startAt = new Date(start)
    const endAt = new Date(end)

    if(isSameDay(startAt, endAt)) {
      return `${dateFormatter.format(startAt)} ${timeFormatter.format(startAt)} → ${timeFormatter.format(endAt)}`
    }
    return `${dateTimeFormatter.format(startAt)} → ${dateTimeFormatter.format(endAt)}`
  }

  function isTitleEmpty (title: string): boolean {
    return title.length > 0
  }

  function handleDatePickerToggle () {
    if(isDatePickerOpen) {
      if(!canCloseDatePickerRef.current) {
        return
      }

      setIsDatePickerOpen(false)
      return
    }
    canCloseDatePickerRef.current = true
    setIsDatePickerOpen(true)
  }

  return (
    <form
      className="flex flex-col gap-20 p-12"
      onSubmit={(event) => {
        event.preventDefault()
        if(onAddTask(constructNewTask())) {
          onClose()
        }
      }}
    >

      <div className="flex">
        <input
          type="text"
          value={newTitle}
          onChange={(event) => {
            setNewTitle(event.target.value)
            setTitleEmpty(isTitleEmpty(event.target.value))
          }}
          placeholder="New Task . . ."
          className={`w-full rounded-lg border border-transparent bg-app-surface text-3xl font-bold focus:outline-none 
          ${titleEmpty ? 'text-text-muted' : 'text-text-primary'}`}
        />
        <div className="flex-1 max-w-xs">
          <SubmitButton />
        </div>
        <div className="flex-1 max-w-xs">
          <CancelButton onCancel={onClose} />
        </div>
      </div>


      <div className="grid grid-cols-2 gap-4">


        <div className="flex">
          <div className="grid size-8 place-items-center">
            <Calendar className="size-4"/>
          </div>
          <span className="p-1">
          Date
          </span>
        </div>

        <div className="flex items-center relative -ml-20" ref={datePickerRef}>
            <button
              type="button"
              onClick={handleDatePickerToggle}
              className="text-text-primary cursor-pointer"
            >
              {getTimeRangeString(newStartAt, newEndAt)}
            </button>

            {isDatePickerOpen && (
              <div
                className="absolute mt-2 top-full p-4 rounded-lg bg-app-surface border border-app-border"
              >
                <DateTimeRangePicker
                  newStartAt={newStartAt}
                  newEndAt={newEndAt}
                  setNewStartAt={setNewStartAt}
                  setNewEndAt={setNewEndAt}
                  onCanCloseChange={handleCanCloseChange}
                />
              </div>
            )}
        </div>

        <div className="flex">
          <div className="grid size-8 place-items-center">
            <FileText className="size-4"/>
          </div>
          <span className="p-1">
          Notes
          </span>
        </div>

        <div className="flex items-center text-text-muted -ml-20">
          Notes here
        </div>

        <div className="flex">
          <div className="grid size-8 place-items-center">
            <ArrowDownUpIcon className="size-4"/>
          </div>
          <span className="p-1">
          Priority
          </span>
        </div>

        <div className="flex items-center text-text-muted -ml-20">
          <div
            className={`
            w-full
            grid 
            grid-cols-3
            gap-1
            `
            }>
            {priorities.map((priority) => (
              <PriorityButton
                key={priority.priority}
                icon={priority.icon}
                selectedPriority={newPriority}
                buttonPriority={priority.priority}
                background={priority.background}
                onClick={() => setNewPriority(priority.priority)}/>
            ))}
          </div>
        </div>

      </div>
    </form>
  )
}

export default AddTaskForm;