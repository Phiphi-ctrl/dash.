import type { Task } from '../types/Task.ts'
import CalendarElement from '../components/dashboard/Calendar/CalendarElement.tsx'

type CalendarPageProps = {
  today: Date
  tasks: Task[]
  handleUpdateTask: (id: string, changes: Partial<Task>) => void
  handleCreateTaskAt: (startAt: Date) => void
  onEdit: (task: Task ) => void,
  onDelete: (id: string) => void,
}

function CalendarPage( {today, tasks, handleUpdateTask, handleCreateTaskAt, onEdit, onDelete}: CalendarPageProps ) {

  return (
    <main className="flex flex-1 flex-col p-10">
      {/*calendar section*/}
      <section className="flex mt-1">
        <div className="flex flex-col gap-1 w-full">
          <CalendarElement
            today={today}
            tasks={tasks}
            onUpdateTask={handleUpdateTask}
            onCreateTaskAt={handleCreateTaskAt}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </div>
      </section>
    </main>
  )
}

export default CalendarPage