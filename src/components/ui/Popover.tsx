import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import {
  arrow,
  autoUpdate,
  flip,
  FloatingFocusManager,
  FloatingNode,
  FloatingPortal,
  hide,
  offset,
  safePolygon,
  shift,
  useClick,
  useDismiss,
  useFloating,
  useFloatingNodeId,
  useFocus,
  useHover,
  useInteractions,
  useRole,
  useTransitionStyles,
  type Placement,
  type Strategy,
} from '@floating-ui/react'
import {
  popoverArrowWidth,
  popoverSurfacePadding,
  getPopoverArrowPadding,
  getPopoverSurfacePath,
  type PopoverSurface,
} from './popoverSurface.ts'

type PopoverProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  canDismiss?: () => boolean
  label: string
  trigger?: (reference: {
    ref: (element: HTMLButtonElement | null) => void
    props: Record<string, unknown>
  }) => ReactNode
  children: ReactNode
  referenceElement?: HTMLButtonElement | null
  portalRoot?: HTMLElement | null
  strategy?: Strategy
  placementInput?: Placement
  fallbackPlacements?: Placement[]
  offsetDistance?: number
  viewportPadding?: number
  hideWhenReferenceHidden?: boolean
  interaction?: 'manual' | 'click' | 'hover'
  outsidePressEvent?: 'pointerdown' | 'mousedown' | 'click'
  dismissOnScroll?: boolean
  closeOnFocusOut?: boolean
  className?: string
  showArrow?: boolean
  contentClassName?: string
}

function getTransitionStyles(scale: number, opacity: number, side: string) {
  const inset = (1 - scale) * 100
  const horizontal = side === 'left' || side === 'right'
  const top = horizontal ? inset / 2 : side === 'top' ? inset : 0
  const bottom = horizontal ? inset / 2 : side === 'top' ? 0 : inset
  const left = horizontal ? side === 'left' ? inset : 0 : inset / 2
  const right = horizontal ? side === 'left' ? 0 : inset : inset / 2

  return {
    opacity,
    transform: `scale(${scale})`,
    clipPath: `inset(${top}% ${right}% ${bottom}% ${left}% round calc(var(--radius-3xl) * ${scale}))`,
  }
}

export default function Popover({
  open, onOpenChange, canDismiss, label, trigger, children, placementInput, showArrow = false,
  referenceElement, portalRoot, strategy = 'fixed', fallbackPlacements,
  offsetDistance = 20, viewportPadding = 8, hideWhenReferenceHidden = false,
  interaction = 'manual', outsidePressEvent = 'click', dismissOnScroll = false,
  closeOnFocusOut = false, className = 'z-[100]',
  contentClassName = 'relative z-10 p-4',
}: PopoverProps) {
  const nodeId = useFloatingNodeId()
  const [triggerElement, setTriggerElement] = useState<HTMLButtonElement | null>(null)
  const [floatingElement, setFloatingElement] = useState<HTMLDivElement | null>(null)
  const [arrowElement, setArrowElement] = useState<HTMLSpanElement | null>(null)
  const [settledTransition, setSettledTransition] = useState<CSSProperties | null>(null)
  const { context, floatingStyles, isPositioned, placement, middlewareData, update } = useFloating({
    nodeId,
    open,
    onOpenChange,
    elements: { reference: referenceElement === undefined ? triggerElement : referenceElement, floating: floatingElement },
    placement: placementInput,
    strategy,
    whileElementsMounted: autoUpdate,
    middleware: [
      offset({ mainAxis: offsetDistance, crossAxis: 0 }),
      flip({ padding: viewportPadding, fallbackPlacements }),
      shift({ padding: viewportPadding }),
      showArrow && arrow(({ rects, placement }) => ({
        element: arrowElement,
        padding: getPopoverArrowPadding(
          rects.floating.width,
          rects.floating.height,
          arrowElement ? parseFloat(getComputedStyle(arrowElement).borderTopLeftRadius) : 0,
          placement.split('-')[0],
        ),
      }), [arrowElement]),
      hideWhenReferenceHidden && hide({ strategy: 'referenceHidden' }),
      showArrow && {
        name: 'surface',
        fn: ({ rects, middlewareData }) => ({
          data: {
            width: rects.floating.width,
            height: rects.floating.height,
            cornerRadius: arrowElement ? parseFloat(getComputedStyle(arrowElement).borderTopLeftRadius) : 0,
            arrowX: middlewareData.arrow?.x,
            arrowY: middlewareData.arrow?.y,
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
    outsidePressEvent,
    outsidePress: () => canDismiss?.() ?? true,
    escapeKey: true,
    ancestorScroll: dismissOnScroll,
  })
  const hover = useHover(context, {
    enabled: interaction === 'hover',
    move: false,
    delay: { open: 160, close: 120 },
    handleClose: safePolygon({ buffer: 6 }),
  })
  const focus = useFocus(context, { enabled: interaction === 'hover' })
  const click = useClick(context, { enabled: interaction !== 'manual' })
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
  const surface = middlewareData.surface as PopoverSurface | undefined
  const side = placement.split('-')[0]
  const hasArrow = showArrow && surface !== undefined &&
    (side === 'left' || side === 'right' ? surface.arrowY !== undefined : surface.arrowX !== undefined)
  const surfacePath = hasArrow ? getPopoverSurfacePath(surface, side) : undefined
  const surfaceClip = hasArrow
    ? `path('${getPopoverSurfacePath(surface, side, transitionStyles.opacity === 1 ? 1 : 0)}')`
    : clipPath
  const surfaceBounds: CSSProperties | undefined = hasArrow ? {
    inset: -popoverSurfacePadding,
    width: `calc(100% + ${2 * popoverSurfacePadding}px)`,
    height: `calc(100% + ${2 * popoverSurfacePadding}px)`,
  } : undefined
  const transformOrigin = side === 'left' ? 'right' : side === 'right' ? 'left' : side === 'top' ? 'bottom' : 'top'
  const role = useRole(context, { role: 'dialog' })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, click, dismiss, role])

  return (
    <FloatingNode id={nodeId}>
      {trigger?.({
        ref: setTriggerElement,
        props: getReferenceProps(),
      })}

      {isMounted && (
        <FloatingPortal root={portalRoot}>
          <FloatingFocusManager
            context={context}
            modal={false}
            initialFocus={-1}
            returnFocus={false}
            closeOnFocusOut={closeOnFocusOut}
          >
            <div
              ref={setFloatingElement}
              className={`pointer-events-auto ${className}`}
              data-placement={placement}
              style={{
                ...floatingStyles,
                visibility:
                  (open && !isPositioned) || (showArrow && !hasArrow) || middlewareData.hide?.referenceHidden
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
                  style={{ top: 0, left: 0, width: popoverArrowWidth, height: popoverArrowWidth }}
                />
              )}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </FloatingNode>
  )
}
