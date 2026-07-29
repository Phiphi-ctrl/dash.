import type { LucideIcon } from 'lucide-react'

type ButtonProps = {
  onClick: () => void,
  Icon: LucideIcon,
  borderBgTextHoverStyle: string
}

function Button ({onClick, Icon, borderBgTextHoverStyle}: ButtonProps) {
  return (
    <button
      className={`
        shrink-0
        p-3
        rounded-lg
        cursor-pointer
        border
        ${borderBgTextHoverStyle}
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