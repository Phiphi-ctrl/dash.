import type { Task } from '../../../types/Task.ts'
import { useEffect, useState } from 'react'
import ActiveTaskCard from './ActiveTaskCard.tsx'


type ActiveTaskProps = {
  tasks: Task[]
  today: Date
  onToggle: ( id: string ) => void,
}

function ActiveTask ({tasks, today, onToggle}: ActiveTaskProps) {

  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const intervalId = setInterval(() => {
      setNow(new Date())
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const activeTasks = tasks.filter((task) => {
    const start = new Date(task.startAt)
    const end = new Date(task.endAt)

    return start <= now && now < end && !task.completed;
  })

  const selectedTask =
    activeTasks.find((task) => task.id === selectedTaskId) ?? activeTasks[0]



  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap rounded-lg gap-2 h-15">
        {activeTasks.map((task) => (
          <button
            type="button"
            key={task.id}
            onClick={() => {
              setSelectedTaskId(task.id)
            }}
            className={`
            flex 
            gap-2 
            cursor-pointer 
            border
            ${task.id === selectedTask?.id ? 'border-accent bg-accent-soft' : 'border-border'}
            rounded-4xl 
            p-4
            `}
          >
            <span>{task.emoji}</span>
            <span className="font-semibold mr-2">{task.title}</span>
          </button>
        ))}
      </div>
      <ActiveTaskCard
        activeTask={selectedTask}
        today={today}
        onToggle={onToggle}
        now={now}
        key={selectedTask?.id ?? 'no-active-task'}
      />
    </div>
  )
}

export default ActiveTask
