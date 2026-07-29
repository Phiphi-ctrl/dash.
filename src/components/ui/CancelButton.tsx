import { Trash2 } from 'lucide-react'

type CancelButtonProps = {
  onCancel: () => void
}

function CancelButton ({onCancel}: CancelButtonProps) {
  return (
    <button
      onClick={onCancel}
      className="
        shrink-0
        rounded-lg
        cursor-pointer
        p-3
        text-text-secondary
        focus:outline-none
     ">
      <Trash2 className="size-4" />
    </button>
  )
}

export default CancelButton