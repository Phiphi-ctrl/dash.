import { ChevronsRight } from 'lucide-react'

type CancelButtonProps = {
  onCancel: () => void
}

function CancelButton ({onCancel}: CancelButtonProps) {
  return (
    <button
      onClick={onCancel}
      className="
      group
      shrink-0
      rounded-lg
      cursor-pointer
      p-3
      text-text-secondary
      focus:outline-none
     ">
      <ChevronsRight
        className="
        size-5
        origin-center
        transition-transform
        duration-300
        ease-out
      "/>
    </button>
  )
}

export default CancelButton