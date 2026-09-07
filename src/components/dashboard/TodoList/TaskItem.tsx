import type { Task } from '../../../types/Task.ts'
import Checkbox from '../../ui/Checkbox.tsx'
import Button from '../../ui/Button.tsx'
import { ArrowRight, CheckCheck, Trash2 } from 'lucide-react'
import { Clock2 } from 'lucide-react'
import { getDuration, getTimeRange } from '../../../utils/Datetime.ts'
import * as React from 'react'
import { useEffect, useState } from 'react'
import PulseDot from '../../ui/PulseDot.tsx'
import type { Category } from '../../../types/Category.ts'
import { getTaskColor } from '../../../utils/Category.ts'
import Tooltip from '../../ui/Tooltip.tsx'

type TaskItemProps = {
  task: Task,
  onToggle: ( id: string ) => void,
  onDelete: ( id: string ) => void
  onEdit: (task: Task ) => void,
  today: Date
  categories: Category[]
}

function TaskItem ({task, onToggle, onDelete, onEdit, today, categories} : TaskItemProps) {

  const color = getTaskColor(task, categories)

  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  const isActive = (task: Task) => {
    const start = new Date(task.startAt)
    const end = new Date(task.endAt)

    return start <= now && now < end && !task.completed;
  }

  const taskIsActive = isActive(task)

  return (
    <li
      style={{
        '--task-color-task': color,
      } as React.CSSProperties}
      className={`
        relative
        flex
        w-full
        glass-surface
        gap-4
        items-center
        py-4
        pl-4
        pr-8
        z-30
        
      `}
    >
      <div>
        {task.emoji !== null && (
            <span className="text-3xl size-9 pl-2 pr-2 cursor-default">
              {task.emoji}
            </span>
          )}
      </div>

      <button
      type="button"
      className="cursor-pointer"
      onClick={() => {onEdit(task)}}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex gap-2 items-center">
            <PulseDot color={color} pulse={taskIsActive}/>
            <span className={`min-w-0 truncate max-w-50 ${task.completed ? 'text-foreground-secondary line-through' : 'text-foreground'}`}>
              {task.title}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-foreground-secondary">
            <span className="flex items-center gap-2">
              <Clock2 className="size-4"/> {getDuration(task.startAt, task.endAt)}
            </span>
            <span>
              {getTimeRange(task.startAt, task.endAt, today)}
            </span>
          </div>
        </div>
      </button>

      <div
        className="flex items-center gap-1 text-sm text-center cursor-default ml-auto"
      >
        <Tooltip content={
          <div className="flex items-center gap-1 text-xs text-muted">
            <ArrowRight size={14}/>
            <span>start task</span>
            <span className="font-semibold text-foreground-secondary">now</span>
          </div>
        }
        delay={800}
        >
          <button
            className={`
              shrink-0
              p-3
              cursor-pointer
              focus:outline-none
              transition-colors
              duration-400
              text-muted 
              hover:scale-110 
              hover:text-foreground
              `}
          >
            <ArrowRight className=" size-4"/>
          </button>

        </Tooltip>

        <Tooltip content={
            <div className="flex items-center gap-1 text-xs text-muted">
              <CheckCheck size={14}/>
              <span>mark as</span>
              <span className="font-semibold text-foreground-secondary">completed</span>
            </div>
          }
          delay={800}
        >
          <Checkbox
            checked={task.completed}
            onChange={() => onToggle(task.id)}
            className={`
          text-muted
          hover:scale-110
          hover:text-foreground
          `}

          />
        </Tooltip>

        <Tooltip
          content={
            <div className="flex items-center gap-1 text-xs text-muted">
              <Trash2 size={14}/>
              <span className="font-semibold text-foreground-secondary">delete</span>
              <span>task</span>
            </div>
          }
          delay={800}
        >
          <Button
            onClick={() => onDelete(task.id)}
            Icon={Trash2}
            className={`
        
          text-muted 
          hover:scale-110
          hover:text-danger
          `}
          />
        </Tooltip>

      </div>
    </li>
  )
}

export default TaskItem;