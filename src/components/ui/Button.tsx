import type { LucideIcon } from 'lucide-react'

type ButtonProps = {
  onClick: () => void,
  Icon: LucideIcon,
  className: string
}

function Button ({onClick, Icon, className}: ButtonProps) {
  return (
    <button
      className={`
        shrink-0
        p-3
        rounded-lg
        cursor-pointer
        border
        ${className}
        focus:outline-none
        transition-colors
        duration-400
        `}
      type="button"
      onClick={onClick}
    >
      <Icon className="size-4" />
    </button>
  )
}

export default Button