import type { LucideIcon } from 'lucide-react'
import {
  forwardRef,
  type ButtonHTMLAttributes,
} from 'react'

type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'children' | 'className'
> & {
  Icon: LucideIcon,
  className: string
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button ({
  onClick,
  Icon,
  className,
  type = 'button',
  ...buttonProps
}: ButtonProps, ref) {
  return (
    <button
      ref={ref}
      className={`
        shrink-0
        p-3
        rounded-4xl
        cursor-pointer
        ${className}
        focus:outline-none
        transition-colors
        duration-400
        `}
      type={type}
      onClick={onClick}
      {...buttonProps}
    >
      <Icon className="size-4" />
    </button>
  )
})

export default Button
