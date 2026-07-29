import {
  PlusIcon
} from 'lucide-react'


function SubmitButton() {
  return (
    <button
      type="submit"
      className="
        shrink-0
        p-3
        rounded-lg
        cursor-pointer
        text-text-secondary
        focus:outline-none
      ">
      <PlusIcon className="size-4"/>
    </button>
  )
}

export default SubmitButton