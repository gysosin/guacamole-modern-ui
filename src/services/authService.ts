import axios from 'axios'
import { AxiosError } from 'axios'
import type { AxiosAdapter, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { authenticator } from 'otplib'
import { toDataURL } from 'qrcode'
import type {
  AuthTokens,
  AuthUser,
  DevAuthInfo,
  LoginCredentials,
  MfaChallenge,
  MfaSetupInfo,
  PasswordResetPayload,
  WebAuthnChallenge,
} from '@types/auth'

const STORAGE_KEY = 'guacmod:auth:tokens'
const NETWORK_DELAY_MS = 260
const PASSWORD_SECRET = 'Str0ngPass!'

authenticator.options = { digits: 6, step: 30 }

type RateLimitRecord = {
  failures: number
  blockedUntil: number
}

type PasswordResetRecord = {
  code: string
  expiresAt: number
}

type MfaResponse = {
  requiresMfa: boolean
  challenge?: MfaChallenge
  tokens?: AuthTokens
  user?: AuthUser
}

type VerifyMfaResponse = {
  tokens: AuthTokens
  user: AuthUser
}

const initialUser: AuthUser = {
  id: 'operator-root',
  name: 'Guacamole Operator',
  email: 'operator@guacmod.dev',
  role: 'administrator',
}

const createTokens = (): AuthTokens => ({
  accessToken: `access_${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2)}`,
  refreshToken: `refresh_${crypto.randomUUID?.() ?? Math.random().toString(16).slice(2)}`,
  issuedAt: Date.now(),
})

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

const getRandomBytes = (length: number) => {
  const cryptoObj =
    globalThis.crypto ?? (globalThis as typeof globalThis & { msCrypto?: Crypto }).msCrypto
  if (cryptoObj?.getRandomValues) {
    return cryptoObj.getRandomValues(new Uint8Array(length))
  }

  const fallback = new Uint8Array(length)
  for (let i = 0; i < length; i += 1) {
    fallback[i] = Math.floor(Math.random() * 256)
  }
  return fallback
}

const generateSecret = (length = 32) => {
  const bytes = getRandomBytes(length)
  return Array.from(bytes)
    .map((value) => BASE32_ALPHABET[value % BASE32_ALPHABET.length])
    .join('')
}

const generateBackupCodes = () =>
  Array.from({ length: 6 }).map(() => Math.random().toString(36).substring(2, 8).toUpperCase())

const getTotpUri = (secret: string) =>
  authenticator.keyuri(initialUser.email, 'Guacamole Modern', secret)

const later = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const tokenStore = (() => {
  let cached: AuthTokens | null = null

  const persist = (tokens: AuthTokens | null) => {
    cached = tokens
    if (tokens) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
      } catch {
        // ignore private mode
      }
    } else {
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }

  const load = (): AuthTokens | null => {
    if (cached) {
      return cached
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: AuthTokens = JSON.parse(stored)
        cached = parsed
        return parsed
      }
    } catch {
      // ignore parse errors
    }
    return null
  }

  return {
    getAccessToken: () => cached?.accessToken ?? load()?.accessToken ?? null,
    getRefreshToken: () => cached?.refreshToken ?? load()?.refreshToken ?? null,
    setTokens: (tokens: AuthTokens | null) => persist(tokens),
    clear: () => persist(null),
    loadTokens: load,
  }
})()

const mockState = {
  tokens: createTokens(),
  totpSecret: generateSecret(),
  backupCodes: generateBackupCodes(),
  rateLimits: {} as Record<string, RateLimitRecord>,
  passwordReset: {} as Record<string, PasswordResetRecord>,
  challenge: null as MfaChallenge | null,
  webAuthn: null as WebAuthnChallenge | null,
}

const buildDevInfo = (): DevAuthInfo => ({
  secret: mockState.totpSecret,
  currentCode: authenticator.generate(mockState.totpSecret),
  backupCodes: [...mockState.backupCodes],
})

tokenStore.setTokens(mockState.tokens)

