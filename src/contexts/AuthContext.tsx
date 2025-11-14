import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from 'react'

export interface AuthUser {
  id: string
  name: string
  email: string
}

interface AuthContextValue {
  isAuthenticated: boolean
  user: AuthUser | null
  login: () => void
  logout: () => void
}

const FALLBACK_USER: AuthUser = {
  id: 'system',
  name: 'Guacamole Operator',
  email: 'operator@guacmod.dev',
}

const defaultValue: AuthContextValue = {
  isAuthenticated: true,
  user: FALLBACK_USER,
  login: () => undefined,
  logout: () => undefined,
}

export const AuthContext = createContext<AuthContextValue>(defaultValue)

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true)
  const [user, setUser] = useState<AuthUser | null>(FALLBACK_USER)

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

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
