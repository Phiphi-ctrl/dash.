import type { Task, TaskPriority } from '../../../types/Task.ts'
import Checkbox from '../../ui/Checkbox.tsx'
import Button from '../../ui/Button.tsx'
import { Trash2 } from 'lucide-react'
import { Clock2 } from 'lucide-react'
import { getDuration, getTimeRange } from '../../../utils/Datetime.ts'

type TaskItemProps = {
  task: Task,
  onToggle: ( id: string ) => void,
  onDelete: ( id: string ) => void
  onEdit: (task: Task ) => void,
  today: Date
}

function TaskItem ({task, onToggle, onDelete, onEdit, today} : TaskItemProps) {

  function getPriorityClass( priority: TaskPriority ) {
    switch ( priority ) {
      case 'low':
        return 'bg-priority-low'
      case 'medium':
        return 'bg-priority-medium'
      case 'high':
        return 'bg-priority-high'
      default:
        return ''
    }
  }

  return (
    <li className={`flex w-full ${getPriorityClass(task.priority)} gap-4 items-center border border-border rounded-lg p-2 h-13`}>
      <div>
        {task.emoji !== null && (
            <span className="text-xl size-9 pl-3 pr-2 cursor-default">
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
          <div className="flex gap-2">
            <span
              className={`min-w-0 truncate max-w-50 ${task.completed ? 'text-foreground-secondary line-through' : 'text-foreground'}`}
            >
              {task.title}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground-secondary">
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