const mockAdapter: AxiosAdapter = async (config) => {
  await later(NETWORK_DELAY_MS)
  const method = (config.method ?? 'get').toLowerCase()
  const url = (config.url ?? '').split('?')[0]
  const normalizedUrl = url.replace(/\\/g, '/').replace(/^\//, '')
  const payload = typeof config.data === 'string' ? JSON.parse(config.data) : config.data

  const unauthorized = () =>
    Promise.reject(
      new AxiosError('Unauthorized', undefined, config, undefined, {
        data: { message: 'Unauthorized' },
        status: 401,
        config,
        headers: {},
        statusText: 'Unauthorized',
      }),
    )

  const response = <T>(data: T, status = 200): AxiosResponse<T> => ({
    data,
    status,
    statusText: 'OK',
    headers: {},
    config,
  })

  const error = (message: string, status: number) =>
    Promise.reject(
      new AxiosError(message, undefined, config, undefined, {
        data: { message },
        status,
        config,
        headers: {},
        statusText: message,
      }),
    )

  if (normalizedUrl === 'login' && method === 'post') {
    const { email, password } = payload ?? {}
    if (!email || !password) {
      return error('Email and password are required.', 400)
    }

    const limit = mockState.rateLimits[email] ?? { failures: 0, blockedUntil: 0 }
    if (Date.now() < limit.blockedUntil) {
      const retryAfter = Math.ceil((limit.blockedUntil - Date.now()) / 1000)
      return error(`Too many attempts. Try again in ${retryAfter}s.`, 429)
    }

    if (password !== PASSWORD_SECRET) {
      limit.failures += 1
      limit.blockedUntil = Date.now() + Math.min(60000, limit.failures * 5000)
      mockState.rateLimits[email] = limit
      return error('Invalid credentials.', 401)
    }

    mockState.challenge = {
      challengeId: `challenge_${Date.now()}`,
      method: 'totp',
      expiresIn: 30,
    }
    return response<MfaResponse>({ requiresMfa: true, challenge: mockState.challenge })
  }

  if (normalizedUrl === 'mfa/verify' && method === 'post') {
    const { code, challengeId } = payload ?? {}
    if (!code || !challengeId || !mockState.challenge) {
      return error('Invalid MFA payload.', 400)
    }
    if (challengeId !== mockState.challenge.challengeId) {
      return error('Challenge mismatch.', 400)
    }
    if (!authenticator.check(code, mockState.totpSecret)) {
      return error('Verification failed. Try again.', 400)
    }
    const tokens = createTokens()
    mockState.tokens = tokens
    tokenStore.setTokens(tokens)
    mockState.challenge = null
    return response<VerifyMfaResponse>({ tokens, user: initialUser })
  }

  if (normalizedUrl === 'mfa/resend' && method === 'post') {
    if (!mockState.challenge) {
      return error('No MFA session to refresh.', 400)
    }
    mockState.challenge = {
      ...mockState.challenge,
      challengeId: `challenge_${Date.now()}`,
      expiresIn: 30,
    }
    return response<MfaChallenge>(mockState.challenge)
  }

  if (normalizedUrl === 'mfa/setup' && method === 'get') {
    const uri = getTotpUri(mockState.totpSecret)
    const qrCode = await toDataURL(uri)
    return response<MfaSetupInfo>({
      qrCode,
      secret: mockState.totpSecret,
      backupCodes: mockState.backupCodes,
    })
  }

  if (normalizedUrl === 'mfa/dev-info' && method === 'get') {
    return response<DevAuthInfo>(buildDevInfo())
  }

  if (normalizedUrl === 'mfa/setup/verify' && method === 'post') {
    const { code } = payload ?? {}
    if (!code) {
      return error('Verification code required.', 400)
    }
    if (!authenticator.check(code, mockState.totpSecret)) {
      return error('Code mismatch.', 400)
    }
    return response({ verified: true })
  }

  if (normalizedUrl === 'mfa/backup-codes' && method === 'get') {
    return response<string[]>([...mockState.backupCodes])
  }

  if (normalizedUrl === 'mfa/backup-codes/regenerate' && method === 'post') {
    mockState.backupCodes = generateBackupCodes()
    return response<string[]>([...mockState.backupCodes])
  }

  if (normalizedUrl === 'mfa/webauthn/challenge' && method === 'post') {
    const challenge: WebAuthnChallenge = {
      challenge: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      timeout: 60,
      rpId: 'guacmod.dev',
    }
    mockState.webAuthn = challenge
    return response<WebAuthnChallenge>(challenge)
  }

  if (normalizedUrl === 'mfa/webauthn/verify' && method === 'post') {
    const { assertion } = payload ?? {}
    if (!assertion || !mockState.webAuthn) {
      return error('WebAuthn assertion missing.', 400)
    }
    mockState.webAuthn = null
    return response({ success: true })
  }

  if (normalizedUrl === 'password-reset/request' && method === 'post') {
    const { email } = payload ?? {}
    if (!email) {
      return error('Email required.', 400)
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    mockState.passwordReset[email] = {
      code,
      expiresAt: Date.now() + 5 * 60 * 1000,
    }
    return response({ code })
  }

  if (normalizedUrl === 'password-reset/verify' && method === 'post') {
    const { email, code } = payload ?? {}
    const record = email ? mockState.passwordReset[email] : undefined
    if (!record || record.code !== code || Date.now() > record.expiresAt) {
      return error('Invalid or expired code.', 400)
    }
    return response({ verified: true })
  }

  if (normalizedUrl === 'password-reset/complete' && method === 'post') {
    const { email, code } = payload ?? {}
    const record = email ? mockState.passwordReset[email] : undefined
    if (!record || record.code !== code || Date.now() > record.expiresAt) {
      return error('Invalid reset session.', 400)
    }
    delete mockState.passwordReset[email]
    return response({ success: true })
  }

  if (normalizedUrl === 'token/refresh' && method === 'post') {
    const { refreshToken } = payload ?? {}
    if (!refreshToken || refreshToken !== mockState.tokens.refreshToken) {
      return error('Refresh token invalid.', 401)
    }
    const tokens = createTokens()
    mockState.tokens = tokens
    tokenStore.setTokens(tokens)
    return response<AuthTokens>(tokens)
  }

  if (normalizedUrl === 'logout' && method === 'post') {
    mockState.tokens = createTokens()
    tokenStore.setTokens(null)
    return response({ success: true })
  }

  if (normalizedUrl === 'me' && method === 'get') {
    const authHeader = (config.headers?.Authorization as string) ?? ''
    const token = authHeader.replace('Bearer ', '')
    if (!token || token !== mockState.tokens.accessToken) {
      return unauthorized()
    }
    return response({ user: initialUser, tokens: mockState.tokens })
  }

  return error('Not found.', 404)
}

tokenStore.setTokens(mockState.tokens)

export const authClient: AxiosInstance = axios.create({
  baseURL: '/api/auth',
  withCredentials: true,
})

authClient.defaults.adapter = mockAdapter

let refreshInFlight: Promise<AuthTokens | null> | null = null

authClient.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

authClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as AxiosRequestConfig & { _retry?: boolean }
    if (!config || (config.url?.includes('token/refresh') ?? false)) {
      return Promise.reject(error)
    }
    if (error.response?.status !== 401) {
      return Promise.reject(error)
    }
    if (config._retry) {
      return Promise.reject(error)
    }
    config._retry = true
    if (!refreshInFlight) {
      refreshInFlight = authClient
        .post<AuthTokens>('/token/refresh', {
          refreshToken: tokenStore.getRefreshToken(),
        })
        .then((result) => {
          tokenStore.setTokens(result.data)
          return result.data
        })
        .catch((err) => {
          tokenStore.clear()
          throw err
        })
        .finally(() => {
          refreshInFlight = null
        })
    }
    try {
      const tokens = await refreshInFlight
      if (tokens) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${tokens.accessToken}`
        return authClient(config)
      }
    } catch (refreshError) {
      return Promise.reject(refreshError)
    }
    return Promise.reject(error)
  },
)

export const authService = {
  login: (payload: LoginCredentials) =>
    authClient.post<MfaResponse>('/login', payload).then((res) => res.data),
  verifyMfa: (code: string, challengeId: string) =>
    authClient
      .post<VerifyMfaResponse>('/mfa/verify', { code, challengeId })
      .then((res) => res.data),
  resendTotp: () => authClient.post<MfaChallenge>('/mfa/resend').then((res) => res.data),
  fetchSession: () =>
    authClient.get<{ user: AuthUser; tokens: AuthTokens }>('/me').then((res) => res.data),
  logout: () => authClient.post('/logout').then((res) => res.data),
  fetchMfaSetup: () => authClient.get<MfaSetupInfo>('/mfa/setup').then((res) => res.data),
  verifySetupTotp: (code: string) =>
    authClient.post('/mfa/setup/verify', { code }).then((res) => res.data),
  fetchDevInfo: () => authClient.get<DevAuthInfo>('/mfa/dev-info').then((res) => res.data),
  regenerateBackupCodes: () =>
    authClient.post<string[]>('/mfa/backup-codes/regenerate').then((res) => res.data),
  fetchBackupCodes: () => authClient.get<string[]>('/mfa/backup-codes').then((res) => res.data),
  requestPasswordReset: (email: string) =>
    authClient.post('/password-reset/request', { email }).then((res) => res.data),
  verifyPasswordReset: (email: string, code: string) =>
    authClient.post('/password-reset/verify', { email, code }).then((res) => res.data),
  completePasswordReset: (payload: PasswordResetPayload) =>
    authClient.post('/password-reset/complete', payload).then((res) => res.data),
  refreshTokens: () =>
    authClient
      .post<AuthTokens>('/token/refresh', {
        refreshToken: tokenStore.getRefreshToken(),
      })
      .then((res) => res.data),
  requestWebAuthnChallenge: () =>
    authClient.post<WebAuthnChallenge>('/mfa/webauthn/challenge').then((res) => res.data),
  verifyWebAuthnAssertion: (assertion: unknown) =>
    authClient.post('/mfa/webauthn/verify', { assertion }).then((res) => res.data),
}

export const authTokenStore = {
  getAccessToken: tokenStore.getAccessToken,
  getRefreshToken: tokenStore.getRefreshToken,
  load: tokenStore.loadTokens,
  setTokens: tokenStore.setTokens,
  clear: tokenStore.clear,
}
