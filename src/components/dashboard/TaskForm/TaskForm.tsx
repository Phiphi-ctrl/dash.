import { useState, useRef, useEffect } from 'react'
import type { NewTask, TaskPriority, TaskTemplate } from '../../../types/Task.ts'
import SubmitButton from '../../ui/SubmitButton.tsx'
import CancelButton from '../../ui/CancelButton.tsx'
import DateTimeRangePicker from './DateTimeRangePicker/DateTimeRangePicker.tsx'
import { getInitialTaskDateRange } from './DateTimeRangePicker/dateTimeFields.ts'
import {
  Calendar,
  ClockFading,
  SmilePlus, Trash2, LayoutDashboard, PlusIcon, ChevronsRight, ChevronRight,
} from 'lucide-react'
import TaskEmojiPicker from "./EmojiPicker/TaskEmojiPicker.tsx";
import { getDuration, getTimeRange } from "../../../utils/Datetime.ts";
import Checkbox2 from '../../ui/Checkbox2.tsx'
import CategoryPicker from './CategoryPicker/CategoryPicker.tsx'
import type { Category } from '../../../types/Category.ts'
import FormPopover from '../forms/FormPopover.tsx'
import Tooltip from '../../ui/Tooltip.tsx'
import { createId } from '../../../utils/CyptoID.ts'


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
  const [dateRange, setDateRange] = useState(() => getInitialTaskDateRange(initialValues, new Date()))
  const { startAt: newStartAt, endAt: newEndAt } = dateRange
  const [newCompleted, setNewCompleted] = useState(initialValues.completed)
  const [newCategoryId, setNewCategoryId] = useState(initialValues.categoryId)

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false)
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

  function setNewStartAt(startAt: string) {
    setDateRange((current) => ({ ...current, startAt }))
  }

  function setNewEndAt(endAt: string) {
    setDateRange((current) => ({ ...current, endAt }))
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

  function handleCategoryPickerToggle() {
    if (isCategoryPickerOpen) {
      setIsCategoryPickerOpen(false)
      return
    }

    setIsCategoryPickerOpen(true)
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
      id: createId(),
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
      className="flex flex-col gap-8 p-6 will-change-contents max-w-100"
      onSubmit={(event) => {
        event.preventDefault()
        if (!canCloseDatePickerRef.current) return
        const values = constructTaskValues()
        onSubmit(values)
      }}

    >
      {/*Header navigation buttons*/}
      <div className="flex items-center text-foreground justify-between">
        <Tooltip
          content={
            <div className="flex items-center gap-1 text-xs text-muted">
              <PlusIcon size={14}/>
              <span className="font-normal text-foreground-secondary">add to tasks</span>
            </div>
          }
        >
          <div className="flex max-w-xs items-center p-2">
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
          <div className="flex items-center flex-1 max-w-xs p-2">
            <CancelButton onCancel={onClose} />
          </div>
        </Tooltip>
      </div>

      {/*Top: Title/emoji*/}
      <div className="flex gap-2 px-4">
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
              <FormPopover open={isEmojiPickerOpen} onOpenChange={setIsEmojiPickerOpen} label="Choose emoji" placementInput="bottom-start" showArrow={true}
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
        <div className="flex text-foreground col-span-2 items-center justify-between solid-surface h-14 pl-4">
          {/*Calendar Icon*/}
          <Calendar size={18} className="ml-2"/>
          {/*Date Time button*/}
          <div className="flex-1">
            <Tooltip
              content={
                <div className="flex items-center gap-1 text-xs text-muted">
                  <Calendar size={14}/>
                  <span className="font-normal text-foreground-secondary">choose time-range</span>
                </div>
              }
              delay={500}
            >
              <FormPopover
                open={isDatePickerOpen}
                onOpenChange={setIsDatePickerOpen}
                label="Choose dates"
                placementInput="bottom-end"
                canDismiss={() => canCloseDatePickerRef.current}
                trigger={({ ref, props }) => (
                  <div className="flex-1">
                    <button ref={ref} {...props} type="button" onClick={handleDatePickerToggle} className="flex w-full justify-end items-center gap-2 text-foreground-secondary cursor-pointer min-w-0 pr-4">
                      {getTimeRange(newStartAt, newEndAt, today)}
                      <ChevronRight size={16} className={`${isDatePickerOpen ? 'rotate-90' : ''} transition-all duration-300`}/>
                    </button>
                  </div>

                )
                }
              >
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
        <div className="flex gap-2 text-foreground col-span-1 items-center justify-center solid-surface h-14">
          <ClockFading size={18}/>
          <div className="flex items-center text-foreground">
            {
              getDuration(newStartAt, newEndAt)
            }
          </div>
        </div>

        {/*Completed*/}
        <div className="flex text-foreground col-span-1 items-center justify-center solid-surface h-14">
          <div className="flex text-muted">
            <Tooltip content={'Complete task'}>
              <Checkbox2
                checked={newCompleted}
                onChange={handleCompleted}
                classNameUnchecked={`
              text-muted
              hover:text-accent
              hover:scale-110
              `}
                classNameChecked={`
              text-accent
              `}
              />
            </Tooltip>
          </div>
        </div>



        {/*Category*/}
        <div className="flex gap-6 text-foreground col-span-2 items-center justify-between solid-surface h-14 pl-4">

          <LayoutDashboard size={18} className="ml-2"/>
          <div className="flex flex-1 items-center relative">
            <div className="flex-1">
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
                  placementInput="bottom-end"
                  contentClassName="relative z-10 overflow-hidden h-50 overflow-y-auto scrollbar-none p-3"
                  trigger={({ ref, props }) => (
                    <div className="flex-1">
                      <button ref={ref} {...props}
                              type="button"
                              onClick={handleCategoryPickerToggle}
                              className="
                          flex
                          w-full
                          justify-end
                          items-center
                          gap-2
                          cursor-pointer
                          rounded-4xl
                          pr-4
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
                        <ChevronRight size={16} className={`${isCategoryPickerOpen ? 'rotate-90' : ''} transition-all duration-300`}/>
                      </button>
                    </div>
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
        </div>


        {/*Templates*/}
        <div className="col-span-2">
          <div className="flex text-foreground-secondary">
            <span className="p-1">
              Templates
            </span>
          </div>
          <div className="template-scroll-wrapper relative">
            <div className="grid grid-cols-1 gap-2 py-2 h-60 overflow-hidden overflow-y-auto scrollbar-none lg:pr-3 lg:dash-scrollbar template-scroll-fade">
              {/*Save current as template*/}
              <button
                type="button"
                key={'Add-Template'}
                onClick={() => handleSaveTemplate()}
                className="flex min-w-0 cursor-pointer p-3 text-foreground solid-surface h-14 hover:-translate-y-1/12 transition-transform w-full"
              >


                <div className="flex items-center gap-2">
                  <PlusIcon size={14}/>
                  <span className="truncate text-foreground-secondary">
                    Add current Configuration
                  </span>
                </div>
            </button>
              {templates.map((template) => (
                <div
                  className="flex solid-surface h-14 hover:-translate-y-1/12 transition-transform"
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
