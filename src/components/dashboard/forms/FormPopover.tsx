import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import {
  arrow,
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingNode,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useInteractions,
  useRole,
  useTransitionStyles,
} from '@floating-ui/react'
import {
  formPopoverArrowWidth,
  formPopoverSurfacePadding,
  getFormPopoverArrowPadding,
  getFormPopoverSurfacePath,
  type FormPopoverSurface,
} from './formPopoverSurface.ts'

type placementOptions = 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end' | 'top' | 'bottom'

type FormPopoverProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  canDismiss?: () => boolean
  label: string
  trigger: (reference: {
    ref: (element: HTMLButtonElement | null) => void
    props: Record<string, unknown>
  }) => ReactNode
  children: ReactNode
  placementInput?: placementOptions
  showArrow?: boolean
  contentClassName?: string
}

function getTransitionStyles(scale: number, opacity: number, side: string) {
  const verticalInset = (1 - scale) * 100
  const horizontalInset = verticalInset / 2
  const top = side === 'top' ? verticalInset : 0
  const bottom = side === 'top' ? 0 : verticalInset

  return {
    opacity,
    transform: `scale(${scale})`,
    clipPath: `inset(${top}% ${horizontalInset}% ${bottom}% ${horizontalInset}% round calc(var(--radius-3xl) * ${scale}))`,
  }
}

export default function FormPopover({
  open, onOpenChange, canDismiss, label, trigger, children, placementInput, showArrow = false,
  contentClassName = 'relative z-10 p-4',
}: FormPopoverProps) {
  const nodeId = useFloatingNodeId()
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null)
  const [floatingElement, setFloatingElement] = useState<HTMLDivElement | null>(null)
  const [arrowElement, setArrowElement] = useState<HTMLSpanElement | null>(null)
  const [settledTransition, setSettledTransition] = useState<CSSProperties | null>(null)
  const { context, floatingStyles, isPositioned, placement, middlewareData, update } = useFloating({
    nodeId,
    open,
    onOpenChange,
    elements: { reference: referenceElement, floating: floatingElement },
    placement: placementInput,
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [
      offset({mainAxis: 20, crossAxis: 0}),
      flip({ padding: 8 }),
      shift({ padding: 8 }),
      showArrow && arrow(({ rects }) => ({
        element: arrowElement,
        padding: getFormPopoverArrowPadding(
          rects.floating.width,
          rects.floating.height,
          arrowElement ? parseFloat(getComputedStyle(arrowElement).borderTopLeftRadius) : 0,
        ),
      }), [arrowElement]),
      showArrow && {
        name: 'surface',
        fn: ({ rects, middlewareData }) => ({
          data: {
            width: rects.floating.width,
            height: rects.floating.height,
            cornerRadius: arrowElement ? parseFloat(getComputedStyle(arrowElement).borderTopLeftRadius) : 0,
            arrowX: middlewareData.arrow?.x,
          },
        }),
      },
    ],
  })
  useEffect(() => {
    // Reopening during exit keeps the node mounted, but resets isPositioned.
    if (open) update()
  }, [open, update])

  const dismiss = useDismiss(context, {
    // Commit date inputs on blur before evaluating the existing dismissal guard.
    outsidePressEvent: 'click',
    outsidePress: () => canDismiss?.() ?? true,
    escapeKey: true,
  })
  const {
    isMounted,
    styles: transitionStyles,
  } = useTransitionStyles(context, {
    duration: {
      open: 200,
      close: 300,
    },

    initial: ({ side }) => getTransitionStyles(0, 0, side),
    open: ({ side }) => getTransitionStyles(1, 1, side),
    close: ({ side }) => getTransitionStyles(0, 0, side),
  })
  useEffect(() => {
    if (!showArrow || !floatingElement) return
    // Placement changes can finish without emitting a clip-path transitionend.
    let cancelled = false
    const frame = requestAnimationFrame(() => {
      const animations = floatingElement.firstElementChild?.getAnimations() ?? []
      void Promise.all(animations.map(animation => animation.finished.catch(() => {}))).then(() => {
        if (!cancelled) setSettledTransition(transitionStyles)
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [floatingElement, showArrow, transitionStyles])

  const { clipPath, ...contentTransitionStyles } = transitionStyles
  const surface = middlewareData.surface as FormPopoverSurface | undefined
  const hasArrow = showArrow && surface?.arrowX !== undefined
  const side = placement.split('-')[0]
  const surfacePath = hasArrow ? getFormPopoverSurfacePath(surface, side) : undefined
  const surfaceClip = hasArrow
    ? `path('${getFormPopoverSurfacePath(surface, side, transitionStyles.opacity === 1 ? 1 : 0)}')`
    : clipPath
  const surfaceBounds: CSSProperties | undefined = hasArrow ? {
    inset: -formPopoverSurfacePadding,
    width: `calc(100% + ${2 * formPopoverSurfacePadding}px)`,
    height: `calc(100% + ${2 * formPopoverSurfacePadding}px)`,
  } : undefined
  const transformOrigin = placement.startsWith('top') ? 'bottom' : 'top'
  const role = useRole(context, { role: 'dialog' })
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss, role])

  return (
    <FloatingNode id={nodeId}>
      {trigger({
        ref: setReferenceElement,
        props: getReferenceProps(),
      })}

      {isMounted && (
        <FloatingPortal>
          <FloatingFocusManager
            context={context}
            modal={false}
            initialFocus={-1}
            returnFocus={false}
            closeOnFocusOut={false}
          >
            <div
              ref={setFloatingElement}
              className="fixed z-[100]"
              data-placement={placement}
              style={{
                ...floatingStyles,
                visibility:
                  (open && !isPositioned) || (showArrow && !hasArrow)
                    ? 'hidden'
                    : 'visible',
              }}
              {...getFloatingProps({
                'aria-label': label,
              })}
            >
              {/* Clip the blur itself; a clipped or fading ancestor blocks its backdrop. */}
              <div
                aria-hidden="true"
                className="glass-panel-bg motion-reduce:transition-none!"
                style={{
                  ...surfaceBounds,
                  clipPath: surfaceClip,
                  // Once open, geometry updates must move the glass and outline together.
                  transitionProperty: hasArrow && settledTransition === transitionStyles ? 'none' : 'clip-path',
                  transitionDuration: transitionStyles.transitionDuration,
                  border: 'none',
                  borderRadius: 0,
                  boxShadow: 'none',
                }}
              />
              <div
                className="relative motion-reduce:transition-none!"
                style={{
                  ...contentTransitionStyles,
                  transitionProperty: 'opacity, transform',
                  transformOrigin,
                }}
              >
                <div
                  aria-hidden="true"
                  className="glass-panel-bg"
                  style={{
                    background: 'none',
                    backdropFilter: 'none',
                    WebkitBackdropFilter: 'none',
                    border: hasArrow ? 'none' : undefined,
                  }}
                />
                {hasArrow && (
                  <svg
                    aria-hidden="true"
                    className="absolute pointer-events-none overflow-visible stroke-white/10"
                    style={surfaceBounds}
                  >
                    <path d={surfacePath} fill="none" strokeWidth={1} strokeLinejoin="round" />
                  </svg>
                )}
                <div className={contentClassName}>
                  {children}
                </div>
              </div>
              {showArrow && (
                <span
                  ref={setArrowElement}
                  aria-hidden="true"
                  className="absolute invisible pointer-events-none rounded-3xl"
                  style={{ top: 0, left: 0, width: formPopoverArrowWidth, height: formPopoverArrowWidth }}
                />
              )}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </FloatingNode>
  )
}
