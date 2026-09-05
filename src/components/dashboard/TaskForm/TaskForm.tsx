import { useState, useRef, useEffect } from 'react'
import type { NewTask, TaskPriority, TaskTemplate } from '../../../types/Task.ts'
import SubmitButton from '../../ui/SubmitButton.tsx'
import CancelButton from '../../ui/CancelButton.tsx'
import DateTimeRangePicker from './DateTimeRangePicker/DateTimeRangePicker.tsx'
import {
  ArrowDownUpIcon,
  Calendar,
  ClockFading,
  SmilePlus, SaveCheck, Check, Trash2, LayoutDashboard,
} from 'lucide-react'
import TaskEmojiPicker from "./EmojiPicker/TaskEmojiPicker.tsx";
import { getDuration, getTimeRange } from "../../../utils/Datetime.ts";
import SaveTemplateButton from '../../ui/SaveTemplateButton.tsx'
import Checkbox2 from '../../ui/Checkbox2.tsx'
import PriorityPicker from './PriorityPicker/PriorityPicker.tsx'
import { createPortal } from 'react-dom'
import CategoryPicker from './CategoryPicker/CategoryPicker.tsx'
import type { Category } from '../../../types/Category.ts'


type TaskFormProps = {
  initialValues: NewTask
  onClose: () => void
  onSubmit: (values: NewTask) => void
  categories: Category[]
  today: Date
}

function TaskForm ({initialValues, onClose, onSubmit, categories, today}: TaskFormProps) {
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
  const [newCategoryId, setNewCategoryId] = useState(initialValues.categoryId)

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
  const [isPriorityPickerOpen, setIsPriorityPickerOpen] = useState(false)
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false)

  const selectedCategory =
    categories.find(
      (category) =>
        category.id === newCategoryId
    ) ?? null

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

  const [categoryPopoverPosition, setCategoryPopoverPosition] =
    useState<PopoverPosition | null>(null)
  const categoryAnchorRef =
    useRef<HTMLDivElement>(null)
  const categoryPopoverRef =
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
    if(!isCategoryPickerOpen) {
      return
    }

    function handleDocumentClickCP(event: MouseEvent) {
      if(!(event.target instanceof Node)) {
        return
      }

      const clickedAnchor =
        categoryAnchorRef.current?.contains(event.target)

      const clickedPopover =
        categoryPopoverRef.current?.contains(event.target)

      if (!clickedAnchor && !clickedPopover) {

        setIsCategoryPickerOpen(false)
      }
    }

    document.addEventListener('click', handleDocumentClickCP)

    return () => {
      document.removeEventListener('click', handleDocumentClickCP)
    }
  }, [isCategoryPickerOpen])

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

      categoryId: newCategoryId,
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

  function handleCategoryPickerToggle() {
    if (isCategoryPickerOpen) {
      setIsCategoryPickerOpen(false)
      return
    }

    const rect =
      categoryAnchorRef.current?.getBoundingClientRect()

    if (rect === undefined) {
      return
    }

    setCategoryPopoverPosition({
      left: rect.left,
      top: rect.bottom + 10,
    })

    setIsCategoryPickerOpen(true)
  }

  function handlePrioritySelect (priority: TaskPriority) {
    setNewPriority(priority)
    setIsPriorityPickerOpen(false)
  }

  function handleCategorySelect(
    categoryId: string | null
  ) {
    setNewCategoryId(categoryId)
    setIsCategoryPickerOpen(false)
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
    const found = templates.find(
      (template) =>
        template.title === title &&
        template.priority === newPriority &&
        template.emoji === newEmoji &&
        template.categoryId === newCategoryId
    )
    if(found) {
      console.log('Template already exists')
      return
    }
    const template: TaskTemplate = {
      id: crypto.randomUUID(),
      title,
      priority: newPriority,
      emoji: newEmoji,
      categoryId: newCategoryId,
    }
    setTemplates((currentTemplates) => [
      ...currentTemplates,
      template
    ])
  }

  function handleTemplateSelect(
    template: TaskTemplate
  ) {
    setNewTitle(template.title)
    setNewPriority(template.priority)
    setNewEmoji(template.emoji)
    setNewCategoryId(template.categoryId)
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
      className="flex flex-col gap-15 p-12 will-change-contents"
      onSubmit={(event) => {
        event.preventDefault()
        const values = constructTaskValues()
        onSubmit(values)
      }}

    >

      {/*Top: Title and Cancel/Add button*/}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-end ml-auto text-foreground">
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
            text-foreground-secondary
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
          ${newTitle.trim() === '' ? 'text-muted' : 'text-foreground'}`}
          />
        </div>

      </div>

      {/*Main Property List*/}
      <div className="grid grid-cols-2 gap-4">

        {/*Calendar and date selection*/}
        <div className="flex text-foreground">
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
        <div className="flex text-foreground">
          <div className="grid size-8 place-items-center">
            <ClockFading className="size-4"/>
          </div>
          <span className="p-1">
          Duration
          </span>
        </div>
        <div className="flex items-center text-foreground -ml-20">
          {
            getDuration(newStartAt, newEndAt)
          }
        </div>

        {/*Priority*/}
        <div className="flex text-foreground">
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

        {/*Completed*/}
        <div className="flex text-foreground">
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

        {/*Category*/}
        <div className="flex text-foreground items-center">
          <div className="grid size-8 place-items-center">
            <LayoutDashboard className="size-4"/>
          </div>
          <span className="p-1">
          Workspace
          </span>
        </div>
        <div className="flex items-center relative -ml-20">
          <div ref={categoryAnchorRef}>
            <button
              type="button"
              onClick={handleCategoryPickerToggle}
              className="
                flex
                items-center
                gap-2
                cursor-pointer
                rounded-4xl
                p-2
                text-foreground-secondary
              "
            >
              {selectedCategory !== null ? (
                <>
                  <span
                    className="size-3 rounded-full"
                    style={{
                      backgroundColor: selectedCategory.color,
                    }}
                  />
                  <span>{selectedCategory.name}</span>
                </>
              ) : (
                <span>No Workspace</span>
              )}
            </button>

            {isCategoryPickerOpen && categoryPopoverPosition !== null && createPortal(
              <div
                ref={categoryPopoverRef}
                className="
                fixed
                z-[100]
                p-4
                "
                style={{
                  top: categoryPopoverPosition.top,
                  left: categoryPopoverPosition.left,
                }}
              >
                <div className="glass-panel-bg"/>
                <div className="relative z-10 overflow-hidden h-50 overflow-y-auto scrollbar-none">
                  <CategoryPicker
                    categories={categories}
                    currentlySelected={newCategoryId}
                    onSelect={handleCategorySelect}
                  />
                </div>
              </div>,

              document.body
            )}
          </div>
        </div>

        {/*Templates*/}
        <div className="flex text-foreground">
          <div className="grid size-8 place-items-center">
            <SaveCheck className="size-4"/>
          </div>
          <span className="p-1">
          Templates
          </span>
        </div>
        <div className="col-span-2">
          <div className="template-scroll-wrapper relative">
            <div className="flex flex-wrap gap-4 h-42 overflow-y-auto overflow-x-hidden dash-scrollbar p-6 template-scroll-fade">
              {templates.map((template) => (
                <div
                  className="flex border glass-surface h-14 hover:-translate-y-1/12 transition-transform"
                  key={template.id}
                >
                  <button
                    type="button"
                    onClick={() => handleTemplateSelect(template)}
                    className="flex min-w-0 flex-1 cursor-pointer p-3 text-foreground"
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
      </div>

    </form>
  )
}

export default TaskForm;