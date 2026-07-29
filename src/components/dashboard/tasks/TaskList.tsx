import type { Task } from '../../../types/Task.ts'
import TaskItem from './TaskItem.tsx'

type TaskListProps = {
  tasks: Task[],
  onToggle: (id: string) => void,
  onDelete: (id: string) => void,
  today: Date
}

function TaskList({tasks, onToggle, onDelete, today} : TaskListProps) {
  return (
    <div>
      {tasks.length === 0 ? (
        <p className="text-text-secondary">Nothing Planned yet...</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {tasks.map((task) => (
            <TaskItem
              key = {task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              today={today}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default TaskList;