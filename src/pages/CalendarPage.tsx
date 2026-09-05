import type { Task } from '../types/Task.ts'
import CalendarElement from '../components/dashboard/Calendar/CalendarElement.tsx'
import LiveDateTime from '../components/dashboard/LiveDateTime.tsx'
import { Calendar } from 'lucide-react'
import type { Category } from '../types/Category.ts'

type CalendarPageProps = {
  today: Date
  tasks: Task[]
  handleUpdateTask: (id: string, changes: Partial<Task>) => void
  handleCreateTaskAt: (startAt: Date) => void
  onEdit: (task: Task ) => void,
  onDelete: (id: string) => void,
  categories: Category[]
}

function CalendarPage( {today, tasks, handleUpdateTask, handleCreateTaskAt, onEdit, onDelete, categories}: CalendarPageProps ) {

  return (
    <main className="flex h-full min-h-0 flex-1 flex-col px-10 overflow-hidden">
      <header className="flex gap-1 items-center justify-between">
        <LiveDateTime />
        <div className="flex gap-1 text-foreground-secondary">
          <Calendar />
          <span>calendar.</span>
        </div>
      </header>
      {/*calendar section*/}
      <section className="flex min-h-0 flex-1 mt-4">
        <div className="flex min-h-0 flex-1 flex-col gap-1 w-full">
          <CalendarElement
            today={today}
            tasks={tasks}
            onUpdateTask={handleUpdateTask}
            onCreateTaskAt={handleCreateTaskAt}
            onEdit={onEdit}
            onDelete={onDelete}
            categories={categories}
          />
        </div>
      </section>
    </main>
  )
}

export default CalendarPage
