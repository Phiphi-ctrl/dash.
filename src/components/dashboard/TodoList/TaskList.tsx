import { Fragment, useEffect, useState } from 'react'
import type { Task } from '../../../types/Task.ts'
import TaskItem from './TaskItem.tsx'
import type { Category } from '../../../types/Category.ts'
import { filterTaskList, formatTaskDueDay, groupTasksByDueDay, type TaskListView } from './taskListViews.ts'

type TaskListProps = {
  tasks: Task[],
  onToggle: (id: string) => void,
  onDelete: (id: string) => void,
  onEdit: (task: Task) => void,
  categories: Category[],
  view: TaskListView
}

const emptyMessages: Record<TaskListView, string> = {
  upcoming: 'Nothing coming up...',
  completed: 'No completed tasks yet.',
  overdue: 'No overdue tasks.',
}

function TaskList({tasks, onToggle, onDelete, onEdit, view, categories} : TaskListProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(intervalId)
  }, [])

  const visibleTasks = filterTaskList(tasks, view, now)
  const dayGroups = groupTasksByDueDay(visibleTasks)

  return (
    <div className="relative mr-4 rounded-3xl">
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-40 rounded-[inherit] p-px opacity-25`}
        style={{
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          WebkitMaskComposite: 'xor',
        }}
      />
      {dayGroups.length === 0 ? (
        <p className="p-4 text-muted">{emptyMessages[view]}</p>
      ) : (
        <div className="template-scroll-fade">
          <ul key={view} className="flex flex-col gap-2 h-69 overflow-hidden overflow-y-auto dash-scrollbar rounded-[inherit] px-4 pt-3 pb-5">
            {dayGroups.map(({ date, tasks: dayTasks }) => (
              <Fragment key={date.getTime()}>
                <li className="flex shrink-0 justify-center pt-3 pb-1 first:pt-0">
                  <h4 className="glass-surface max-w-full rounded-full! px-3 py-1 text-center text-[11px] leading-4 font-medium text-foreground-secondary">
                    <time dateTime={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`}>
                      {formatTaskDueDay(date, now)}
                    </time>
                  </h4>
                </li>
                {dayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    today={now}
                    categories={categories}
                  />
                ))}
              </Fragment>
            ))}
          </ul>
        </div>

      )}
    </div>
  )
}

export default TaskList;
