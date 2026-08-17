export type TaskPriority = "low" | "medium" | "high"

export type Task = {
  id: string
  title: string
  completed: boolean
  priority: TaskPriority
  startAt: string
  endAt: string
  createdAt: string
  emoji: string | null
  completedAt: string
  categoryId: string | null
}

export type NewTask = {
  title: string
  priority: TaskPriority
  startAt: string | null
  endAt: string | null
  emoji: string | null
  completed: boolean
  categoryId: string | null
}

export type TaskTemplate = {
  id: string
  title: string
  priority: TaskPriority
  emoji: string | null
  categoryId: string | null
}