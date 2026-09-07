import type { Task } from '../../../types/Task.ts'
import { isSameDay } from '../../../utils/Datetime.ts'

export type TaskListView = 'upcoming' | 'completed' | 'overdue'

type TaskDueDayGroup = {
  date: Date
  tasks: Task[]
}

const dueDayFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short', month: 'short', day: 'numeric',
})
const dueDayWithYearFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
})

export function groupTasksByDueDay(tasks: Task[]): TaskDueDayGroup[] {
  const groups = new Map<number, TaskDueDayGroup>()

  for (const task of tasks) {
    const date = new Date(task.endAt)
    if (!Number.isFinite(date.getTime())) continue

    date.setHours(0, 0, 0, 0)
    const day = date.getTime()
    const group = groups.get(day)
    if (group) group.tasks.push(task)
    else groups.set(day, { date, tasks: [task] })
  }

  return [...groups.values()].sort((a, b) => a.date.getTime() - b.date.getTime())
}

export function formatTaskDueDay(date: Date, now: Date): string {
  if (isSameDay(date, now)) return 'Today'

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (isSameDay(date, yesterday)) return 'Yesterday'

  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  if (isSameDay(date, tomorrow)) return 'Tomorrow'

  return (date.getFullYear() === now.getFullYear()
    ? dueDayFormatter
    : dueDayWithYearFormatter).format(date)
}

export function filterTaskList(tasks: Task[], view: TaskListView, now: Date): Task[] {
  const currentTime = now.getTime()

  return tasks.filter((task) => {
    if (view === 'upcoming') {
      const start = new Date(task.startAt)
      return isSameDay(now, start) && currentTime < start.getTime()
    }

    return new Date(task.endAt).getTime() < currentTime
      && (view === 'completed' ? task.completed : !task.completed)
  })
}
