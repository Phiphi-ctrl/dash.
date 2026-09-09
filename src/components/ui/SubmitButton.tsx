import {
  PlusIcon
} from 'lucide-react'


function SubmitButton() {
  return (
    <button
      type="submit"
      className="
        shrink-0
        cursor-pointer
        focus:outline-none
        text-foreground-secondary
        hover:scale-110
        hover:text-foreground
        transition-transform
        "
    >
      <PlusIcon className="size-4"/>
    </button>
  )
}

export default SubmitButton