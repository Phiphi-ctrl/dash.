import type { Task } from '../../../types/Task.ts'
import TaskItem from './TaskItem.tsx'

type TaskListProps = {
  tasks: Task[],
  onToggle: (id: string) => void,
  onDelete: (id: string) => void,
  onEdit: (task: Task) => void,
  today: Date
}

function TaskList({tasks, onToggle, onDelete, onEdit, today} : TaskListProps) {
  return (
    <div className="h-102 overflow-hidden overflow-y-auto mr-2">
      {tasks.length === 0 ? (
        <p className="text-foreground-secondary">Nothing Planned yet...</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskItem
              key = {task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              today={today}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default TaskList;