import type { TaskPriority } from '../../types/Task.ts'

type PriorityButtonProps = {
  icon: string,
  selectedPriority: TaskPriority,
  buttonPriority: TaskPriority
  background: string,
  onClick: () => void,
}

function PriorityButton({icon, selectedPriority, buttonPriority, background, onClick}: PriorityButtonProps) {

  return (
    <button
      type="button"
      onClick={ onClick }
      className={`border border-app-border rounded-lg text-text-secondary p-2 ${
        buttonPriority === selectedPriority ?  background : 'bg-app-surface'
      } `}
      aria-pressed={ buttonPriority === selectedPriority }
      aria-label={`${buttonPriority} priority`}
    >
      {icon}
    </button>
  )
}

export default PriorityButton