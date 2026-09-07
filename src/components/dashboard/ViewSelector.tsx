import { useRef, useState } from 'react'
import {
  autoUpdate, flip, FloatingFocusManager, FloatingPortal, offset, shift,
  useClick, useDismiss, useFloating, useInteractions, useListNavigation, useRole,
} from '@floating-ui/react'
import { Check, ChevronDown } from 'lucide-react'

type ViewSelectorProps<View extends string> = {
  view: View
  options: ReadonlyArray<{ value: View; label: string }>
  label: string
  disabled?: boolean
  onSelect: (view: View) => void
}

export default function ViewSelector<View extends string>({
  view, options, label, disabled = false, onSelect,
}: ViewSelectorProps<View>) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [referenceElement, setReferenceElement] = useState<HTMLButtonElement | null>(null)
  const [floatingElement, setFloatingElement] = useState<HTMLDivElement | null>(null)
  const listRef = useRef<Array<HTMLButtonElement | null>>([])
  const selectedIndex = options.findIndex((option) => option.value === view)
  const selectedLabel = options[selectedIndex]?.label ?? view
  const { context, floatingStyles, isPositioned } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    elements: { reference: referenceElement, floating: floatingElement },
    placement: 'bottom-start',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip({ padding: 8 }), shift({ padding: 8 })],
  })
  const click = useClick(context, { enabled: !disabled })
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'menu' })
  const navigation = useListNavigation(context, {
    listRef,
    activeIndex,
    selectedIndex,
    onNavigate: setActiveIndex,
    loop: true,
    enabled: !disabled,
  })
  const { getReferenceProps, getFloatingProps, getItemProps } =
    useInteractions([click, dismiss, role, navigation])

  return (
    <>
      <button
        ref={setReferenceElement}
        type="button"
        disabled={disabled}
        className="glass-surface flex h-8 items-center gap-1.5 rounded-full! px-3 text-xs font-normal text-foreground-secondary enabled:cursor-pointer enabled:hover:text-foreground disabled:cursor-default focus-visible:outline-2 focus-visible:outline-foreground focus-visible:outline-offset-2"
        {...getReferenceProps({ 'aria-label': `${label}: ${selectedLabel}` })}
      >
        <span>{selectedLabel}</span>
        <ChevronDown aria-hidden="true" className={`size-3.5 transition-transform duration-150 motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''} ${disabled ? 'opacity-40' : ''}`} />
      </button>
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false} disabled={!isPositioned}>
            <div
              ref={setFloatingElement}
              className="glass-surface z-[100] min-w-28 rounded-lg! p-1 text-xs text-foreground-secondary"
              style={{ ...floatingStyles, visibility: isPositioned ? 'visible' : 'hidden' }}
              {...getFloatingProps({ 'aria-label': `Choose ${label.toLowerCase()}` })}
            >
              {options.map((option, index) => (
                <button
                  key={option.value}
                  ref={(element) => { listRef.current[index] = element }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={view === option.value}
                  tabIndex={activeIndex === index ? 0 : -1}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-md px-3 py-2 text-left hover:bg-muted/10 hover:text-foreground focus-visible:bg-muted/10 focus-visible:text-foreground focus-visible:outline-none aria-checked:text-foreground"
                  {...getItemProps({
                    onClick: () => {
                      onSelect(option.value)
                      setIsOpen(false)
                    },
                  })}
                >
                  <span>{option.label}</span>
                  <Check aria-hidden="true" className={`size-3.5 ${view === option.value ? '' : 'invisible'}`} />
                </button>
              ))}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  )
}
