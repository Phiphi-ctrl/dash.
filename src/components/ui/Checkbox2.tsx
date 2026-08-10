import { Check, CheckCheck } from 'lucide-react'

type CheckboxProps = {
  checked: boolean
  onChange: () => void
  classNameUnchecked: string
  classNameChecked: string
}

function Checkbox({ checked, onChange, classNameUnchecked, classNameChecked}: CheckboxProps) {
  return (
    <label
      className={`
        shrink-0
        p-2
        rounded-lg
        cursor-pointer
        ${checked ? classNameChecked : classNameUnchecked}
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
        {checked ? <CheckCheck className="size-4" /> : <Check className="size-4"/>}

      </span>
    </label>
  )
}

export default Checkbox