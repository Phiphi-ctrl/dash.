type SubmitButtonProps = {
  icon: string;
}

function SubmitButton({icon}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      className="
        shrink-0
        rounded-lg
        cursor-pointer
        bg-app-surface
        border
        border-app-border
        text-text-secondary
        p-2 ml-auto
        hover:bg-app-surface-hover
        focus:outline-none
        transition-colors
        duration-400
      ">
      {icon}
    </button>
  )
}

export default SubmitButton