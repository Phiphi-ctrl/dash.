import { useState, type ReactNode } from 'react'
import {
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
  contentClassName?: string
}

export default function FormPopover({
  open, onOpenChange, canDismiss, label, trigger, children,
  contentClassName = 'relative z-10 p-4',
}: FormPopoverProps) {
  const nodeId = useFloatingNodeId()
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null)
  const [floatingElement, setFloatingElement] = useState<HTMLDivElement | null>(null)
  const { context, floatingStyles, isPositioned, placement } = useFloating({
    nodeId,
    open,
    onOpenChange,
    elements: { reference: referenceElement, floating: floatingElement },
    placement: 'bottom-end',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [offset({mainAxis: 20, crossAxis: 0}), flip({ padding: 8 }), shift({ padding: 0 })],
  })
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
      close: 200,
    },

    initial: {
      opacity: 0,
      transform: 'scale(0.24)',
    },

    open: {
      opacity: 1,
      transform: 'scale(1)',
    },

    close: {
      opacity: 0,
      transform: 'scale(0.27)',
    },
  })
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
              style={{
                ...floatingStyles,
                visibility:
                  open && !isPositioned
                    ? 'hidden'
                    : 'visible',
              }}
              {...getFloatingProps({
                'aria-label': label,
              })}
            >
              <div
                style={{
                  ...transitionStyles,
                  transformOrigin,
                }}
              >
                <div className="glass-panel-bg" />
                <div className={contentClassName}>
                  {children}
                </div>
              </div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </FloatingNode>
  )
}
