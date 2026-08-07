import { Trash2 } from 'lucide-react'

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
      <Trash2
        className="
        size-4
        origin-center
        transition-transform
        duration-300
        ease-out
        group-hover:animate-bin-shake
      "/>
    </button>
  )
}

export default CancelButton