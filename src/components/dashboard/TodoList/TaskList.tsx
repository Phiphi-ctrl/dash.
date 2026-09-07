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
  now: Date
}

function UpcomingTaskList({tasks, onToggle, onDelete, onEdit, now, categories } : TaskListProps) {

  const filteredTodayTasks = tasks.filter((task: Task) => isSameDay(now, new Date(task.startAt)))

  const filteredUpcomingTasks = filteredTodayTasks.filter((task: Task) => now.getTime() < new Date(task.startAt).getTime())

  return (
    <div className="mr-2">
      {filteredUpcomingTasks.length === 0 ? (
        <p className="text-foreground-secondary">Nothing coming up...</p>
      ) : (
        <ul className="flex flex-col gap-2 h-69 overflow-hidden overflow-y-auto dash-scrollbar mr-2 px-4 pb-5">
          {filteredUpcomingTasks.map((task) => (
            <TaskItem
              key = {task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onEdit={onEdit}
              today={now}
              categories={categories}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default UpcomingTaskList;
