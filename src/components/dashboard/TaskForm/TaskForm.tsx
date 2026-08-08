import { useState, useRef, useEffect } from 'react'
import type { NewTask, TaskPriority, TaskTemplate } from '../../../types/Task.ts'
import SubmitButton from '../../ui/SubmitButton.tsx'
import CancelButton from '../../ui/CancelButton.tsx'
import PriorityButton from './PriorityPicker/PriorityButton.tsx'
import DateTimeRangePicker from './DateTimeRangePicker/DateTimeRangePicker.tsx'
import {
  ArrowDownUpIcon,
  Calendar,
  FileText,
  ArrowUpFromLine,
  ArrowDownFromLine,
  Minus,
  ClockFading,
  SmilePlus, SaveCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import TaskEmojiPicker from "./EmojiPicker/TaskEmojiPicker.tsx";
import { getDuration, getTimeRange } from "../../../utils/Datetime.ts";
import SaveTemplateButton from '../../ui/SaveTemplateButton.tsx'


type TaskFormProps = {
  initialValues: NewTask
  onClose: () => void
  onSubmit: (values: NewTask) => void
  today: Date
}

type PriorityOption = {
  priority: TaskPriority
  Icon: LucideIcon
  background: string
}

function TaskForm ({initialValues, onClose, onSubmit, today}: TaskFormProps) {
  const [newTitle, setNewTitle] = useState(initialValues.title)
  const [newPriority, setNewPriority] = useState<TaskPriority>(initialValues.priority)
  const [newStartAt, setNewStartAt] = useState(
      initialValues.startAt ?? '',
  )
  const [newEndAt, setNewEndAt] = useState(
      initialValues.endAt ?? '',
  )
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [newEmoji, setNewEmoji] = useState<string | null>(initialValues.emoji)
  const datePickerRef = useRef<HTMLDivElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const canCloseDatePickerRef = useRef(true)

  const [templates, setTemplates] = useState<TaskTemplate[]>(() => {
    const storedTemplates = localStorage.getItem('dash.taskTemplates')

    if(storedTemplates === null) {
      return []
    }

    return JSON.parse(storedTemplates)
  })


  useEffect(() => {
    localStorage.setItem(
      'dash.taskTemplates',
      JSON.stringify(templates),
    )
  }, [templates])

  function handleCanCloseChange(canClose: boolean) {
    canCloseDatePickerRef.current = canClose
  }

  useEffect(() => {
    if(!isDatePickerOpen) {
      return
    }

    function handleDocumentClickDP(event: MouseEvent) {
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

    document.addEventListener('click', handleDocumentClickDP)

    return () => {
      document.removeEventListener('click', handleDocumentClickDP)
    }
  }, [isDatePickerOpen])

  useEffect(() => {
    if(!isEmojiPickerOpen) {
      return
    }

    function handleDocumentClickEP(event: MouseEvent) {
      if(!(event.target instanceof Node)) {
        return
      }
      const clickedInside =
        emojiPickerRef.current?.contains(event.target)

      if(!clickedInside) {
        setIsEmojiPickerOpen(false)
      }
    }

    document.addEventListener('click', handleDocumentClickEP)

    return () => {
      document.removeEventListener('click', handleDocumentClickEP)
    }
  }, [isEmojiPickerOpen])

  const priorities: PriorityOption[] = [
    { priority: 'high', Icon: ArrowUpFromLine, background: 'bg-priority-high'},
    { priority: 'medium', Icon: Minus, background: 'bg-priority-medium'},
    { priority: 'low', Icon: ArrowDownFromLine, background: 'bg-priority-low'},
  ]

  function constructTaskValues(): NewTask {
    return {
      title: newTitle,
      priority: newPriority,
      startAt:
          newStartAt === ''
              ? null
              : new Date(newStartAt).toISOString(),
      endAt:
          newEndAt === ''
              ? null
              : new Date(newEndAt).toISOString(),
      emoji: newEmoji,
    }
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
    if(!isEmojiPickerOpen) {
      setIsDatePickerOpen(true)
    }
    return
  }

  function handleEmojiPickerToggle () {
    if(isEmojiPickerOpen) {
      setIsEmojiPickerOpen(false)
      return
    }
    if(!isDatePickerOpen) {
      setIsEmojiPickerOpen(true)
    }
    return
  }

  function handleEmojiSelect(
    nativeEmoji: string
    ) {
    setNewEmoji(nativeEmoji)
  }

  function handleSaveTemplate() {
    const title = newTitle.trim()
    if(title === '') {
      console.log('Please enter a title')
      return
    }
    const found = templates.find((template) =>
      template.title === title &&
      template.priority === newPriority &&
      template.emoji === newEmoji
    )
    if(found) {
      console.log('Template already exists')
      return
    }
    const template: TaskTemplate = {
      id: crypto.randomUUID(),
      title: title,
      priority: newPriority,
      emoji: newEmoji,
    }
    setTemplates((currentTemplates) => [
      ...currentTemplates,
      template
    ])
  }

  function handleTemplateSelect(template: TaskTemplate) {
    setNewTitle(template.title)
    setNewPriority(template.priority)
    setNewEmoji(template.emoji)
  }

  return (
    <form
      className="flex flex-col gap-20 p-12"
      onSubmit={(event) => {
        event.preventDefault()
        const values = constructTaskValues()
        onSubmit(values)
      }}

    >

      {/*Top: Title and Cancel/Add button*/}
      <div className="flex">
        <input
          type="text"
          value={newTitle}
          onChange={(event) => {
            setNewTitle(event.target.value)
          }}
          placeholder="New Task . . ."
          className={`w-full truncate rounded-lg bg-app-surface text-3xl font-bold focus:outline-none 
          ${newTitle.trim() === '' ? 'text-muted' : ''}`}
        />
        <div className="flex-1 max-w-xs">
          <SaveTemplateButton onSave={handleSaveTemplate} />
        </div>
        <div className="flex-1 max-w-xs">
          <SubmitButton />
        </div>
        <div className="flex-1 max-w-xs">
          <CancelButton onCancel={onClose} />
        </div>
      </div>

      {/*Main Property List*/}
      <div className="grid grid-cols-2 gap-5">

        {/*Calendar and date selection*/}
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
              className="text-foreground cursor-pointer"
            >
              {getTimeRange(newStartAt, newEndAt, today)}
            </button>

            {isDatePickerOpen && (
              <div
                className="z-50 absolute mt-2 top-full p-4 rounded-lg bg-surface border border-border"
              >
                <DateTimeRangePicker
                  newStartAt={newStartAt}
                  newEndAt={newEndAt}
                  setNewStartAt={setNewStartAt}
                  setNewEndAt={setNewEndAt}
                  onCanCloseChange={handleCanCloseChange}
                  today={today}
                />
              </div>
            )}
        </div>

        {/*Duration*/}
        <div className="flex">
          <div className="grid size-8 place-items-center">
            <ClockFading className="size-4"/>
          </div>
          <span className="p-1">
          Duration
          </span>
        </div>

        <div className="flex items-center text-foreground -ml-20">
          {getDuration(newStartAt, newEndAt)}
        </div>

        {/*Icon*/}
        <div className="flex">
          <div className="grid size-8 place-items-center">
            <SmilePlus className="size-4"/>
          </div>
          <span className="p-1">
          Icon
          </span>
        </div>

        <div className="relative flex items-center text-foreground -ml-20" ref={emojiPickerRef}>
          <button
            type="button"
            onClick={handleEmojiPickerToggle}
            className="
            min-w-8
            cursor-pointer
            text-xl
            text-foreground
            "
          >
            {newEmoji ?? '. . .'}
          </button>
          {isEmojiPickerOpen && (
              <div className="absolute top-full z-50 mt-2 -inset-10">
                <TaskEmojiPicker onSelect={handleEmojiSelect}/>
              </div>
          )}
        </div>

        {/*Notes section (maybe add a text input or add a section below)*/}
        <div className="flex">
          <div className="grid size-8 place-items-center">
            <FileText className="size-4"/>
          </div>
          <span className="p-1">
          Notes
          </span>
        </div>

        <div className="flex items-center text-muted -ml-20">
          Notes here
        </div>

        {/*Priority*/}
        <div className="flex">
          <div className="grid size-8 place-items-center">
            <ArrowDownUpIcon className="size-4"/>
          </div>
          <span className="p-1">
          Priority
          </span>
        </div>

        <div className="flex items-center text-muted -ml-20">
          <div
            className={`
            w-full
            grid 
            grid-cols-3
            gap-1
            `
            }>
            {priorities.map(({priority, Icon, background}) => (
              <PriorityButton
                key={priority}
                Icon={Icon}
                selectedPriority={newPriority}
                buttonPriority={priority}
                background={background}
                onClick={() => setNewPriority(priority)}/>
            ))}
          </div>
        </div>

        {/*Templates*/}
        <div className="flex mt-20">
          <div className="grid size-8 place-items-center">
            <SaveCheck className="size-4"/>
          </div>
          <span className="p-1">
          Templates
          </span>
        </div>

        <div className="col-span-2 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2 h-72 overflow-hidden overflow-y-auto scrollbar-none">
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                onClick={() => handleTemplateSelect(template)}
                className="flex gap-3 bg-surface cursor-pointer border border-border rounded-lg w-fit p-3 hover:bg-surface-hover"
              >
                <div className="flex items-center">
                  <span className="text-lg size-6">{template.emoji}</span>
                </div>
                <div className="flex flex-col">
                  <span>{template.title}</span>
                  <span className=" flex text-xs text-muted">24m</span>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>

    </form>
  )
}

export default TaskForm;