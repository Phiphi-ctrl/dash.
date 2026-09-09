import { useId, type SVGProps } from "react"

type DashLogoProps = SVGProps<SVGSVGElement> & {
  size?: number
}

export function DashLogoLight({
                           size = 24,
                           ...props
                         }: DashLogoProps) {
  const id = useId()

  const morningId = `${id}-morning`
  const afternoonId = `${id}-afternoon`
  const nightId = `${id}-night`

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      {...props}
    >
      <defs>
        <linearGradient
          id={morningId}
          gradientUnits="userSpaceOnUse"
          x1="20"
          y1="17"
          x2="44"
          y2="17"
        >
          <stop offset="0%" stopColor="#fcd34d" />
          <stop offset="50%" stopColor="#fb923c" />
          <stop offset="100%" stopColor="#fb7185" />
        </linearGradient>

        <linearGradient
          id={afternoonId}
          gradientUnits="userSpaceOnUse"
          x1="20"
          y1="32"
          x2="36"
          y2="32"
        >
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>

        <linearGradient
          id={nightId}
          gradientUnits="userSpaceOnUse"
          x1="20"
          y1="47"
          x2="28"
          y2="47"
        >
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
      </defs>

      <path
        d="M20 17H44"
        stroke={`url(#${morningId})`}
        strokeWidth="6"
        strokeLinecap="round"
      />

      <path
        d="M20 32H36"
        stroke={`#ffffff`}
        strokeWidth="6"
        strokeLinecap="round"
      />

      <path
        d="M20 47H28"
        stroke={`url(#${nightId})`}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  )
}