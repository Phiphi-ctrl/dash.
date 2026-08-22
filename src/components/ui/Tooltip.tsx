import type {
  ReactNode,
} from 'react'

import {
  useState,
} from 'react'

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  useTransitionStyles,
  type Placement,
} from '@floating-ui/react'

type CollisionPadding =
  | number
  | {
  top: number
  right: number
  bottom: number
  left: number
}

type TooltipProps = {
  content: ReactNode
  children: ReactNode

  active?: boolean
  delay?: number

  /*
   * Preferred position only.
   * Floating UI may flip it when needed.
   */
  placement?: Placement

  /*
   * Optional custom collision boundary,
   * useful for the Notes editor.
   */
  collisionBoundary?: Element | null

  collisionPadding?: CollisionPadding
}

function Tooltip({
                   content,
                   children,
                   active = true,
                   delay = 400,
                   placement = 'top',
                   collisionBoundary = null,
                   collisionPadding = 8,
                 }: TooltipProps) {
  const [
    isOpen,
    setIsOpen,
  ] =
    useState(false)

  const [
    referenceElement,
    setReferenceElement,
  ] =
    useState<HTMLDivElement | null>(null)

  const [
    floatingElement,
    setFloatingElement,
  ] =
    useState<HTMLDivElement | null>(null)

  const {
    context,
    floatingStyles,
  } =
    useFloating({
      open:
        active &&
        isOpen,

      onOpenChange:
      setIsOpen,

      elements: {
        reference:
        referenceElement,

        floating:
        floatingElement,
      },

      placement,

      strategy:
        'fixed',

      whileElementsMounted:
      autoUpdate,

      middleware: [
        offset(8),

        flip({
          boundary:
            collisionBoundary ??
            'clippingAncestors',

          padding:
          collisionPadding,
        }),

        shift({
          boundary:
            collisionBoundary ??
            'clippingAncestors',

          padding:
          collisionPadding,
        }),
      ],
    })

  const hover =
    useHover(
      context,
      {
        enabled:
        active,

        move:
          false,

        delay: {
          open:
          delay,

          close:
            0,
        },
      },
    )

  const focus =
    useFocus(
      context,
      {
        enabled:
        active,
      },
    )

  const role =
    useRole(
      context,
      {
        role:
          'tooltip',
      },
    )

  const {
    getReferenceProps,
    getFloatingProps,
  } =
    useInteractions([
      hover,
      focus,
      role,
    ])

  const {
    isMounted,
    styles:
      transitionStyles,
  } =
    useTransitionStyles(
      context,
      {
        duration: {
          open:
            100,

          close:
            100,
        },

        initial: {
          opacity:
            0,
        },

        open: {
          opacity:
            1,
        },

        close: {
          opacity:
            0,
        },
      },
    )

  return (
    <>
      <div
        ref={
          setReferenceElement
        }

        {...getReferenceProps({
          onPointerDown: () => {
            setIsOpen(false)
          },

          onClick: () => {
            setIsOpen(false)
          },
        })}

        className="
          flex
        "
      >
        {children}
      </div>

      {active &&
        isMounted && (
          <FloatingPortal>
            <div
              ref={
                setFloatingElement
              }

              {...getFloatingProps()}

              style={{
                ...floatingStyles,
                ...transitionStyles,
              }}

              className="
                pointer-events-none
                z-[120]

                whitespace-nowrap

                glass-surface

                px-2
                py-2

                text-xs
                font-medium
                text-foreground-secondary

                shadow-lg
              "
            >
              {content}
            </div>
          </FloatingPortal>
        )}
    </>
  )
}

export default Tooltip