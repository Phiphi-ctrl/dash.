import { useId } from 'react'
import { useTimeOfDay, type TimeOfDayTheme } from '../../context/TimeOfDayContext.ts'

type GradientTaskButtonProps = {
  onClick: () => void
  size?: 'large' | 'compact' | 'responsive'
}

function GradientPlusIcon({
                            gradient,
                            className = "size-5",
                          }: {
  gradient: TimeOfDayTheme['dayProgressGradient']
  className?: string
}) {
  const gradientId = useId().replace(/:/g, "")

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="24"
          y2="0"
          gradientUnits="userSpaceOnUse"
        >
          {gradient.stops.map((stop) => (
            <stop
              key={stop.offset}
              offset={stop.offset}
              stopColor={stop.color}
            />
          ))}
        </linearGradient>
      </defs>

      <path
        d="M5 12h14"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 5v14"
        stroke={`url(#${gradientId})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="origin-center transition-[transform,opacity] duration-[800ms] ease-[cubic-bezier(0.36,1,0.36,1)] motion-reduce:transition-none"
        style={{
          transform: 'scaleY(calc(1 - var(--task-form-open, 0)))',
          opacity: 'calc(1 - var(--task-form-open, 0))',
        }}
      />
    </svg>
  )
}

export default function GradientTaskButton({
                                             onClick,
                                             size = 'large',
                                           }: GradientTaskButtonProps) {
  const { theme } = useTimeOfDay()

  const sizeClasses = {
    compact: `
      h-8
      w-14
      px-1
      [--task-icon-size:1.5rem]
    `,

    large: `
      w-40
      px-4
      py-2
      [--task-icon-size:5rem]
    `,

    responsive: `
      h-8
      w-14
      px-1
      [--task-icon-size:1.5rem]

      lg:h-auto
      lg:w-40
      lg:px-4
      lg:py-2
      lg:[--task-icon-size:5rem]
    `,
  }
  
  return (
    <button
      type="button"
      aria-label="Add new task"
      aria-haspopup="dialog"
      onClick={onClick}
      className={`
      flex
      glass-surface
      items-center
      shrink-0
      cursor-pointer
  
      focus-visible:outline-2
      focus-visible:outline-foreground
      focus-visible:outline-offset-4
  
      [--task-form-open:0]
  
      [:root:has([role=dialog][aria-label='New_task'])_&]:[--task-form-open:1]
  
      ${sizeClasses[size]}
    `}
    >
      <span
        className="block w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.36,1,0.36,1)] motion-reduce:transition-none"
        style={{ transform: 'translateX(calc((100% - var(--task-icon-size)) * var(--task-form-open)))' }}
      >
          <GradientPlusIcon
            gradient={theme.dayProgressGradient}
            className="size-[var(--task-icon-size)]"
          />
        </span>
    </button>
  )
}