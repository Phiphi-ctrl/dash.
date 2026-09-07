import { useState, useRef, useEffect } from 'react'
import type { NewTask, TaskPriority, TaskTemplate } from '../../../types/Task.ts'
import SubmitButton from '../../ui/SubmitButton.tsx'
import CancelButton from '../../ui/CancelButton.tsx'
import DateTimeRangePicker from './DateTimeRangePicker/DateTimeRangePicker.tsx'
import {
  ArrowDownUpIcon,
  Calendar,
  ClockFading,
  SmilePlus, SaveCheck, Check, Trash2, LayoutDashboard, PlusIcon, ChevronsRight,
} from 'lucide-react'
import TaskEmojiPicker from "./EmojiPicker/TaskEmojiPicker.tsx";
import { getDuration, getTimeRange } from "../../../utils/Datetime.ts";
import SaveTemplateButton from '../../ui/SaveTemplateButton.tsx'
import Checkbox2 from '../../ui/Checkbox2.tsx'
import PriorityPicker from './PriorityPicker/PriorityPicker.tsx'
import CategoryPicker from './CategoryPicker/CategoryPicker.tsx'
import type { Category } from '../../../types/Category.ts'
import FormPopover from '../forms/FormPopover.tsx'
import Tooltip from '../../ui/Tooltip.tsx'


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

  function handlePriorityPickerToggle () {
    if(isPriorityPickerOpen) {
      setIsPriorityPickerOpen(false)
      return
    }
    if(!isPriorityPickerOpen) {
      setIsPriorityPickerOpen(true)
    }
    return
  }

  function handleCategoryPickerToggle() {
    if (isCategoryPickerOpen) {
      setIsCategoryPickerOpen(false)
      return
    }

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
      template,
      ...currentTemplates
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
            <Tooltip
              content={
                <div className="flex items-center gap-1 text-xs text-muted">
                  <SaveCheck size={14}/>
                  <span className="font-normal text-foreground-secondary">save as template</span>
                </div>
              }
            >
              <SaveTemplateButton onSave={handleSaveTemplate} />
            </Tooltip>
          </div>
          <Tooltip
            content={
              <div className="flex items-center gap-1 text-xs text-muted">
                <PlusIcon size={14}/>
                <span className="font-normal text-foreground-secondary">add to tasks</span>
              </div>
            }
          >
            <div className="flex-1 max-w-xs">
              <SubmitButton />
            </div>
          </Tooltip>
          <Tooltip
            content={
              <div className="flex items-center gap-1 text-xs text-muted">
                <ChevronsRight size={14}/>
                <span className="font-normal text-foreground-secondary">close</span>
              </div>
            }
          >
            <div className="flex-1 max-w-xs">
              <CancelButton onCancel={onClose} />
            </div>
          </Tooltip>

        </div>
        {/*Icon and title*/}
        <div className="flex items-center justify-end gap-4">
          <div className="relative flex items-center text-foreground">
            <Tooltip
              content={
                <div className="flex items-center gap-1 text-xs text-muted">
                  <SmilePlus size={14}/>
                  <span className="font-normal text-foreground-secondary">Choose emoji</span>
                </div>
              }
              delay={500}
            >
              <FormPopover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen} label="Choose emoji"
               trigger={({ ref, props }) => (
                 <button ref={ref} {...props}
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
               )}>
                <TaskEmojiPicker onSelect={handleEmojiSelect}/>
              </FormPopover>
            </Tooltip>

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
          <div>
            <Tooltip
              content={
                <div className="flex items-center gap-1 text-xs text-muted">
                  <Calendar size={14}/>
                  <span className="font-normal text-foreground-secondary">choose time-range</span>
                </div>
              }
              delay={500}
            >
              <FormPopover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen} label="Choose dates"
                           canDismiss={() => canCloseDatePickerRef.current}
                           trigger={({ ref, props }) => (
                             <button ref={ref} {...props}
                                     type="button"
                                     onClick={handleDatePickerToggle}
                                     className="text-foreground cursor-pointer"
                             >
                               {getTimeRange(newStartAt, newEndAt, today)}
                             </button>
                           )}>
                <DateTimeRangePicker
                  newStartAt={newStartAt}
                  newEndAt={newEndAt}
                  setNewStartAt={setNewStartAt}
                  setNewEndAt={setNewEndAt}
                  onCanCloseChange={handleCanCloseChange}
                  today={today}
                />
              </FormPopover>
            </Tooltip>

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
          <div>
            <Tooltip
              content={
                <div className="flex items-center gap-1 text-xs text-muted">
                  <ArrowDownUpIcon size={14}/>
                  <span className="font-normal text-foreground-secondary">choose priority</span>
                </div>
              }
              delay={500}
            >
              <FormPopover open={isPriorityPickerOpen} onOpenChange={setIsPriorityPickerOpen} label="Choose priority"
                           trigger={({ ref, props }) => (
                             <button ref={ref} {...props}
                                     type="button"
                                     onClick={handlePriorityPickerToggle}
                                     className="text-foreground-secondary cursor-pointer"
                             >
                               {newPriority ? newPriority.charAt(0).toUpperCase() + newPriority.slice(1) : 'Priority'}
                             </button>

                           )}>
                <PriorityPicker onClick={handlePrioritySelect} currentlySelected={newPriority} />
              </FormPopover>
            </Tooltip>

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
          <div>
            <Tooltip
              content={
                <div className="flex items-center gap-1 text-xs text-muted">
                  <LayoutDashboard size={14}/>
                  <span className="font-normal text-foreground-secondary">choose workspace</span>
                </div>
              }
              delay={500}
            >
              <FormPopover
                open={isCategoryPickerOpen}
                onOpenChange={setIsCategoryPickerOpen}
                label="Choose workspace"
                contentClassName="relative z-10 overflow-hidden h-50 overflow-y-auto scrollbar-none p-3"
                trigger={({ ref, props }) => (
                 <button ref={ref} {...props}
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
                 )}>
                <CategoryPicker
                  categories={categories}
                  currentlySelected={newCategoryId}
                  onSelect={handleCategorySelect}
                />
              </FormPopover>
            </Tooltip>

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
                  <Tooltip
                    content={
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <Trash2 size={14}/>
                        <span className="font-normal text-foreground-secondary">delete template</span>
                      </div>
                    }
                    delay={500}
                  >
                    <button
                      type="button"
                      onClick={() => handleTemplateDelete(template)}
                      className="ml-auto shrink-0 cursor-pointer p-3 text-muted hover:text-danger"
                    >
                      <Trash2 className="size-4"/>
                    </button>
                  </Tooltip>

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
