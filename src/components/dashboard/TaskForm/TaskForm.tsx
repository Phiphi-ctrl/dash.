import { useState, useRef, useEffect } from 'react'
import type { NewTask, TaskPriority, TaskTemplate } from '../../../types/Task.ts'
import SubmitButton from '../../ui/SubmitButton.tsx'
import CancelButton from '../../ui/CancelButton.tsx'
import DateTimeRangePicker from './DateTimeRangePicker/DateTimeRangePicker.tsx'
import {
  ArrowDownUpIcon,
  Calendar,
  FileText,
  ClockFading,
  SmilePlus, SaveCheck, Check, Trash2, Palette,
} from 'lucide-react'
import TaskEmojiPicker from "./EmojiPicker/TaskEmojiPicker.tsx";
import { getDuration, getTimeRange } from "../../../utils/Datetime.ts";
import SaveTemplateButton from '../../ui/SaveTemplateButton.tsx'
import Checkbox2 from '../../ui/Checkbox2.tsx'
import PriorityPicker from './PriorityPicker/PriorityPicker.tsx'
import { createPortal } from 'react-dom'
import * as React from 'react'
import ColorPicker from './ColorPicker/ColorPicker.tsx'


type TaskFormProps = {
  initialValues: NewTask
  onClose: () => void
  onSubmit: (values: NewTask) => void
  today: Date
}

