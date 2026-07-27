type CheckboxProps = {
  checked: boolean
  onChange: () => void
}

function Checkbox({ checked, onChange }: CheckboxProps) {
  return (
    <label className="
        shrink-0
        rounded-lg cursor-pointer
        bg-app-surface border
        border-app-border
        text-text-secondary
        px-3
        py-2
        hover:bg-app-surface-hover
        transition-colors
        duration-400
       ">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span>
          ✓
        </span>
    </label>
  )
}

export default Checkbox