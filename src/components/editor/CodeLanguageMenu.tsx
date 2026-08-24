import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react'
import {
  useEffect,
  useState,
} from 'react'
import { CODE_LANGUAGES } from './codeLanguages.ts'
import { Check } from 'lucide-react'

type CodeLanguageMenuProps = {
  anchorElement:
    HTMLElement | null

  selectedLanguage:
    string

  onSelect: (
    language: string
  ) => void

  onClose:
    () => void
}

function CodeLanguageMenu({ anchorElement, selectedLanguage, onSelect, onClose }: CodeLanguageMenuProps) {
  const [
    floatingElement,
    setFloatingElement,
  ] =
    useState<HTMLDivElement | null>(
      null,
    )

  useEffect(() => {
    function handlePointerDown(
      event: PointerEvent,
    ) {
      const target =
        event.target

      if (
        target instanceof Node &&
        (
          floatingElement
            ?.contains(target) ||
          anchorElement
            ?.contains(target)
        )
      ) {
        return
      }

      onClose()
    }

    function handleKeyDown(
      event: KeyboardEvent,
    ) {
      if (
        event.key ===
        'Escape'
      ) {
        onClose()
      }
    }

    document.addEventListener(
      'pointerdown',
      handlePointerDown,
    )

    document.addEventListener(
      'keydown',
      handleKeyDown,
    )

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown,
      )

      document.removeEventListener(
        'keydown',
        handleKeyDown,
      )
    }
  }, [
    anchorElement,
    floatingElement,
    onClose,
  ])

  const {
    floatingStyles,
  } = useFloating({
    open:
      true,

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
      offset(8),

      flip({
        padding: 12,
      }),

      shift({
        padding: 12,
      }),
    ],
  })

  return (
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
        glass-surface
        z-120

        w-48
        overflow-hidden

        p-1.5

        shadow-lg
      "
      >
        <div
          className="
          px-2
          pb-1.5
          pt-1

          text-[10px]
          font-semibold
          uppercase
          tracking-wide
          text-muted
        "
        >
          Language
        </div>

        {CODE_LANGUAGES.map(
          ({
             value,
             label,
           }) => {
            const isSelected =
              value ===
              selectedLanguage

            return (
              <button
                key={value}
                type="button"

                onMouseDown={(
                  event,
                ) => {
                  event
                    .preventDefault()

                  event
                    .stopPropagation()
                }}

                onClick={() => {
                  onSelect(
                    value,
                  )
                }}

                className={`
                flex
                w-full
                cursor-pointer
                items-center
                justify-between

                rounded-lg
                px-2.5
                py-1.5

                text-left
                text-xs

                transition-colors

                ${
                  isSelected
                    ? `
                      bg-surface-hover
                      text-foreground
                    `
                    : `
                      text-foreground-secondary
                      hover:bg-surface-hover
                      hover:text-foreground
                    `
                }
              `}
              >
              <span>
                {label}
              </span>

                {isSelected && (
                  <Check size={14}/>
                )}
              </button>
            )
          },
        )}
      </div>
    </FloatingPortal>
  )
}

export default CodeLanguageMenu