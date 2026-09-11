import { useState, type CSSProperties } from 'react'
import Popover from '../../ui/Popover.tsx'
import { Check, CheckCheck, Clock3, ClockFading, Pen, Trash2 } from 'lucide-react'
import type { Task } from '../../../types/Task.ts'
import type { Category } from '../../../types/Category.ts'
import { getTaskCategory, getTaskColor } from '../../../utils/Category.ts'
import { getDuration, getTimeRange } from '../../../utils/Datetime.ts'
import Button from '../../ui/Button.tsx'
import Tooltip from '../../ui/Tooltip.tsx'
import { TIMELINE_BAR_HEIGHT, type TimelineEntry } from './timelineLayout.ts'

type TimelineTaskProps = {
  entry: TimelineEntry
  categories: Category[]
  now: Date
  onEdit: (task: Task) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

const actionClassName = `
  rounded-md! p-1.5! text-foreground-secondary
  hover:text-foreground hover:scale-110 aria-pressed:bg-surface-hover aria-pressed:text-foreground
  focus-visible:outline-2! focus-visible:outline-solid! focus-visible:outline-foreground focus-visible:outline-offset-3
`
const detailClassName = 'mt-1.5 flex items-center gap-2 text-foreground-secondary wrap-anywhere'

export default function TimelineTask({ entry, categories, now, onEdit, onToggle, onDelete }: TimelineTaskProps) {
  const { task } = entry
  const [isOpen, setIsOpen] = useState(false)
  const timeRange = getTimeRange(task.startAt, task.endAt, now)
  const toggleLabel = task.completed ? 'Mark incomplete' : 'Mark completed'
  const colorStyle = { '--timeline-task-color': getTaskColor(task, categories) } as CSSProperties

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
      label={`${task.title} details`}
      placementInput="top"
      offsetDistance={16}
      viewportPadding={12}
      interaction="hover"
      outsidePressEvent="pointerdown"
      dismissOnScroll
      closeOnFocusOut
      showArrow
      className="z-120 w-72 max-w-[calc(100vw-24px)]"
      contentClassName=""
      trigger={({ ref, props }) => (
        <button ref={ref} type="button"
          className={`
            group/timeline-task absolute z-1 min-w-0 cursor-pointer overflow-hidden rounded-[32px] border-0 p-0
            bg-[color-mix(in_oklab,var(--timeline-task-color)_35%,var(--theme-canvas))]
            shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--timeline-task-color)_65%,transparent)]
            text-left text-xs leading-[18px] text-foreground
            transition-[opacity,background-color] duration-150 ease-[ease] motion-reduce:transition-none
            ${entry.pastCompleted ? 'opacity-[0.38]' : ''}
            hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100
            hover:bg-[color-mix(in_oklab,var(--timeline-task-color)_50%,var(--theme-canvas))]
            focus-visible:bg-[color-mix(in_oklab,var(--timeline-task-color)_50%,var(--theme-canvas))]
            aria-expanded:bg-[color-mix(in_oklab,var(--timeline-task-color)_50%,var(--theme-canvas))]
            focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-3
          `}
          data-task-id={task.id} data-lane={entry.lane} data-past-completed={entry.pastCompleted}
          data-size={entry.width < 24 ? 'tiny' : entry.width < 56 ? 'small' : 'regular'}
          style={{ ...colorStyle, left: entry.left, width: entry.width, height: TIMELINE_BAR_HEIGHT, top: entry.barY - TIMELINE_BAR_HEIGHT / 2 }}
          {...props} aria-label={`${task.emoji ?? ''} ${task.title}, ${timeRange}`.trim()}>
          <span className="flex h-full min-w-0 items-center gap-1.25 overflow-hidden px-1.75 group-data-[size=tiny]/timeline-task:px-0.5">
            {task.emoji && <span className="hidden shrink-0 group-data-[size=regular]/timeline-task:block" aria-hidden="true">{task.emoji}</span>}
            <span className="min-w-0 truncate">{task.title}</span>
          </span>
        </button>
      )}
    >
      <div data-timeline-popover style={colorStyle}
        className="relative z-10 p-5 text-xs leading-[18px] text-foreground">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="flex min-w-0 items-baseline gap-1.5 text-sm leading-5 font-semibold wrap-anywhere">
            {task.emoji && <span aria-hidden="true">{task.emoji}</span>}
            <span>{task.title}</span>
          </h3>
          <div className="flex gap-2">
            <Tooltip content="Edit task" delay={400}>
              <Button Icon={Pen} className={actionClassName} aria-label="Edit task"
                      onClick={() => { setIsOpen(false); onEdit(task) }} />
            </Tooltip>
            <Tooltip content="Delete task" delay={400}>
              <Button Icon={Trash2} className={actionClassName} aria-label="Delete task"
                      onClick={() => { setIsOpen(false); onDelete(task.id) }} />
            </Tooltip>
          </div>

        </div>
        <div className={detailClassName}><Clock3 className="size-3.5 shrink-0" aria-hidden="true" /><span>{timeRange}</span></div>
        <div className={detailClassName}><ClockFading className="size-3.5 shrink-0" aria-hidden="true" /><span>{getDuration(task.startAt, task.endAt)}</span></div>
        <div className={detailClassName}><span className="size-3.5 shrink-0 rounded-[50%] bg-[var(--timeline-task-color)]" /><span>{getTaskCategory(task, categories)}</span></div>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-2 text-foreground-secondary">
          <span>{task.completed ? 'Completed' : 'Not completed'}</span>
          <Tooltip content={toggleLabel} delay={400}>
            <Button Icon={task.completed ? CheckCheck : Check} className={actionClassName}
              aria-label={toggleLabel} aria-pressed={task.completed} onClick={() => onToggle(task.id)} />
          </Tooltip>
        </div>
      </div>
    </Popover>
  )
}
