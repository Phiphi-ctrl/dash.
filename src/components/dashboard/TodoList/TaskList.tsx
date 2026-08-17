import type { Task } from '../../../types/Task.ts'
import TaskItem from './TaskItem.tsx'
import { isSameDay } from '../../../utils/Datetime.ts'
import type { Category } from '../../../types/Category.ts'

type TaskListProps = {
  tasks: Task[],
  onToggle: (id: string) => void,
  onDelete: (id: string) => void,
  onEdit: (task: Task) => void,
  categories: Category[],
  today: Date
}

function TaskList({tasks, onToggle, onDelete, onEdit, today, categories } : TaskListProps) {

  const filteredTodayTasks = tasks.filter((task: Task) => isSameDay(today, new Date(task.startAt)))
  return (
    <div className="h-134 overflow-hidden overflow-y-auto mr-2">
      {filteredTodayTasks.length === 0 ? (
        <p className="text-foreground-secondary">Nothing Planned yet...</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filteredTodayTasks.map((task) => (
            <TaskItem
              key = {task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              today={today}
              categories={categories}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default TaskList;