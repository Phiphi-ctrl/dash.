import { useState } from 'react'
import type { NewTask, TaskPriority } from '../../types/Task.ts'
import SubmitButton from '../ui/SubmitButton.tsx'

type AddTaskFormProps = {
  onAddTask: (newTask : NewTask) => boolean
}

function AddTaskForm ({onAddTask}: AddTaskFormProps) {
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [newStartAt, setNewStartAt] = useState('')
  const [newEndAt, setNewEndAt] = useState('')

  function constructNewTask() {
    return {
      title: newTitle,
      priority: newPriority,
      startAt: newStartAt === '' ? null : new Date(newStartAt).toISOString(),
      endAt: newEndAt === '' ? null : new Date(newEndAt).toISOString()
    }
  }
  return (
    <form
      className="mt-4 shrink-0 flex gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        if(onAddTask(constructNewTask())) {
          setNewTitle('')
          setNewStartAt('')
          setNewEndAt('')
        }
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
        type="datetime-local"
        value={newStartAt}
        onChange={(event) => setNewStartAt(event.target.value)}
        className="flex-1 w-full rounded-lg border border-app-border bg-app-background p-3 outline-none"
      />
      <input
        type="datetime-local"
        value={newEndAt}
        onChange={(event) => setNewEndAt(event.target.value)}
        className="flex-1 w-full rounded-lg border border-app-border bg-app-background p-3 outline-none"
      />
      <select
        value={newPriority}
        onChange={(event) => setNewPriority(event.target.value as TaskPriority)}
        className="flex-1 w-full rounded-lg border border-app-border bg-app-background p-3 outline-none"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <SubmitButton icon={"+"}/>
    </form>
  )
}

export default AddTaskForm;