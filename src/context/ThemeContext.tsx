import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { useThemeStore, type Theme } from '@/stores/useThemeStore'

type ThemeProviderProps = {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: 'system',
  setTheme: () => null,
})

/**
 * ThemeProvider is now a thin React wrapper around the Zustand theme store
 * (`useThemeStore`). The store persists the theme to localStorage and is the
 * single source of truth. All existing `useTheme()` consumers continue to work
 * unchanged. `defaultTheme`/`storageKey` are accepted for API compatibility;
 * zustand manages persistence under its own key.
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  // `storageKey` is kept for API compatibility. Persistence is now owned by the
  // Zustand theme store (key: `poongodi-theme-storage`) instead of localStorage directly.
  void storageKey

  const { theme, setTheme: setThemeStore } = useThemeStore()

  // Initialize from the prop default before the persisted value hydrates.
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    const resolved =
      theme === 'system'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme
    root.classList.add(resolved)
    root.style.colorScheme = resolved
  }, [theme])

  const value = {
    theme: theme ?? defaultTheme,
    setTheme: (newTheme: Theme) => {
      setThemeStore(newTheme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
