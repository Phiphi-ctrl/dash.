import type { Task } from '../../../types/Task.ts'

type TaskItemProps = {
  task: Task,
  onToggle: ( id: string ) => void,
  onDelete: ( id: string ) => void
}

function TaskItem ({task, onToggle, onDelete} : TaskItemProps) {
  return (
    <li className="flex w-full items-center gap-2">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
      />
      <span
        className={
          task.completed
            ? 'text-text-secondary line-through flex-1'
            : 'text-text-primary flex-1'
        }
      >
        {task.title}
      </span>
      <button
        className="rounded-lg bg-app-surface border border-app-border text-text-secondary p-2 ml-auto hover:bg-app-surface-hover focus:outline-none"
        type="button"
        onClick={() => onDelete(task.id)}
      >
        🗑️
      </button>
    </li>
  )
}

export default TaskItem;