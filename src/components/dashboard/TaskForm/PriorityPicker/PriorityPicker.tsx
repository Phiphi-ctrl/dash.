import type { TaskPriority } from '../../../../types/Task.ts'
import { Check } from 'lucide-react'

type PriorityPickerProps = {
  onClick: (priority: TaskPriority) => void
  currentlySelected: TaskPriority
}

type PriorityOption = {
  priority: TaskPriority,
  style: string
}

function PriorityPicker({onClick, currentlySelected}: PriorityPickerProps) {
  const priorities: PriorityOption[] = [
    {priority: 'low', style: 'bg-priority-low'},
    {priority: 'medium', style: 'bg-priority-medium'},
    {priority: 'high', style: 'bg-priority-high'},
  ]

  function isSelected(priority: TaskPriority, selected: TaskPriority): boolean {
    return priority === selected
  }

  return (
    <div className="flex flex-col">
      {priorities.map((currentPriority) => (
        <button
          type="button"
          onClick={() => onClick(currentPriority.priority)}
          aria-label={currentPriority.priority}
          className={`rounded-lg hover:bg-surface-hover`}
        >
          <div className="flex gap-3 p-2">
            <div className="flex items-center justify-center">
              <span
                className={`flex size-3 rounded-full ${currentPriority.style}`}
              />
            </div>
            <div className="flex">
              {currentPriority.priority.charAt(0).toUpperCase() +
                currentPriority.priority.slice(1)}
            </div>
            {isSelected(currentPriority.priority, currentlySelected) && (
              <div className="flex ml-auto items-center justify-center">
                <Check className="size-4" />
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

export default PriorityPicker