type NavButtonProps = {
  label: string
  active?: boolean
}

function NavButton({ label, active = false }: NavButtonProps) {
  return (
    <button
      className={`
        rounded-xl
        cursor-pointer
        px-4
        py-2
        text-left
        transition-colors
        ${
          active
            ? 'bg-app-surface text-text-primary'
            : 'text-text-secondary hover:bg-app-surface-hover hover:text-text-primary'
        }
      `}
    >
      {label}
    </button>
  )
}

export default NavButton
