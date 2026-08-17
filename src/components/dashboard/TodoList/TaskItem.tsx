import type { Task } from '../../../types/Task.ts'
import Checkbox from '../../ui/Checkbox.tsx'
import Button from '../../ui/Button.tsx'
import { Trash2 } from 'lucide-react'
import { Clock2 } from 'lucide-react'
import { getDuration, getTimeRange } from '../../../utils/Datetime.ts'
import * as React from 'react'
import { useEffect, useState } from 'react'
import PulseDot from '../../ui/PulseDot.tsx'
import type { Category } from '../../../types/Category.ts'
import { getTaskColor } from '../../../utils/Category.ts'

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
        bg-transparent
        gap-4
        items-center
        border-b-2
        border-border/50
        p-4
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
        className="flex items-center gap-2 text-sm text-center cursor-default ml-auto"
      >
        <Checkbox
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className={`
          border
        bg-surface
        border-border
        text-muted
        hover:bg-accent-soft
        hover:border-accent
        hover:text-accent
        `}

        />
        <Button
          onClick={() => onDelete(task.id)}
          Icon={Trash2}
          className={`
        bg-surface 
        border-border 
        text-muted 
        hover:bg-danger-soft
        hover:border-danger
        hover:text-danger
        `}
        />
      </div>
    </li>
  )
}

export default TaskItem;