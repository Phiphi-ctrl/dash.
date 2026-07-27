export type Task = {
  id: string
  title: string
  completed: boolean
  priority: TaskPriority
  createdAt: string
  startAt: string
  endAt: string
}

export type TaskPriority = "low" | "medium" | "high"

export type NewTask = {
  title: string
  priority: TaskPriority
  startAt: string | null
  endAt: string | null
}