type ButtonProps = {
  onClick: () => void,
  icon?: string,
}

function Button ({onClick, icon = 'Button'}: ButtonProps) {
  return (
    <button
      className="
        shrink-0
        rounded-lg
        cursor-pointer
        bg-app-surface
        border
        border-app-border
        text-text-secondary
        p-2 ml-auto
        hover:bg-app-surface-hover
        focus:outline-none
        transition-colors
        duration-400
        "
      type="button"
      onClick={onClick}
    >
      {icon}️
    </button>
  )
}

export default Button