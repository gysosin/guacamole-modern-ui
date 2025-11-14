export interface AuthUser {
  id: string
  name: string
  email: string
  role?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  issuedAt: number
}

export interface LoginCredentials {
  email: string
  password: string
  rememberDevice?: boolean
}

export interface MfaChallenge {
  challengeId: string
  method: 'totp' | 'webauthn'
  expiresIn: number
}

export interface MfaSetupInfo {
  qrCode: string
  secret: string
  backupCodes: string[]
}

export interface WebAuthnChallenge {
  challenge: string
  timeout: number
  rpId: string
}

export interface PasswordResetPayload {
  email: string
  code: string
  password: string
}

export interface DevAuthInfo {
  secret: string
  currentCode: string
  backupCodes: string[]
}
