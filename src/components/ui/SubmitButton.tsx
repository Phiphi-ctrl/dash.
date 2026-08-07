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
        group
      ">
      <PlusIcon className="
          size-4
          origin-center
          transition-transform
          duration-300
          ease-out
          group-hover:rotate-90
        "/>
    </button>
  )
}

export default SubmitButton