function TaskForm ({initialValues, onClose, onSubmit, today}: TaskFormProps) {
  const [newTitle, setNewTitle] = useState(initialValues.title)
  const [newPriority, setNewPriority] = useState<TaskPriority>(initialValues.priority)
  const [newEmoji, setNewEmoji] = useState<string | null>(initialValues.emoji)
  const [newStartAt, setNewStartAt] = useState(
      initialValues.startAt ?? '',
  )
  const [newEndAt, setNewEndAt] = useState(
      initialValues.endAt ?? '',
  )
  const [newCompleted, setNewCompleted] = useState(initialValues.completed)
  const [newColor, setNewColor] = useState<string>(initialValues.color)

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [isPriorityPickerOpen, setIsPriorityPickerOpen] = useState(false)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)

  type PopoverPosition = {
    left: number
    top: number
  }

  const [datePopoverPosition, setDatePopoverPosition] =
    useState<PopoverPosition | null>(null)
  const dateAnchorRef =
    useRef<HTMLDivElement>(null)
  const datePopoverRef =
    useRef<HTMLDivElement>(null)

  const [emojiPopoverPosition, setEmojiPopoverPosition] =
    useState<PopoverPosition | null>(null)
  const emojiAnchorRef =
    useRef<HTMLDivElement>(null)
  const emojiPopoverRef =
    useRef<HTMLDivElement>(null)

  const [priorityPopoverPosition, setPriorityPopoverPosition] =
    useState<PopoverPosition | null>(null)
  const priorityAnchorRef =
    useRef<HTMLDivElement>(null)
  const priorityPopoverRef =
    useRef<HTMLDivElement>(null)

  const [colorPopoverPosition, setColorPopoverPosition] =
    useState<PopoverPosition | null>(null)
  const colorAnchorRef =
    useRef<HTMLDivElement>(null)
  const colorPopoverRef =
    useRef<HTMLDivElement>(null)

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

      const clickedAnchor =
        dateAnchorRef.current?.contains(event.target)

      const clickedPopover =
        datePopoverRef.current?.contains(event.target)

      if (!clickedAnchor && !clickedPopover) {
        if (!canCloseDatePickerRef.current) {
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

      const clickedAnchor =
        emojiAnchorRef.current?.contains(event.target)

      const clickedPopover =
        emojiPopoverRef.current?.contains(event.target)

      if (!clickedAnchor && !clickedPopover) {

        setIsEmojiPickerOpen(false)
      }
    }

    document.addEventListener('click', handleDocumentClickEP)

    return () => {
      document.removeEventListener('click', handleDocumentClickEP)
    }
  }, [isEmojiPickerOpen])

  useEffect(() => {
    if(!isPriorityPickerOpen) {
      return
    }

    function handleDocumentClickPP(event: MouseEvent) {
      if(!(event.target instanceof Node)) {
        return
      }

      const clickedAnchor =
        priorityAnchorRef.current?.contains(event.target)

      const clickedPopover =
        priorityPopoverRef.current?.contains(event.target)

      if (!clickedAnchor && !clickedPopover) {

        setIsPriorityPickerOpen(false)
      }
    }

    document.addEventListener('click', handleDocumentClickPP)

    return () => {
      document.removeEventListener('click', handleDocumentClickPP)
    }
  }, [isPriorityPickerOpen])

  useEffect(() => {
    if(!isColorPickerOpen) {
      return
    }

    function handleDocumentClickCP(event: MouseEvent) {
      if(!(event.target instanceof Node)) {
        return
      }

      const clickedAnchor =
        colorAnchorRef.current?.contains(event.target)

      const clickedPopover =
        colorPopoverRef.current?.contains(event.target)

      if (!clickedAnchor && !clickedPopover) {

        setIsColorPickerOpen(false)
      }
    }

    document.addEventListener('click', handleDocumentClickCP)

    return () => {
      document.removeEventListener('click', handleDocumentClickCP)
    }
  }, [isColorPickerOpen])

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
      completed: newCompleted,
      color: newColor,
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
      const rect =
        dateAnchorRef.current?.getBoundingClientRect()

      if (rect === undefined) {
        return
      }

      setDatePopoverPosition({
        left: rect.left,
        top: rect.bottom + 10,
      })

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
      const rect =
        emojiAnchorRef.current?.getBoundingClientRect()

      if (rect === undefined) {
        return
      }

      setEmojiPopoverPosition({
        left: rect.left,
        top: rect.bottom + 10,
      })

      setIsEmojiPickerOpen(true)
    }
    return
  }

  function handlePriorityPickerToggle () {
    if(isPriorityPickerOpen) {
      setIsPriorityPickerOpen(false)
      return
    }
    if(!isPriorityPickerOpen) {
      const rect =
        priorityAnchorRef.current?.getBoundingClientRect()

      if (rect === undefined) {
        return
      }

      setPriorityPopoverPosition({
        left: rect.left,
        top: rect.bottom + 10,
      })

      setIsPriorityPickerOpen(true)
    }
    return
  }

  function handleColorPickerToggle () {
    if(isColorPickerOpen) {
      setIsColorPickerOpen(false)
      return
    }
    if(!isColorPickerOpen) {
      const rect =
        colorAnchorRef.current?.getBoundingClientRect()

      if (rect === undefined) {
        return
      }

      setColorPopoverPosition({
        left: rect.left,
        top: rect.bottom + 10,
      })

      setIsColorPickerOpen(true)
    }
    return
  }

  function handlePrioritySelect (priority: TaskPriority) {
    setNewPriority(priority)
    setIsPriorityPickerOpen(false)
  }

  function handleColorSelect (color: string) {
    setNewColor(color)
    setIsColorPickerOpen(false)
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

  function handleTemplateDelete (templateIn: TaskTemplate) {
    setTemplates((currentTemplates) =>
      currentTemplates.filter((template) =>
        template.id !== templateIn.id
      ))
  }

  function handleCompleted () {
    setNewCompleted((current) => !current)
  }

  return (
    <form
      className="flex flex-col gap-20 p-12 will-change-contents"
      onSubmit={(event) => {
        event.preventDefault()
        const values = constructTaskValues()
        onSubmit(values)
      }}

    >

      {/*Top: Title and Cancel/Add button*/}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-end ml-auto">
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
        {/*Icon and title*/}
        <div className="flex items-center justify-end gap-4">
          <div className="relative flex items-center text-foreground" ref={emojiAnchorRef}>
            <button
              type="button"
              onClick={handleEmojiPickerToggle}
              className="
            min-w-8
            cursor-pointer
            text-4xl
            size-10
            text-foreground
            "
            >
              {newEmoji ??
                <SmilePlus />
              }
            </button>
            {isEmojiPickerOpen && emojiPopoverPosition !== null &&  createPortal(
              <div
                ref={emojiPopoverRef}
                className="
                fixed
                z-[100]
                p-4
                "
                style={{
                  top: emojiPopoverPosition.top,
                  left: emojiPopoverPosition.left,
                }}
              >
                <div className="glass-panel-bg"/>
                <div className="relative z-10">
                  <TaskEmojiPicker onSelect={handleEmojiSelect}/>
                </div>
              </div>,

              document.body
            )}
          </div>
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
        </div>

      </div>

      {/*Main Property List*/}
      <div className="grid grid-cols-2 gap-4">

        {/*Calendar and date selection*/}
        <div className="flex">
          <div className="grid size-8 place-items-center">
            <Calendar className="size-4"/>
          </div>
          <span className="p-1">
          Date
          </span>
        </div>
        <div className="flex items-center relative -ml-20">
          <div ref={dateAnchorRef}>
            <button
              type="button"
              onClick={handleDatePickerToggle}
              className="text-foreground cursor-pointer"
            >
              {getTimeRange(newStartAt, newEndAt, today)}
            </button>
            {isDatePickerOpen && datePopoverPosition !== null && createPortal(
              <div
                ref={datePopoverRef}
                className="
                fixed
                z-[100]
                p-4
                "
                style={{
                  left: datePopoverPosition.left,
                  top: datePopoverPosition.top,
                }}
              >
                <div className="glass-panel-bg"/>
                <div className="relative z-10">
                  <DateTimeRangePicker
                    newStartAt={newStartAt}
                    newEndAt={newEndAt}
                    setNewStartAt={setNewStartAt}
                    setNewEndAt={setNewEndAt}
                    onCanCloseChange={handleCanCloseChange}
                    today={today}
                  />
                </div>
              </div>,

              document.body
            )}
          </div>
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

        {/*Priority*/}
        <div className="flex">
          <div className="grid size-8 place-items-center">
            <ArrowDownUpIcon className="size-4"/>
          </div>
          <span className="p-1">
          Priority
          </span>
        </div>
        <div className="flex items-center relative -ml-20">
          <div ref={priorityAnchorRef}>
            <button
              type="button"
              onClick={handlePriorityPickerToggle}
              className="text-foreground-secondary cursor-pointer"
            >
              {newPriority ? newPriority.charAt(0).toUpperCase() + newPriority.slice(1) : 'Priority'}
            </button>

            {isPriorityPickerOpen && priorityPopoverPosition !== null && createPortal(
              <div
                ref={priorityPopoverRef}
                className="
                fixed
                z-[100]
                p-4
                "
                style={{
                  top: priorityPopoverPosition.top,
                  left: priorityPopoverPosition.left,
                }}
              >
                <div className="glass-panel-bg"/>
                <div className="relative z-10">
                  <PriorityPicker onClick={handlePrioritySelect} currentlySelected={newPriority} />
                </div>
              </div>,

              document.body
            )}
          </div>
        </div>

        {/*Color*/}
        <div className="flex">
          <div className="grid size-8 place-items-center">
            <Palette className="size-4"/>
          </div>
          <span className="p-1">
          Color
          </span>
        </div>
        <div className="flex items-center relative -ml-20">
          <div ref={colorAnchorRef}>
            <button
              type="button"
              onClick={handleColorPickerToggle}
              className="text-foreground-secondary cursor-pointer"
            >
              <div
                style={{
                  '--task-color-taskform': newColor,
                } as React.CSSProperties}
                className="inline-block bg-[var(--task-color-taskform)] rounded-full size-4"
              />
            </button>

            {isColorPickerOpen && colorPopoverPosition !== null && createPortal(
              <div
                ref={colorPopoverRef}
                className="
                fixed
                z-[100]
                p-4
                "
                style={{
                  top: colorPopoverPosition.top,
                  left: colorPopoverPosition.left,
                }}
              >
                <div className="glass-panel-bg"/>
                <div className="relative z-10">
                  <ColorPicker onClick={handleColorSelect} />
                </div>
              </div>,

              document.body
            )}
          </div>
        </div>

        {/*Completed*/}
        <div className="flex">
          <div className="grid size-8 place-items-center">
            <Check className="size-4"/>
          </div>
          <span className="p-1">
          {newCompleted ? 'Done' : 'Pending'}
          </span>
        </div>
        <div className="flex text-muted -ml-20">
          <div
            className="flex items-start justify-start">
            <Checkbox2
              checked={newCompleted}
              onChange={handleCompleted}
              classNameUnchecked={`
                border
              bg-surface
              border-border
              text-muted
              hover:bg-accent-soft
              hover:border-accent
              hover:text-accent
              `}
              classNameChecked={`
                border
              bg-accent-soft
              border-accent
              text-accent
              `}
            />
          </div>
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

        {/*Templates*/}
        <div className="flex mt-10">
          <div className="grid size-8 place-items-center">
            <SaveCheck className="size-4"/>
          </div>
          <span className="p-1">
          Templates
          </span>
        </div>
        <div className="col-span-2">
          <div className="flex flex-wrap gap-2 h-30 overflow-hidden overflow-y-auto overflow-x-hidden dash-scrollbar">
            {templates.map((template) => (
              <div
                className="flex border glass-surface rounded-lg h-14"
                key={template.id}
              >
                <button
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className="flex min-w-0 flex-1 cursor-pointer p-3"
                >
                  {template.emoji ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg size-6">{template.emoji}</span>
                      <span className="truncate">{template.title}</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="truncate">{template.title}</span>
                    </div>
                  )}

                </button>
                <button
                  type="button"
                  onClick={() => handleTemplateDelete(template)}
                  className="ml-auto shrink-0 cursor-pointer p-3 text-muted hover:text-danger"
                >
                  <Trash2 className="size-4"/>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </form>
  )
}

export default TaskForm;