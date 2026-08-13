import * as React from 'react'

type PulseDotProps = {
  className?: string
  color?: string
}

function PulseDot({ color, className = '' }: PulseDotProps) {
  return (
    <span
      className={`relative flex size-3 ${className}`}
      aria-hidden="true"
      style={{
        '--task-color-active': color,
      } as React.CSSProperties}
    >
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--task-color-active)] opacity-80" />

      <span className="relative inline-flex size-3 rounded-full bg-[var(--task-color-active)]" />
    </span>
  )
}

export default PulseDot