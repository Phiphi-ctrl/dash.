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
      focus:outline-none
      text-foreground-secondary
      hover:scale-110
      hover:text-foreground
      transition-transform
      "
    >
      <div className="rounded-4xl solid-surface p-1.5">
        <ChevronsRight
          className="
        size-5
      "/>
      </div>

    </button>
  )
}

export default CancelButton