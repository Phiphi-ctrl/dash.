export function normalizeLinkUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const input = value.trim()
  if (!input || /[\s\\]/.test(input) || [...input].some((char) => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127)) return null
  if (/^[a-z][a-z\d+.-]*:/i.test(input) && !/^https?:\/\//i.test(input)) return null

  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input.replace(/^\/\//, '')}`)
    if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null
    return url.href
  } catch {
    return null
  }
}

export function getLinkLabel(href: string): string {
  return new URL(href).host.replace(/^www\./i, '')
}

export function normalizeLinkAddedAt(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}
