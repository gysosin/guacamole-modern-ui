import { useCallback, useSyncExternalStore } from 'react'

export const useMediaQuery = (query: string) => {
  const subscribe = useCallback(
    (listener: () => void) => {
      if (typeof window === 'undefined') {
        return () => undefined
      }
      const mediaQueryList = window.matchMedia(query)
      const handleChange = () => listener()
      mediaQueryList.addEventListener('change', handleChange)
      return () => {
        mediaQueryList.removeEventListener('change', handleChange)
      }
    },
    [query],
  )

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.matchMedia(query).matches
  }, [query])

  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
