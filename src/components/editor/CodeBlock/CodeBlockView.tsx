import {
  NodeViewContent,
  NodeViewWrapper,
  type NodeViewProps,
} from '@tiptap/react'

import {
  Check,
  ChevronDown,
  Code2,
  Copy,
} from 'lucide-react'

import {
  useEffect,
  useState,
} from 'react'

import CodeLanguageMenu
  from './CodeLanguageMenu.tsx'
import { CODE_LANGUAGES } from './codeLanguages.ts'
import Tooltip from '../../ui/Tooltip.tsx'

function CodeBlockView({
                         node,
                         updateAttributes,
                       }: NodeViewProps) {

  const [
    isLanguageMenuOpen,
    setIsLanguageMenuOpen,
  ] = useState(false)

  const [
    languageButton,
    setLanguageButton,
  ] = useState<HTMLButtonElement | null>(
    null,
  )

  const [
    isCopied,
    setIsCopied,
  ] = useState(false)

  useEffect(() => {
    if (!isCopied) {
      return
    }

    const timeout =
      window.setTimeout(
        () => {
          setIsCopied(false)
        },
        1500,
      )

    return () => {
      window.clearTimeout(
        timeout,
      )
    }
  }, [isCopied])

  const language =
    node.attrs.language ?? ''

  const selectedLanguage =
    CODE_LANGUAGES.find(
      (option) =>
        option.value === language,
    ) ?? CODE_LANGUAGES[0]

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(
        node.textContent,
      )

      setIsCopied(true)
    } catch (error) {
      console.error(
        'Failed to copy code:',
        error,
      )
    }
  }

  return (
    <NodeViewWrapper
      className="
        dash-code-block
        my-3
        overflow-hidden
        p-4
        glass-surface
      "
    >
      <div
        contentEditable={false}
        className="
          flex
          h-10
          items-center
          justify-between
          border-b
          border-border
          px-3
        "
      >
        <div className="flex gap-2 items-center relative">
          <Code2 className="size-4"/>
          <div className="relative">
            <Tooltip
              content={
                <span>Code Language</span>
              }
              delay={300}
              placement="top"
              active={!isLanguageMenuOpen}
            >
              <button
                ref={setLanguageButton}
                type="button"

                onMouseDown={(event) => {
                  event.preventDefault()
                  event.stopPropagation()
                }}

                onClick={() => {
                  setIsLanguageMenuOpen((open) => !open)
                }}

                className="
                flex
                cursor-pointer
                items-center
                justify-between
                gap-1.5
                min-w-25

                rounded-4xl
                px-2
                py-1

                text-xs
                font-medium
                text-foreground-secondary

                transition-colors

                hover:bg-surface-hover
                hover:text-foreground
              "
              >
                <span className="w-full">{selectedLanguage.label}</span>

                <ChevronDown
                  size={25}
                  className={`
                  text-muted
                  transition-transform
                  ${isLanguageMenuOpen ? 'rotate-180' : ''}
                `}
                />
              </button>
            </Tooltip>


            {isLanguageMenuOpen && (
              <CodeLanguageMenu
                anchorElement={languageButton}

                selectedLanguage={language}

                onSelect={(value: string) => {
                  updateAttributes({
                    language: value || null,
                  })

                  setIsLanguageMenuOpen(false)
                }}

                onClose={() => {
                  setIsLanguageMenuOpen(false)
                }}
              />
            )}

          </div>
        </div>

        <Tooltip
          content={
          <span>Copy</span>
          }
          delay={300}
          placement="top"
        >
          <button
            type="button"

            onMouseDown={(event) => {
              event.preventDefault()
              event.stopPropagation()
            }}

            onClick={
              handleCopy
            }

            aria-label={
              isCopied
                ? 'Code copied'
                : 'Copy code'
            }

            className="
            flex
            h-8
            w-8
            cursor-pointer
            items-center
            justify-center
            rounded-4xl

            text-muted
            transition-colors

            hover:text-foreground
          "
          >
            {isCopied
              ? (
                <Check
                  size={18}
                />
              )
              : (
                <Copy
                  size={18}
                />
              )
            }
          </button>
        </Tooltip>
      </div>

      <NodeViewContent
        className="
          dash-code-content

          overflow-x-auto
          whitespace-pre

          px-4
          py-4

          font-mono
          text-[13px]
          leading-6
          text-foreground
        "
        spellCheck={false}
      />
    </NodeViewWrapper>
  )
}

export default CodeBlockView