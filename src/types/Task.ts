export type Task = {
  id: string
  title: string
  completed: boolean
  priority: TaskPriority
  startAt: string
  endAt: string
  createdAt: string
  emoji: string | null
}

export type TaskPriority = "low" | "medium" | "high"

export type NewTask = {
  title: string
  priority: TaskPriority
  startAt: string | null
  endAt: string | null
  emoji: string | null
}

export type TaskTemplate = {
  id: string
  title: string
  priority: TaskPriority
  emoji: string | null
}