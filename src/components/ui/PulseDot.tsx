import * as React from 'react'

type PulseDotProps = {
  className?: string
  color: string
  pulse: boolean
}

function PulseDot({ color, className = '', pulse }: PulseDotProps) {
  return (
    <span
      className={`relative flex size-3 ${className}`}
      aria-hidden="true"
      style={{
        '--task-color-active': color,
      } as React.CSSProperties}
    >
      {pulse ? (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--task-color-active)] opacity-80" />
      ) : (
        <span></span>
      )}
      <span className="relative inline-flex size-3 rounded-full bg-[var(--task-color-active)]" />
    </span>
  )
}

export default PulseDot