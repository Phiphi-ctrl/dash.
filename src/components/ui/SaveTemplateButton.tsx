import { SaveCheck } from 'lucide-react'

type SaveTemplateButtonProps = {
  onSave: () => void
}

function SaveTemplateButton ({onSave}: SaveTemplateButtonProps) {
  return (
    <button
      onClick={onSave}
      type="button"
      className="
      shrink-0
      cursor-pointer
      p-3
      focus:outline-none
      text-foreground-secondary
      hover:scale-110
      hover:text-foreground
      transition-transform
     ">
      <SaveCheck
        className="
        size-4
      "/>
    </button>
  )
}

export default SaveTemplateButton