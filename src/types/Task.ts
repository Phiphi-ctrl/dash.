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
  color: string
}

export type TaskPriority = "low" | "medium" | "high"

export type NewTask = {
  title: string
  priority: TaskPriority
  startAt: string | null
  endAt: string | null
  emoji: string | null
  completed: boolean
  color: string
}

export type TaskTemplate = {
  id: string
  title: string
  priority: TaskPriority
  emoji: string | null
}