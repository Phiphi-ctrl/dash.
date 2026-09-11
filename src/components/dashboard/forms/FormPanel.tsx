import { useState, type ReactNode } from 'react'
import {
  FloatingFocusManager,
  FloatingNode,
  FloatingOverlay,
  FloatingPortal,
  FloatingTree,
  useFloating,
  useFloatingNodeId,
  useInteractions,
  useRole,
} from '@floating-ui/react'

type FormPanelProps = {
  label: string
  children: ReactNode
  isClosing?: boolean
}

function FormPanelContent({ label, children, isClosing = false }: FormPanelProps) {
  const nodeId = useFloatingNodeId()
  const [floatingElement, setFloatingElement] = useState<HTMLDivElement | null>(null)
  const { context } = useFloating({ nodeId, open: true, elements: { floating: floatingElement } })
  const role = useRole(context, { role: 'dialog' })
  const { getFloatingProps } = useInteractions([role])

  // Keep the existing edge-aligned layout; only portal and focus ownership change.
  return (
    <FloatingNode id={nodeId}>
      <FloatingPortal>
        <FloatingOverlay
          className="fixed inset-0 z-50 flex justify-end p-2 overflow-hidden text-white"
          style={{ overflow: 'hidden' }}
        >
          <FloatingFocusManager context={context} order={['floating', 'content']} closeOnFocusOut={false}>
            <div
              ref={setFloatingElement}
              className={`
              w-100
              lg:w-fit
              max-w-lg
              p-1
              glass-surface
              outline-none
              motion-reduce:animate-none
          
              ${
                isClosing
                  ? "animate-[task-form-exit_700ms_cubic-bezier(0.36,1,0.36,1)_both]"
                  : "animate-[task-form-enter_700ms_cubic-bezier(0.36,1,0.36,1)_both]"
              }
              `}
              {...getFloatingProps({ 'aria-label': label })}
            >
              {children}
            </div>
          </FloatingFocusManager>
        </FloatingOverlay>
      </FloatingPortal>
    </FloatingNode>
  )
}

export default function FormPanel(props: FormPanelProps) {
  return (
    <FloatingTree>
      <FormPanelContent {...props} />
    </FloatingTree>
  )
}
