import type { TaskPriority } from '../../types/Task.ts'
import type { LucideIcon } from 'lucide-react'

type PriorityButtonProps = {
  Icon: LucideIcon,
  selectedPriority: TaskPriority,
  buttonPriority: TaskPriority
  background: string,
  onClick: () => void,
}

function PriorityButton({Icon, selectedPriority, buttonPriority, background, onClick}: PriorityButtonProps) {

  return (
    <button
      type="button"
      onClick={ onClick }
      className={`
      flex
      items-center
      justify-center
      border 
      border-border 
      rounded-lg 
      text-foreground-secondary 
      p-2 
      ${
        buttonPriority === selectedPriority ?  background : 'bg-app-surface'
      } 
      `}
      aria-pressed={ buttonPriority === selectedPriority }
      aria-label={`${buttonPriority} priority`}
    >
      <Icon className="size-4"/>
    </button>
  )
}

export default PriorityButton