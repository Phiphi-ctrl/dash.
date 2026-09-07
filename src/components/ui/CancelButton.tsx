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
      cursor-pointer
      p-3
      focus:outline-none
      text-foreground-secondary
      hover:scale-110
      hover:text-foreground
      transition-transform
      "
    >
      <ChevronsRight
        className="
        size-5
      "/>
    </button>
  )
}

export default CancelButton