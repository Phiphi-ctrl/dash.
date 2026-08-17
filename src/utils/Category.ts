import type { Category } from '../types/Category.ts'
import type { Task } from '../types/Task.ts'

export const DEFAULT_TASK_COLOR = '#36374d'

export function getTaskColor(
  task: Task | undefined,
  categories: Category[],
): string {
  if (!task) {
    return ''
  }
  const category = categories.find(
    (category) => category.id === task.categoryId
  )

  return category?.color ?? DEFAULT_TASK_COLOR
}

export function getTaskCategory(
  task: Task,
  categories: Category[],
): string {
  const category = categories.find(
    (category) => category.id === task.categoryId
  )

  return category?.name ?? 'No Category'
}