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
      <div className="flex items-center gap-2 solid-surface py-2 px-3">
        <PlusIcon className="size-4"/>
        <span className="text-xs">Add task</span>
      </div>

    </button>
  )
}

export default SubmitButton