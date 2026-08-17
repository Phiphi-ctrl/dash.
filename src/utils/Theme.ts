export type Theme = 'midnight' | 'paper'

export function getStoredTheme(): Theme {
  return localStorage.getItem('dash.theme') === 'paper'
    ? 'paper'
    : 'midnight'
}