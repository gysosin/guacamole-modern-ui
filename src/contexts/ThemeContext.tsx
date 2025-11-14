import { PropsWithChildren, useCallback, useEffect, useMemo, useState } from 'react'
import type { ThemeMode } from '@theme/theme'
import { getThemeTokens } from '@theme/theme'
import { getInitialThemeMode, THEME_STORAGE_KEY, ThemeContext } from './theme-context.core'

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [mode, setMode] = useState<ThemeMode>(getInitialThemeMode)

  const tokens = useMemo(() => getThemeTokens(mode), [mode])

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode)
    } catch {
      // ignore write failures (e.g. private mode)
    }
  }, [mode])

  const toggleMode = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return (
    <ThemeContext.Provider value={{ mode, tokens, toggleMode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}
