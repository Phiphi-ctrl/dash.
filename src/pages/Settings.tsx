import LiveDateTime from '../components/dashboard/LiveDateTime.tsx'
import { Settings as SettingsIcon } from 'lucide-react'
import { useState } from 'react'
import { getStoredTheme, type Theme } from '../utils/Theme.ts'

function Settings() {

  const [theme, setTheme] =
    useState<Theme>(() => getStoredTheme())

  function handleThemeToggle() {
    const nextTheme: Theme =
      theme === 'midnight'
        ? 'paper'
        : 'midnight'

    setTheme(nextTheme)

    document.documentElement.dataset.theme =
      nextTheme

    localStorage.setItem(
      'dash.theme',
      nextTheme,
    )
  }

  return (
    <main className="flex flex-1 flex-col px-10">
      <header className="flex gap-1 items-center justify-between">
        <LiveDateTime />
        <div className="flex gap-1 text-foreground-secondary">
          <SettingsIcon />
          <span>settings.</span>
        </div>
      </header>
      <div className="
        mt-12
        flex
        items-center
        justify-between
        py-4
        "
      >
        <div className="flex flex-col">
          <span className="font-medium text-foreground-secondary">
            Theme: {theme}
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={theme === 'paper'}
          onClick={handleThemeToggle}
          className={`
            relative
            h-8
            w-14
            glass-surface
            rounded-full
            transition-colors
            duration-200
            bg-surface-hover
            cursor-pointer
          `}
        >
          <span
            className={`
              absolute
              top-1
              left-0
              size-6
              rounded-full
              bg-foreground
              transition-transform
              duration-200
              ${theme === 'paper' ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
    </main>
  )
}

export default Settings
