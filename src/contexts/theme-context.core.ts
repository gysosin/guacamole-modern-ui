import { createContext } from 'react'
import { getThemeTokens, type ThemeMode } from '@theme/theme'

const DEFAULT_MODE: ThemeMode = 'light'

export const THEME_STORAGE_KEY = 'guac-modern-theme'

export interface ThemeContextValue {
  mode: ThemeMode
  tokens: ReturnType<typeof getThemeTokens>
  toggleMode: () => void
  setMode: (mode: ThemeMode) => void
}

const defaultTokens = getThemeTokens(DEFAULT_MODE)

export const ThemeContext = createContext<ThemeContextValue>({
  mode: DEFAULT_MODE,
  tokens: defaultTokens,
  toggleMode: () => undefined,
  setMode: () => undefined,
})

export const getInitialThemeMode = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return DEFAULT_MODE
  }

  const storedMode = window.localStorage.getItem(THEME_STORAGE_KEY) as ThemeMode | null
  if (storedMode === 'dark' || storedMode === 'light') {
    return storedMode
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}
