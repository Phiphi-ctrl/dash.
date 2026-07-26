import { useState } from 'react'
import type { newTask, TaskPriority } from '../../types/Task.ts'

type AddTaskFormProps = {
  onAddTask: (newTask : newTask) => void
}

function AddTaskForm ({onAddTask}: AddTaskFormProps) {
  const [newTitle, setNewTitle] = useState('')
  const [newDueDate, setDueDate] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')

  function constructNewTask(newTitle : string, newDueDate : string, newPriority : TaskPriority) {
    return {
      title: newTitle,
      priority: newPriority,
      dueDate: newDueDate,
    }
  }

  return (
    <form
      className="mt-4 shrink-0 flex gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        onAddTask(constructNewTask(newTitle, newDueDate, newPriority))
        setNewTitle('')
        setDueDate('')
        setNewPriority('medium')
      }}
    >
      <input
        type="text"
        value={newTitle}
        onChange={(event) => setNewTitle(event.target.value)}
        placeholder="Add a task ..."
        className="flex-1 w-full rounded-lg border border-app-border bg-app-background p-3 outline-none"
      />
      <input
        type="date"
        value={newDueDate}
        onChange={(event) => setDueDate(event.target.value)}
        defaultValue={newDueDate}
        className="flex-1 w-full rounded-lg border border-app-border bg-app-background p-3 outline-none"
      />
      <select
        value={newPriority}
        onChange={(event) => setNewPriority(event.target.value as TaskPriority)}
        defaultValue={newPriority}
        className="flex-1 w-full rounded-lg border border-app-border bg-app-background p-3 outline-none"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <button type="submit" className="rounded-lg bg-white text-black p-3 cursor-pointer">
        +
      </button>
    </form>
  )
}

export default AddTaskForm;