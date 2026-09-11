import { useRef, useState, type RefObject } from 'react'
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react'
import { TextSelection } from '@tiptap/pm/state'
import {
  autoUpdate, flip, FloatingFocusManager, FloatingPortal, offset, safePolygon, shift,
  useDismiss, useFloating, useFocus, useHover, useInteractions, useRole,
} from '@floating-ui/react'
import { CornerDownLeft, ExternalLink, Link2, Pencil, Trash2, X } from 'lucide-react'
import { getLinkLabel, normalizeLinkAddedAt, normalizeLinkUrl } from './inlineLinkUtils.ts'

const addedDateFormatter = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const actionClass = 'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent'

function LinkUrlEditor({
  initialUrl, inputRef, onSave, onCancel,
}: {
  initialUrl: string
  inputRef: RefObject<HTMLInputElement | null>
  onSave: (url: string) => void
  onCancel: () => void
}) {
  const [url, setUrl] = useState(initialUrl)
  const [hasError, setHasError] = useState(false)

  return (
    <form onSubmit={(event) => {
      event.preventDefault()
      const href = normalizeLinkUrl(url)
      if (!href) {
        setHasError(true)
        inputRef.current?.focus()
        return
      }
      onSave(href)
    }}>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          inputMode="url"
          aria-label="Link URL"
          aria-invalid={hasError}
          value={url}
          onChange={(event) => { setUrl(event.target.value); setHasError(false) }}
          placeholder="https://example.com"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          className={`min-w-0 flex-1 rounded-md border bg-transparent px-2 py-1.5 text-sm text-foreground outline-none ${hasError ? 'border-error' : 'border-border focus:border-accent'}`}
        />
        <button type="submit" aria-label="Save link" title="Save link" className={actionClass}>
          <CornerDownLeft size={15} />
        </button>
        <button type="button" aria-label="Cancel link" title="Cancel" onClick={onCancel} className={actionClass}>
          <X size={15} />
        </button>
      </div>
      {hasError && <p role="alert" className="mt-2 text-xs text-error">Enter a valid HTTP or HTTPS website URL.</p>}
    </form>
  )
}

