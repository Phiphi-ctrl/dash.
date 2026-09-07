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
  contentClassName = 'relative z-10',
}: FormPopoverProps) {
  const nodeId = useFloatingNodeId()
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null)
  const [floatingElement, setFloatingElement] = useState<HTMLDivElement | null>(null)
  const { context, floatingStyles, isPositioned } = useFloating({
    nodeId,
    open,
    onOpenChange,
    elements: { reference: referenceElement, floating: floatingElement },
    placement: 'bottom-start',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [offset(10), flip({ padding: 8 }), shift({ padding: 8 })],
  })
  const dismiss = useDismiss(context, {
    // Commit date inputs on blur before evaluating the existing dismissal guard.
    outsidePressEvent: 'click',
    outsidePress: () => canDismiss?.() ?? true,
    escapeKey: false,
  })
  const role = useRole(context, { role: 'dialog' })
  const { getReferenceProps, getFloatingProps } = useInteractions([dismiss, role])

  return (
    <FloatingNode id={nodeId}>
      {trigger({ ref: setReferenceElement, props: getReferenceProps() })}
      {open && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false} initialFocus={-1}
            returnFocus={false} closeOnFocusOut={false}>
            <div ref={setFloatingElement} className="fixed z-[100] p-4"
              style={{ ...floatingStyles, visibility: isPositioned ? 'visible' : 'hidden' }}
              {...getFloatingProps({ 'aria-label': label })}>
              <div className="glass-panel-bg" />
              <div className={contentClassName}>{children}</div>
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </FloatingNode>
  )
}
