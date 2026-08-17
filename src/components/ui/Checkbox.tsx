import { CheckCheck } from 'lucide-react'

type CheckboxProps = {
  checked: boolean
  onChange: () => void
  className: string
}

function Checkbox({ checked, onChange, className}: CheckboxProps) {
  return (
    <label
      className={`
        shrink-0
        p-3
        rounded-4xl
        cursor-pointer
        ${className}
        transition-colors
        duration-400
        `}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span>
          <CheckCheck className="size-4" />
      </span>
    </label>
  )
}

export default Checkbox