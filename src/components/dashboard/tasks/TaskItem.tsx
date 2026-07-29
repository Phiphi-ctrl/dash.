import type { Task, TaskPriority } from '../../../types/Task.ts'
import Checkbox from '../../ui/Checkbox.tsx'
import Button from '../../ui/Button.tsx'
import { Trash2 } from 'lucide-react'

type TaskItemProps = {
  task: Task,
  onToggle: ( id: string ) => void,
  onDelete: ( id: string ) => void
  today: Date
}

function TaskItem ({task, onToggle, onDelete, today} : TaskItemProps) {
  const start = new Date(task.startAt)
  const end = new Date(task.endAt)

  function getPriorityClass( priority: TaskPriority ) {
    switch ( priority ) {
      case 'low':
        return 'bg-app-priority-low'
      case 'medium':
        return 'bg-app-priority-medium'
      case 'high':
        return 'bg-app-priority-high'
      default:
        return ''
    }
  }

  function isSameDay(first: Date, second: Date) {
    return (
      first.getFullYear() === second.getFullYear() &&
      first.getMonth() === second.getMonth() &&
      first.getDate() === second.getDate()
    )
  }

  const timeFormatter = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })

  const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })

  function getDuration(start: Date, end: Date) {
    const duration = (end.getTime() - start.getTime()) / 1000 / 60
    const hours = Math.floor(duration / 60)
    const minutes = duration % 60
    if(hours === 0) {
      return `${minutes}m`
    }
    if (minutes === 0) {
      return `${hours}h`
    }
    return `${hours}h ${minutes}m`
  }

  function getTimeRange(start: Date, end: Date) {
    // both today
    if(isSameDay(start, end) && isSameDay(today, start)) {
      return `Today ${timeFormatter.format(start)} → ${timeFormatter.format(end)}`
    }
    if(isSameDay(start, end)) {
      return `${dateTimeFormatter.format(start)} → ${timeFormatter.format(end)}`
    }
    return `${dateTimeFormatter.format(start)} → ${dateTimeFormatter.format(end)}`
  }

  return (
    <li className={`flex w-full ${getPriorityClass(task.priority)} gap-4 cursor-pointer border items-center border-app-border rounded-lg p-2`}>
      <Checkbox
        checked={task.completed}
        onChange={() => onToggle(task.id)}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span
            className={`min-w-0 truncate flex-1 max-w-50 ${task.completed ? 'text-text-secondary line-through' : 'text-text-primary'}`}
          >
            {task.title}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <span>
            Duration: {getDuration(start, end)}
          </span>
          <span>
            Time range: {getTimeRange(start, end)}
          </span>
        </div>
      </div>
      <Button
        onClick={() => onDelete(task.id)}
        Icon={Trash2}
        borderBgTextHoverStyle={`
        border-app-border 
        bg-app-surface 
        text-text-muted 
        hover:bg-app-bg-delete-button-hover 
        hover:border-app-border-delete-button-hover 
        hover:text-text-delete-button-hover
        `}
      />
    </li>
  )
}

export default TaskItem;