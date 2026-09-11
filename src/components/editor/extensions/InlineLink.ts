import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import InlineLinkView from '../InlineLink/InlineLinkView.tsx'
import { getLinkLabel, normalizeLinkAddedAt, normalizeLinkUrl } from '../InlineLink/inlineLinkUtils.ts'

const InlineLink = Node.create({
  name: 'inlineLink',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      href: {
        default: null,
        parseHTML: (element) => normalizeLinkUrl(element.getAttribute('href')),
        renderHTML: (attrs) => ({ href: normalizeLinkUrl(attrs.href) }),
      },
      addedAt: {
        default: null,
        parseHTML: (element) => normalizeLinkAddedAt(element.getAttribute('data-added-at')),
        renderHTML: (attrs) => ({ 'data-added-at': normalizeLinkAddedAt(attrs.addedAt) }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'a[data-type="inlineLink"]', priority: 1001 }]
  },

  renderHTML({ node, HTMLAttributes }) {
    const href = normalizeLinkUrl(node.attrs.href)
    return ['a', mergeAttributes(HTMLAttributes, {
      'data-type': 'inlineLink',
      href,
      target: '_blank',
      rel: 'noopener noreferrer',
      class: 'glass-surface inline-flex rounded-full px-2 py-0.5 text-xs',
    }), href ? getLinkLabel(href) : 'Link']
  },

  renderText({ node }) {
    return normalizeLinkUrl(node.attrs.href) ?? ''
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineLinkView, {
      as: 'span',
      className: 'inline-link-node',
      // Let native anchors navigate once; StarterKit's link click handler must not also open them.
      stopEvent: ({ event }) => event.target instanceof Element
        && !!event.target.closest('[data-inline-link-pill]')
        && !['copy', 'cut', 'paste'].includes(event.type),
    })
  },
})

export default InlineLink
