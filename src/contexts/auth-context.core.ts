import { createContext } from 'react'

export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface AuthContextValue {
  isAuthenticated: boolean
  user: AuthUser | null
  login: () => void
  logout: () => void
}

export const FALLBACK_USER: AuthUser = {
  id: 'system',
  name: 'Guacamole Operator',
  email: 'operator@guacmod.dev',
}

export const createDefaultAuthValue = (): AuthContextValue => ({
  isAuthenticated: false,
  user: null,
  login: () => undefined,
  logout: () => undefined,
})

export const AuthContext = createContext<AuthContextValue>(createDefaultAuthValue())
