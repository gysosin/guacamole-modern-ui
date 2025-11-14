import { PropsWithChildren, useCallback, useMemo, useState } from 'react'
import { AuthContext, FALLBACK_USER, type AuthUser } from './auth-context.core'

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<AuthUser | null>(null)

  const login = useCallback(() => {
    setUser(FALLBACK_USER)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setIsAuthenticated(false)
  }, [])

  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      user,
      login,
      logout,
    }),
    [isAuthenticated, user, login, logout],
  )

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}