export default function InlineLinkView({ node, editor, getPos, selected }: NodeViewProps) {
  const href = normalizeLinkUrl(node.attrs.href)
  const addedAt = normalizeLinkAddedAt(node.attrs.addedAt)
  const label = href ? getLinkLabel(href) : 'Link'
  const [mode, setMode] = useState<'edit' | 'preview' | null>(null)
  const [reference, setReference] = useState<HTMLAnchorElement | null>(null)
  const [floating, setFloating] = useState<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const isEditing = editor.isEditable && (mode === 'edit' || !href)
  const isOpen = isEditing || mode === 'preview'

  function removeLink(focusEditor: boolean) {
    const pos = getPos()
    if (typeof pos !== 'number' || editor.isDestroyed) return
    const current = editor.state.doc.nodeAt(pos)
    if (current?.type.name !== 'inlineLink') return
    const chain = editor.chain().deleteRange({ from: pos, to: pos + current.nodeSize })
    if (focusEditor) chain.focus()
    chain.run()
  }

  function cancelEditing(focusEditor: boolean) {
    setMode(null)
    if (!href) {
      removeLink(focusEditor)
    } else if (focusEditor) {
      const pos = getPos()
      if (typeof pos === 'number' && !editor.isDestroyed) {
        editor.chain().setTextSelection(pos + node.nodeSize).focus().run()
      }
    }
  }

  function saveLink(url: string) {
    const pos = getPos()
    if (typeof pos !== 'number' || editor.isDestroyed) return
    const current = editor.state.doc.nodeAt(pos)
    if (current?.type.name !== 'inlineLink') return
    const transaction = editor.state.tr.setNodeMarkup(pos, undefined, {
      ...current.attrs,
      href: url,
      addedAt: normalizeLinkAddedAt(current.attrs.addedAt) ?? new Date().toISOString(),
    })
    // Finalize a new placeholder without adding a separate undo step for the URL dialog.
    if (!normalizeLinkUrl(current.attrs.href)) transaction.setMeta('addToHistory', false)
    transaction.setSelection(TextSelection.create(transaction.doc, pos + current.nodeSize))
    editor.view.dispatch(transaction)
    setMode(null)
    editor.commands.focus()
  }

  const boundary = reference?.closest('[data-note-scroll-viewport]') ?? undefined
  const { context, floatingStyles, isPositioned } = useFloating({
    open: isOpen,
    onOpenChange: (open, _event, reason) => {
      if (isEditing) {
        if (!open && (reason === 'escape-key' || reason === 'outside-press')) {
          cancelEditing(reason === 'escape-key')
        }
        return
      }
      setMode(open ? 'preview' : null)
    },
    elements: { reference, floating },
    placement: 'bottom-start',
    strategy: 'fixed',
    whileElementsMounted: autoUpdate,
    middleware: [offset(8), flip({ boundary, padding: 12 }), shift({ boundary, padding: 12 })],
  })
  const hover = useHover(context, {
    enabled: !!href && !isEditing,
    delay: { open: 350, close: 120 },
    move: false,
    handleClose: safePolygon(),
  })
  const focus = useFocus(context, { enabled: !!href && !isEditing })
  const dismiss = useDismiss(context, { ancestorScroll: !isEditing })
  const role = useRole(context, { role: 'dialog' })
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, focus, dismiss, role])

  return (
    <NodeViewWrapper as="span" contentEditable={false} className="inline align-middle">
      <a
        ref={setReference}
        data-type="inlineLink"
        data-inline-link-pill
        href={href ?? undefined}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={0}
        className={`glass-surface inline-flex! h-6 max-w-[min(16rem,100%)] items-center gap-1.5 rounded-full! px-2 align-middle text-xs font-normal text-foreground-secondary no-underline hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent ${selected ? 'outline-1 outline-accent' : ''}`}
        {...getReferenceProps({
          'aria-label': href ? `${label} (opens in a new tab)` : 'Add link URL',
          onClick: () => setMode(href ? null : 'edit'),
        })}
      >
        <Link2 aria-hidden="true" size={13} className="shrink-0" />
        <span className="min-w-0 truncate">{label}</span>
      </a>
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager
            context={context}
            modal={false}
            initialFocus={isEditing ? inputRef : -1}
            returnFocus={false}
            disabled={!isPositioned}
          >
            <div
              ref={setFloating}
              data-editor-popup
              data-inline-link-popup={isEditing ? 'edit' : 'preview'}
              style={{ ...floatingStyles, visibility: isPositioned ? 'visible' : 'hidden' }}
              className="glass-surface z-[110] w-80 max-w-[calc(100vw-1.5rem)] rounded-lg! p-3 text-sm text-foreground shadow-lg"
              {...getFloatingProps({ 'aria-label': isEditing ? 'Edit link' : 'Link details' })}
            >
              {isEditing ? (
                <LinkUrlEditor
                  initialUrl={href ?? ''}
                  inputRef={inputRef}
                  onSave={saveLink}
                  onCancel={() => cancelEditing(true)}
                />
              ) : (
                <>
                  <div className="mb-2 flex items-center gap-2">
                    <Link2 aria-hidden="true" size={15} className="shrink-0 text-muted" />
                    <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
                    <a href={href ?? undefined} target="_blank" rel="noopener noreferrer" aria-label="Open link in new tab" title="Open link" className={actionClass}>
                      <ExternalLink size={14} />
                    </a>
                    {editor.isEditable && (
                      <>
                        <button type="button" aria-label="Edit link URL" title="Edit link" onClick={() => setMode('edit')} className={actionClass}>
                          <Pencil size={14} />
                        </button>
                        <button type="button" aria-label="Remove link" title="Remove link" onClick={() => removeLink(true)} className={actionClass}>
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                  <a href={href ?? undefined} target="_blank" rel="noopener noreferrer" className="block break-all text-xs text-foreground-secondary hover:text-foreground">{href}</a>
                  <div className="mt-3 text-xs text-muted">
                    {addedAt ? <>Added <time dateTime={addedAt}>{addedDateFormatter.format(new Date(addedAt))}</time></> : 'Added date unavailable'}
                  </div>
                </>
              )}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </NodeViewWrapper>
  )
}
