import {
  ChevronRight,
  Palette,
  Trash2,
} from 'lucide-react'

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  safePolygon,
  shift,
  useClick,
  useFloating,
  useHover,
  useInteractions,
} from '@floating-ui/react'

import {
  useState,
} from 'react'

import { editorColors } from '../utils/editorColors.ts'
import * as React from 'react'

type BlockActionMenuProps = {
  anchorElement: HTMLElement | null

  onDelete: () => void

  onTextColor: (
    color: string | null
  ) => void

  onBackgroundColor: (
    color: string | null
  ) => void
}

type ColorSectionProps = {
  selectorLabel: string

  onSelect: (
    color: string | null
  ) => void
}

function ColorSection({
                        selectorLabel,
                        onSelect,
                      }: ColorSectionProps) {
  return (
    <div>
      <div
        className="

          mb-2
          text-xs
          font-semibold
          text-foreground-secondary
        "
      >
        {selectorLabel}
      </div>

      <div
        className="
          flex
          flex-col
          gap-2
        "
      >
        <button
          type="button"

          onMouseDown={(event) => {
            event.preventDefault()
          }}

          onClick={() => {
            onSelect(null)
          }}

          aria-label="Default"

          className="
            flex
            gap-2
            items-center
            transition-transform
            hover:scale-110
          "
        >
          <span
            className={`
               flex
               h-6
               w-6
               items-center
               justify-center
               text-xs
               rounded-full
               border
               
              text-foreground border-border bg-transparent
              
              `}
          >
            ×
          </span>
          <div className="text-xs text-foreground items-center">
            {selectorLabel === 'Text' ? (
              <span>Default text</span>
            ) : (
              <span>Default Background</span>
            )}
          </div>
          <span></span>
        </button>

        {editorColors.map(
          ({
             label,
             value,
           }) => (
             <div
               style={{
                 "--color": value,
               } as React.CSSProperties}
             >
               <button
                 key={value}
                 type="button"

                 aria-label={label}

                 onMouseDown={(event) => {
                   event.preventDefault()
                 }}

                 onClick={() => {
                   onSelect(value)
                 }}

                 className={`
                  flex
                  gap-2
                  items-center
                  transition-transform
                  hover:scale-110
                `}
               >
                 <span
                   className={`
                   flex
                   h-6
                   w-6
                   items-center
                   justify-center
                   text-xs
                   rounded-full
                   border
                   ${selectorLabel === 'Text' ?
                     'text-[var(--color)] border-[var(--color)] bg-transparent'
                     :
                     'text-transparent border-transparent bg-[var(--color)]'}
                   `}
                 >
                   A
                 </span>
                 <div className="text-xs text-foreground items-center">
                   {selectorLabel === 'Text' ? (
                     <span>{label} text</span>
                   ) : (
                     <span>{label} Background</span>
                   )}
                 </div>
               </button>
             </div>

          ),
        )}
      </div>
    </div>
  )
}

function BlockActionMenu({
                           anchorElement,
                           onDelete,
                           onTextColor,
                           onBackgroundColor,
                         }: BlockActionMenuProps) {
  const [
    floatingElement,
    setFloatingElement,
  ] =
    useState<HTMLDivElement | null>(null)

  const [
    colorButtonElement,
    setColorButtonElement,
  ] =
    useState<HTMLButtonElement | null>(null)

  const [
    colorMenuElement,
    setColorMenuElement,
  ] =
    useState<HTMLDivElement | null>(null)

  const [
    isColorMenuOpen,
    setIsColorMenuOpen,
  ] =
    useState(false)

  const collisionBoundary =
    anchorElement?.closest(
      '[data-note-scroll-viewport]',
    ) as HTMLElement | null

  const collisionPadding = {
    top: 88,
    right: 12,
    bottom: 12,
    left: 12,
  }

  /*
   * MAIN MENU
   */
  const {
    floatingStyles,
  } = useFloating({
    open: true,

    elements: {
      reference:
      anchorElement,

      floating:
      floatingElement,
    },

    placement:
      'bottom-start',

    strategy:
      'fixed',

    whileElementsMounted:
    autoUpdate,

    middleware: [
      offset(10),

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

  /*
   * COLORS SUBMENU
   */
  const colorFloating =
    useFloating({
      open:
      isColorMenuOpen,

      onOpenChange:
      setIsColorMenuOpen,

      elements: {
        reference:
        colorButtonElement,

        floating:
        colorMenuElement,
      },

      placement:
        'right-start',

      strategy:
        'fixed',

      whileElementsMounted:
      autoUpdate,

      middleware: [
        offset(10),

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

  const colorHover =
    useHover(
      colorFloating.context,
      {
        delay: {
          open: 100,
          close: 100,
        },

        handleClose:
          safePolygon(),
      },
    )

  const colorClick =
    useClick(
      colorFloating.context,
    )

  const {
    getReferenceProps:
      getColorReferenceProps,

    getFloatingProps:
      getColorFloatingProps,
  } =
    useInteractions([
      colorHover,
      colorClick,
    ])

  return (
    <>
      <FloatingPortal>
        <div
          ref={
            setFloatingElement
          }

          style={
            floatingStyles
          }

          data-editor-popup

          className="
          z-100
          w-52

          glass-surface

          p-3

          shadow-lg
        "
        >
          <button
            ref={
              setColorButtonElement
            }

            type="button"

            {...getColorReferenceProps()}

            className="
            flex
            w-full
            items-center
            gap-2

            rounded-lg
            px-2
            py-2

            text-sm
            text-foreground

            transition-colors

            hover:bg-surface-hover
          "
          >
            <Palette
              size={16}
            />

            <span className="flex-1 text-left">
            Colors
          </span>

            <ChevronRight
              size={15}
              className="text-muted"
            />
          </button>

          <button
            type="button"

            onClick={
              onDelete
            }

            className="
            flex
            w-full
            items-center
            gap-2

            rounded-lg
            px-2
            py-2

            text-sm
            text-danger

            transition-colors

            hover:bg-accent-danger-soft
          "
          >
            <Trash2
              size={16}
            />

            Delete
          </button>
        </div>
      </FloatingPortal>

      {isColorMenuOpen && (
        <FloatingPortal>
          <div
            ref={
              setColorMenuElement
            }

            {...getColorFloatingProps()}

            style={
              colorFloating.floatingStyles
            }

            data-editor-popup

            className="
            z-110
            w-45
            h-100
            overflow-hidden
            overflow-y-auto
            scrollbar-none

            glass-surface

            p-3

            shadow-lg
          "
          >
            <ColorSection
              selectorLabel={"Text"}
              onSelect={
                onTextColor
              }
            />

            <div className="h-[1px] bg-foreground-secondary/50 my-4" />

            <ColorSection
              selectorLabel="Background"
              onSelect={
                onBackgroundColor
              }
            />
          </div>
        </FloatingPortal>
      )}
    </>
  )
}

export default BlockActionMenu