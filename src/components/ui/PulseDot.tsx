type PulseDotProps = {
  className?: string
}

function PulseDot({ className = '' }: PulseDotProps) {
  return (
    <span
      className={`relative flex size-3 ${className}`}
      aria-hidden="true"
    >
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-accent-secondary opacity-80" />

      <span className="relative inline-flex size-3 rounded-full bg-accent-secondary" />
    </span>
  )
}

export default PulseDot