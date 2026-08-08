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
      group
      shrink-0
      rounded-lg
      cursor-pointer
      p-3
      text-text-secondary
      focus:outline-none
     ">
      <SaveCheck
        className="
        size-4
      "/>
    </button>
  )
}

export default SaveTemplateButton