import {
  useEditorState,
  type Editor,
} from '@tiptap/react'

import {
  BubbleMenu,
} from '@tiptap/react/menus'

import Tooltip from '../../ui/Tooltip.tsx'

import {
  useEffect,
  useState,
} from 'react'

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react'

import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code2,
  Palette,
  Sigma,
  type LucideIcon,
} from 'lucide-react'

import {
  editorColors,
} from '../utils/editorColors.ts'
import * as React from 'react'

import {
  TextSelection,
} from '@tiptap/pm/state'

type TextSelectionMenuProps = {
  editor: Editor
  disabled?: boolean

  onInsertInlineMath?: () => void
}

type FormatButtonProps = {
  Icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
}

function FormatButton({
                        Icon,
                        label,
                        active,
                        onClick,
                      }: FormatButtonProps) {

  return (
    <button
      type="button"
      aria-label={label}

      onMouseDown={(event) => {
        /*
         * Keep the text selection alive when
         * clicking the formatting toolbar.
         */
        event.preventDefault()
      }}

      onClick={onClick}

      className={`
        flex
        h-8
        w-8
        cursor-pointer
        items-center
        justify-center
        rounded-md

        transition-colors

        ${
        active
          ? 'bg-accent-soft text-accent'
          : `
                text-foreground-secondary
                hover:bg-surface-hover
                hover:text-foreground
              `
      }
      `}
    >
      <Icon size={16} />
    </button>
  )
}

type SelectionColorRowProps = {
  selectorLabel: string

  onSelect: (
    color: string | null
  ) => void
}

