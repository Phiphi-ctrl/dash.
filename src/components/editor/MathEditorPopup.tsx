import {
    useState,
} from 'react'

import {
  autoUpdate,
  flip,
  FloatingPortal,
  offset,
  shift,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
  type Placement,
} from '@floating-ui/react'

import katex from 'katex'

type MathCursorSide =
  | 'start'
  | 'end'

type MathNavigateDirection =
  | 'backward'
  | 'forward'

type MathEditorPopupProps = {
  anchorElement: HTMLElement

  getPreviewElement: () =>
    HTMLElement | null

  initialLatex: string

  placement?: Placement
  offsetDistance?: number

  initialCursorSide?: MathCursorSide

  onNavigateOut?: (
    direction: MathNavigateDirection,
    latex: string,
  ) => void

  onSave: (
    latex: string
  ) => void

  onCancel: () => void
}

function MathEditorPopup({
                           anchorElement,
                           getPreviewElement,
                           initialLatex,

                           placement = 'bottom',
                           offsetDistance = 12,

                           initialCursorSide,
                           onNavigateOut,

                           onSave,
                           onCancel,
                         }: MathEditorPopupProps) {
  const [
      latex,
      setLatex,
  ] =
      useState(initialLatex)

  const [
      floatingElement,
      setFloatingElement,
  ] =
      useState<HTMLDivElement | null>(null)

  const collisionBoundary =
      anchorElement.closest(
          '[data-note-scroll-viewport]',
      ) as HTMLElement | null

  const collisionPadding = {
      top: 88,
      right: 12,
      bottom: 12,
      left: 12,
  }

  function renderEquationPreview(
    latexValue: string,
  ) {
    const equationElement =
      getPreviewElement()

    if (!equationElement) {
      return
    }

    katex.render(
      latexValue ||
      '\\phantom{x}',
      equationElement,
      {
        throwOnError: false,
      },
    )
  }

  function handleCancel() {
    /*
     * Restore whatever ProseMirror
     * currently considers the equation.
     */
    renderEquationPreview(
      initialLatex,
    )

    onCancel()
  }

  const {
      context,
      floatingStyles,
  } =
    useFloating({
      open: true,

      onOpenChange: (
        open,
      ) => {
        if (!open) {
          handleCancel()
        }
      },

        elements: {
          reference:
          anchorElement,

          floating:
          floatingElement,
        },

        placement:
          placement,

        strategy:
            'fixed',

        whileElementsMounted:
        autoUpdate,

        middleware: [
            offset(offsetDistance),

            flip({
                boundary:
                    collisionBoundary ??
                    'clippingAncestors',

                padding:
                collisionPadding,
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

  const dismiss =
      useDismiss(
          context,
          {
              escapeKey: true,
              outsidePress: true,
          },
      )

  const role =
      useRole(
          context,
          {
              role: 'dialog',
          },
      )

  const {
      getFloatingProps,
  } =
      useInteractions([
          dismiss,
          role,
      ])

  const canSave =
      latex.trim().length > 0

  function handleSave() {
    const finalLatex =
      latex.trim()

    if (!finalLatex) {
      return
    }

    onSave(
      finalLatex,
    )
  }

  return (
      <FloatingPortal>
          <div
              ref={
                  setFloatingElement
              }

              {...getFloatingProps()}

              style={
                  floatingStyles
              }

              data-editor-popup

              className="
                z-110
                w-[420px]

                glass-surface

                p-4

                shadow-lg
              "
          >
              <div
                  className="
                      mb-2
                      text-xs
                      font-semibold
                      text-foreground-secondary
                    "
              >
                  LaTeX
              </div>

              <textarea
                  autoFocus

                  value={
                      latex
                  }

                  onChange={(
                    event,
                  ) => {
                    const nextLatex =
                      event.target.value

                    setLatex(
                      nextLatex,
                    )

                    renderEquationPreview(
                      nextLatex,
                    )
                  }}

                  onKeyDown={(event) => {
                    /*
                     * Enter
                     * → save
                     *
                     * Shift + Enter
                     * → newline
                     */
                    if (
                      event.key === 'Enter' &&
                      !event.shiftKey
                    ) {
                      event.preventDefault()
                      handleSave()

                      return
                    }

                    /*
                     * Cursor navigation only matters
                     * for inline math.
                     */
                    if (!onNavigateOut) {
                      return
                    }

                    const textarea =
                      event.currentTarget

                    const {
                      selectionStart,
                      selectionEnd,
                    } =
                      textarea

                    /*
                     * Don't jump out while some LaTeX
                     * text is selected.
                     */
                    if (
                      selectionStart !==
                      selectionEnd
                    ) {
                      return
                    }

                    /*
                     * ← at beginning:
                     *
                     * exit to the document before
                     * the inline equation.
                     */
                    if (
                      event.key ===
                      'ArrowLeft' &&
                      selectionStart === 0
                    ) {
                      event.preventDefault()

                      const finalLatex =
                        latex.trim()

                      if (!finalLatex) {
                        return
                      }

                      onNavigateOut(
                        'backward',
                        finalLatex,
                      )

                      return
                    }

                    /*
                     * → at end:
                     *
                     * exit to the document after
                     * the inline equation.
                     */
                    if (
                      event.key ===
                      'ArrowRight' &&
                      selectionStart ===
                      latex.length
                    ) {
                      event.preventDefault()

                      const finalLatex =
                        latex.trim()

                      if (!finalLatex) {
                        return
                      }

                      onNavigateOut(
                        'forward',
                        finalLatex,
                      )
                    }
                  }}

                  onFocus={(event) => {
                    if (
                      !initialCursorSide
                    ) {
                      return
                    }

                    const position =
                      initialCursorSide ===
                      'start'
                        ? 0
                        : event.currentTarget
                          .value
                          .length

                    event.currentTarget
                      .setSelectionRange(
                        position,
                        position,
                      )
                  }}

                  placeholder="\frac{a}{b}"

                  className="
                      min-h-15
                      w-full
                      resize-y

                      rounded-xl
                      border
                      border-border
                      bg-transparent

                      px-3
                      py-2

                      font-mono
                      text-sm
                      text-foreground

                      outline-none
                    "
              />

              <div
                  className="
                  mt-4
                  flex
                  justify-end
                  gap-2
                "
              >
                  <button
                      type="button"

                      onClick={
                          handleCancel
                      }

                      className="
                        rounded-lg
                        px-3
                        py-1.5

                        text-sm
                        text-foreground-secondary

                        hover:bg-surface-hover
                      "
                  >
                      Cancel
                  </button>

                  <button
                      type="button"

                      disabled={
                          !canSave
                      }

                      onClick={handleSave}

                      className="
                        rounded-lg
                        bg-accent-soft

                        px-3
                        py-1.5

                        text-sm
                        font-medium
                        text-accent

                        disabled:opacity-40
                      "
                  >
                      Save
                  </button>
              </div>
          </div>
      </FloatingPortal>
  )
}

export default MathEditorPopup