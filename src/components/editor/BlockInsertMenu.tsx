import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react'
import { useState } from 'react'
import {
  blockOptions,
  type BlockInsertCommand,
} from './blockDefinitions.ts'

type BlockInsertMenuProps = {
  anchorElement: HTMLElement | null

  onSelect: (
    command: BlockInsertCommand
  ) => void
  excludeColumns: boolean
}

function BlockInsertMenu({ onSelect, anchorElement, excludeColumns }: BlockInsertMenuProps) {

  const [
    floatingElement,
    setFloatingElement,
  ] = useState<HTMLDivElement | null>(null)

  const collisionBoundary =
    anchorElement?.closest(
      '[data-note-scroll-viewport]'
    ) as HTMLElement | null

  const collisionPadding = {
    top: 88,
    right: 12,
    bottom: 12,
    left: 12,
  }

  const {
    floatingStyles,
  } = useFloating({
    open: true,

    elements: {
      reference: anchorElement,
      floating: floatingElement,
    },

    placement: 'bottom-start',

    strategy: 'fixed',

    whileElementsMounted: autoUpdate,

    middleware: [
      offset(12),

      flip({
        boundary:
          collisionBoundary ??
          'clippingAncestors',

        padding:
        collisionPadding,

        fallbackPlacements: [
          'top-start',
        ],
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

  const filteredBlockOptions = excludeColumns ? blockOptions.filter((option) => option.label !== 'Columns') : blockOptions

  return (
    <FloatingPortal>
      <div
        ref={setFloatingElement}
        style={floatingStyles}
        data-block-insert-menu

        className="
          z-100
          w-64
          max-h-60
          overflow-hidden
          overflow-y-auto
          scrollbar-none

          glass-surface

          px-1.5
          py-2

          shadow-lg
        "
      >
        <div
          className="
            px-2
            pb-1.5
            pt-1

            text-[11px]
            font-semibold
            uppercase
            tracking-wide
            text-muted
          "
        >
          Basic blocks
        </div>

        {filteredBlockOptions.map(
          ({
             label,
             description,
             Icon,
             command,
           }) => (
            <button
              key={
                command.type === 'heading'
                  ? `heading-${command.level}`
                  : command.type
              }
              type="button"
              draggable={false}
              onMouseDown={(event) => {
                /*
                 * Don't let the DragHandle
                 * interpret this as a drag.
                 */
                event.preventDefault()
                event.stopPropagation()
              }}
              onClick={() => {
                onSelect(command)
              }}
              className="
                flex
                w-full
                cursor-pointer
                items-center
                gap-3

                rounded-xl
                px-2
                py-2

                text-left

                transition-colors

                hover:bg-surface-hover
              "
            >
              <div
                className="
                  flex
                  h-8
                  w-8
                  shrink-0
                  items-center
                  justify-center

                  rounded-md
                  bg-surface-hover

                  text-foreground-secondary
                "
              >
                <Icon size={17} />
              </div>

              <div className="min-w-0">
                <div
                  className="
                    text-sm
                    font-medium
                    text-foreground
                  "
                >
                  {label}
                </div>

                <div
                  className="
                    text-xs
                    text-muted
                  "
                >
                  {description}
                </div>
              </div>
            </button>
          ),
        )}
      </div>
    </FloatingPortal>
  )
}

export default BlockInsertMenu