function SelectionColorRow({
                             selectorLabel,
                             onSelect,
                           }: SelectionColorRowProps) {
  return (
    <div
      className="
        flex
        flex-col
        gap-2
        px-2
      "
    >
      <span
        className="
          flex
          shrink-0
          text-xs
          text-muted
        "
      >
        {selectorLabel}
      </span>
      <div
        className="
        flex
        items-center
        flex-wrap
        gap-2
        "
      >
        <Tooltip
          content={
            <div>
              {selectorLabel === 'Text' ? (
                <span>Default Text</span>
              ) : (
                <span>Default Background</span>
              )}
            </div>
          }
          delay={500}
        >
          <button
            type="button"

            aria-label="Default"

            onMouseDown={(event) => {
              event.preventDefault()
            }}

            onClick={() => {
              onSelect(null)
            }}

            className="
          flex
          h-6
          w-6
          items-center
          justify-center

          rounded-full
          border
          border-border

          text-[10px]
          text-muted
        "
          >
            ×
          </button>
        </Tooltip>

        {editorColors.map(
          ({
             label,
             value,
           }) => (
            <Tooltip
              content={
                <div>
                  {selectorLabel === 'Text' ? (
                    <span>{label} Text</span>
                  ) : (
                    <span>{label} Background</span>
                  )}
                </div>
              }
              delay={500}
            >
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
    
                  transition-transform
    
                  hover:scale-110
                  `}
                >
                  <span>A</span>
                </button>
              </div>
            </Tooltip>
          ),
        )}
      </div>
    </div>
  )
}

function TextSelectionMenu({
                             editor,
                             disabled = false,
                             onInsertInlineMath,
                           }: TextSelectionMenuProps) {

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
    editor.view.dom.closest(
      '[data-note-scroll-viewport]'
    ) as HTMLElement | null

  const collisionPadding = {
    top: 88,
    right: 12,
    bottom: 12,
    left: 12,
  }

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
        'bottom-start',

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

  const formatState = useEditorState({
    editor,

    selector: ({ editor }) => ({
      isBold:
        editor.isActive('bold'),

      isItalic:
        editor.isActive('italic'),

      isUnderline:
        editor.isActive('underline'),

      isStrike:
        editor.isActive('strike'),

      isCode:
        editor.isActive('code'),
    }),
  })

  useEffect(() => {
    function handleSelectionUpdate() {
      setIsColorMenuOpen(false)
    }

    editor.on(
      'selectionUpdate',
      handleSelectionUpdate,
    )

    return () => {
      editor.off(
        'selectionUpdate',
        handleSelectionUpdate,
      )
    }
  }, [editor])

  function handleSelectionTextColor(
    color: string | null,
  ) {
    const chain =
      editor
        .chain()
        .focus()

    if (color === null) {
      chain
        .unsetColor()
        .run()
    } else {
      chain
        .setColor(color)
        .run()
    }

    setIsColorMenuOpen(false)
  }

  function handleSelectionBackgroundColor(
    color: string | null,
  ) {
    const chain =
      editor
        .chain()
        .focus()

    if (color === null) {
      chain
        .unsetBackgroundColor()
        .run()
    } else {
      chain
        .setBackgroundColor(color)
        .run()
    }

    setIsColorMenuOpen(false)
  }

  return (
    <>
      <BubbleMenu
        editor={editor}

        className="
          z-110
        "

        appendTo={() =>
          document.body
        }

        options={{
          strategy: 'fixed',

          placement: 'top',

          offset: 10,

          flip: {
            boundary:
              collisionBoundary ??
              'clippingAncestors',

            padding:
            collisionPadding,

            fallbackPlacements: [
              'bottom',
            ],
          },

          shift: {
            boundary:
              collisionBoundary ??
              'clippingAncestors',

            padding:
            collisionPadding,
          },
        }}

        shouldShow={({ state }) => {
          const {
            selection,
          } = state

          if (
            disabled ||
            selection.empty ||
            !(selection instanceof TextSelection)
          ) {
            return false
          }

          const {
            $from,
            $to,
          } = selection

          const isInsideExcludedBlock = (
            $pos: typeof $from,
          ) => {
            for (
              let depth = 0;
              depth <= $pos.depth;
              depth++
            ) {
              if (
                $pos.node(depth)
                  .type.name ===
                'codeBlock'
              ) {
                return true
              }
            }

            return false
          }

          if (
            isInsideExcludedBlock($from) ||
            isInsideExcludedBlock($to)
          ) {
            return false
          }

          return true
        }}
      >
        <div
          className="
          flex
          items-center
          gap-0.5

          glass-surface

          rounded-lg

          p-4

          shadow-lg
        "
        >
          <Tooltip
            content={
              <span>Bold</span>
            }
            delay={100}
          >
            <FormatButton
              Icon={Bold}
              label="Bold"
              active={
                formatState.isBold
              }
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .toggleBold()
                  .run()
              }}
            />
          </Tooltip>

          <Tooltip
            content={
              <span>Italic</span>
            }
            delay={100}
          >


            <FormatButton
              Icon={Italic}
              label="Italic"
              active={
                formatState.isItalic
              }
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .toggleItalic()
                  .run()
              }}
            />
          </Tooltip>

          <Tooltip
            content={
              <span>Underline</span>
            }
            delay={100}
          >

            <FormatButton
              Icon={Underline}
              label="Underline"
              active={
                formatState.isUnderline
              }
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .toggleUnderline()
                  .run()
              }}
            />
          </Tooltip>

          <Tooltip
            content={
              <span>Strikethrough</span>
            }
            delay={100}
          >

            <FormatButton
              Icon={Strikethrough}
              label="Strikethrough"
              active={
                formatState.isStrike
              }
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .toggleStrike()
                  .run()
              }}
            />
          </Tooltip>

          <div
            className="
            mx-1
            h-5
            w-px
            bg-border
          "
          />

          <Tooltip
            content={
              <span>Code</span>
            }
            delay={100}
          >

            <FormatButton
              Icon={Code2}
              label="Inline code"
              active={
                formatState.isCode
              }
              onClick={() => {
                editor
                  .chain()
                  .focus()
                  .toggleCode()
                  .run()
              }}
            />
          </Tooltip>

          <Tooltip
            content={
              <span>
                Inline equation
              </span>
            }
            delay={100}
          >
            <FormatButton
              Icon={Sigma}
              label="Inline equation"
              active={false}
              onClick={() => {
                onInsertInlineMath?.()
              }}
            />
          </Tooltip>

          <div
            className="
              mx-1
              h-5
              w-px
              bg-border
            "
          />
          <Tooltip
            content={
              <span>Color</span>
            }
            delay={100}
            active={!isColorMenuOpen}
          >
            <button
              ref={
                setColorButtonElement
              }

              type="button"

              onMouseDown={(event) => {
                /*
                 * Critical: preserve the
                 * current text selection.
                 */
                event.preventDefault()
              }}

              onClick={() => {
                setIsColorMenuOpen(
                  (current) => !current,
                )
              }}

              className={`
              flex
              h-8
              w-8
              cursor-pointer
              items-center
              justify-center
              rounded-md
        
              transition-colors
        
              ${
                isColorMenuOpen
                  ? 'bg-accent-soft text-accent'
                  : `
              text-foreground-secondary
              hover:bg-surface-hover
              hover:text-foreground
            `
              }
            `}
            >
              <Palette size={16} />
            </button>
          </Tooltip>
        </div>
      </BubbleMenu>
      {isColorMenuOpen && (
        <FloatingPortal>
          <div
            ref={
              setColorMenuElement
            }

            style={
              colorFloating.floatingStyles
            }

            data-editor-popup

            className="
              z-110
              w-42

              glass-surface

              p-3

              shadow-lg
            "
          >
            <SelectionColorRow
              selectorLabel="Text"
              onSelect={
                handleSelectionTextColor
              }
            />

            <div className="h-[1px] bg-foreground-secondary/30 my-4" />

            <SelectionColorRow
              selectorLabel="Background"
              onSelect={
                handleSelectionBackgroundColor
              }
            />
          </div>
        </FloatingPortal>
      )}
    </>
  )
}

export default TextSelectionMenu
