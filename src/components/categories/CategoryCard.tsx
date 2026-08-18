import type { Category } from '../../types/Category.ts'
import { ArrowRight, ClockFading, LayoutList, ListChecks, Pen, Trash2 } from 'lucide-react'
import * as React from 'react'
import type { Task } from '../../types/Task.ts'
import { formatTimeMs, getHourRange, isSameDay } from '../../utils/Datetime.ts'
import { useEffect, useState } from 'react'
import CategoryDayTimeline from './CategoryDayTimeline.tsx'

type CategoryCardProps = {
  category: Category
  tasks: Task[]
  handleDeleteCategory: (id: string) => void
}

function CategoryCard ( { category, handleDeleteCategory, tasks }: CategoryCardProps ) {

  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  const currentDayTasks = tasks.filter((task) => isSameDay(new Date(task.startAt), now))

  const categoryTasks = currentDayTasks.filter((task) => task.categoryId === category.id)

  const categoryTasksCompleted = categoryTasks.filter((task) => task.completed)

  const totalDurationMs = categoryTasks.reduce((total, task) =>
    total + Date.parse(task.endAt) - Date.parse(task.startAt), 0)

  const nextTasks = categoryTasks.length !== 0 ? categoryTasks.filter((task) => new Date(task.startAt) > now) : null

  const nextTask = nextTasks ? nextTasks[0] : null

  const nextTimeRange = nextTask ? getHourRange(nextTask.startAt, nextTask.endAt) : []

  const nextTimeRangeString = nextTimeRange[0] + ' → ' + nextTimeRange[1]

  return (
    <div className="flex h-120 w-120 text-foreground-secondary p-8 glass-surface hover:-translate-y-1/48 duration-200">
      <div className="flex w-full flex-col gap-8">
        <div className="flex items-center justify-end gap-4">
          <button
          >
            <Pen className="size-4"/>
          </button>
          <button
            className="cursor-pointer"
            onClick={() => handleDeleteCategory(category.id)}
          >
            <Trash2 className="size-4"/>
          </button>
        </div>
        <div
          className="flex items-center gap-4"
          style={{
            '--category-color': category.color,
          } as React.CSSProperties}
        >
          <span className="inline-flex size-4 rounded-full bg-[var(--category-color)]" />
          <span className="text-foreground font-semibold text-xl">{category.name}</span>
        </div>
        {/*Number of tasks*/}
        <div className="grid grid-cols-2 items-center gap-4 max-w-80">
          {/*Scheduled tasks*/}
          <div className="flex items-center gap-2">
            <span><LayoutList className="size-4"/></span>
            <span>Scheduled</span>
          </div>

          <div className="flex items-center gap-1">
            <span>{categoryTasks.length}</span>
            {categoryTasks.length !== 1 ? (
              <span>entries</span>
            ) : (
              <span>entry</span>
            )}
          </div>

          {/*Total duration*/}
          <div className="flex items-center gap-2">
            <span><ClockFading className="size-4"/></span>
            <span>Total Duration</span>
          </div>

          <div className="flex items-center gap-1">
            <span>{formatTimeMs(totalDurationMs)}</span>
          </div>

          {/*Number of tasks completed*/}
          <div className="flex items-center gap-2">
            <span><ListChecks className="size-4"/></span>
            <span>Completed</span>
          </div>

          <div className="flex items-center gap-2">
            <span>{categoryTasksCompleted.length}</span>
          </div>

        </div>

        {/*Day progress bar*/}
        <CategoryDayTimeline now={now} currentDayTasks={categoryTasks} category={category} />
        {nextTask ? (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 items-center">
              <ArrowRight className="size-6" />
              <span className="text-foreground font-semibold text-xl">Next</span>
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-foreground">{nextTask.emoji}</span>
              <span className="text-foreground">{nextTask.title}</span>
              <span className="text-muted">{nextTimeRangeString}</span>
            </div>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    </div>
  )
}

export default CategoryCard;