import { SaveCheck } from 'lucide-react'

type SaveTemplateButtonProps = {
  onSave: () => void
}

function SaveTemplateButton ({onSave}: SaveTemplateButtonProps) {
  return (
    <button
      onPointerDown={()=> console.log('pointerDown - save template')}
      onPointerUp={()=> console.log('pointerUp - save template')}
      onClick={onSave}
      type="button"
      className="
      flex
      shrink-0
      cursor-pointer
      items-center
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