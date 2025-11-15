import { createContext } from 'react'
import type {
  AuthUser,
  LoginCredentials,
  MfaChallenge,
  MfaSetupInfo,
  PasswordResetPayload,
  WebAuthnChallenge,
} from '@types/auth'
import type { DevAuthInfo } from '@types/auth'

export interface RateLimitInfo {
  isLocked: boolean
  retryAfterSeconds: number
  failures: number
}

export interface AuthContextValue {
  isAuthenticated: boolean
  isInitializing: boolean
  isPending: boolean
  user: AuthUser | null
  mfaChallenge: MfaChallenge | null
  rateLimit: RateLimitInfo | null
  login: (values: LoginCredentials) => Promise<MfaChallenge | null>
  logout: () => Promise<void>
  verifyMfa: (code: string) => Promise<void>
  resendTotp: () => Promise<MfaChallenge>
  fetchMfaSetup: () => Promise<MfaSetupInfo>
  regenerateBackupCodes: () => Promise<string[]>
  fetchBackupCodes: () => Promise<string[]>
  requestWebAuthnChallenge: () => Promise<WebAuthnChallenge>
  verifyWebAuthn: (assertion: unknown) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  verifyPasswordReset: (payload: { email: string; code: string }) => Promise<void>
  completePasswordReset: (payload: PasswordResetPayload) => Promise<void>
  fetchDevInfo: () => Promise<DevAuthInfo>
}

export const FALLBACK_USER: AuthUser = {
  id: 'system',
  name: 'Guacamole Operator',
  email: 'operator@guacmod.dev',
}

export const createDefaultAuthValue = (): AuthContextValue => ({
  isAuthenticated: false,
  isInitializing: true,
  isPending: false,
  user: null,
  mfaChallenge: null,
  rateLimit: null,
  login: async () => null,
  logout: async () => undefined,
  verifyMfa: async () => undefined,
  resendTotp: async () => ({ challengeId: '', method: 'totp', expiresIn: 0 }),
  fetchMfaSetup: async () => ({ qrCode: '', secret: '', backupCodes: [] }),
  regenerateBackupCodes: async () => [],
  fetchBackupCodes: async () => [],
  requestWebAuthnChallenge: async () => ({ challenge: '', timeout: 0, rpId: '' }),
  verifyWebAuthn: async () => undefined,
  requestPasswordReset: async () => undefined,
  verifyPasswordReset: async () => undefined,
  completePasswordReset: async () => undefined,
  fetchDevInfo: async () => ({ secret: '', currentCode: '', backupCodes: [] }),
})

export const AuthContext = createContext<AuthContextValue>(createDefaultAuthValue())
