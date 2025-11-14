import { PropsWithChildren, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { authService, authTokenStore } from '@services/authService'
import type {
  AuthTokens,
  AuthUser,
  LoginCredentials,
  MfaChallenge,
  PasswordResetPayload,
} from '@types/auth'
import type { RateLimitInfo } from './auth-context.core'
import { AuthContext } from './auth-context.core'

type RateLimitEntry = {
  failures: number
  blockedUntil: number
}

const MAX_COOLDOWN = 60_000
const COOLDOWN_STEP = 5000

const buildRateLimitInfo = (entry: RateLimitEntry): RateLimitInfo => ({
  isLocked: Date.now() < entry.blockedUntil,
  retryAfterSeconds: Math.max(1, Math.ceil((entry.blockedUntil - Date.now()) / 1000)),
  failures: entry.failures,
})

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isPending, setIsPending] = useState(false)
  const [mfaChallenge, setMfaChallenge] = useState<MfaChallenge | null>(null)
  const [rateLimit, setRateLimit] = useState<RateLimitInfo | null>(null)
  const rateLimitRef = useRef<Record<string, RateLimitEntry>>({})

  const vipEmailRef = useRef<string | null>(null)
  const applyTokens = useCallback((tokens: AuthTokens, resolvedUser: AuthUser) => {
    authTokenStore.setTokens(tokens)
    setUser(resolvedUser)
    setIsAuthenticated(true)
    setMfaChallenge(null)
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const stored = authTokenStore.load()
        if (!stored) {
          setIsInitializing(false)
          return
        }
        const session = await authService.fetchSession()
        if (mounted) {
          applyTokens(session.tokens, session.user)
        }
      } catch {
        authTokenStore.clear()
      } finally {
        if (mounted) {
          setIsInitializing(false)
        }
      }
    })()
    return () => {
      mounted = false
    }
  }, [applyTokens])

  const recordFailure = useCallback((email: string) => {
    const entry = rateLimitRef.current[email] ?? { failures: 0, blockedUntil: 0 }
    entry.failures += 1
    entry.blockedUntil = Date.now() + Math.min(MAX_COOLDOWN, entry.failures * COOLDOWN_STEP)
    rateLimitRef.current[email] = entry
    setRateLimit(buildRateLimitInfo(entry))
    return entry
  }, [])

  const clearRateLimit = useCallback((email: string) => {
    delete rateLimitRef.current[email]
    setRateLimit(null)
  }, [])

  const login = useCallback(
    async (values: LoginCredentials) => {
      const entry = rateLimitRef.current[values.email] ?? { failures: 0, blockedUntil: 0 }
      if (Date.now() < entry.blockedUntil) {
        setRateLimit(buildRateLimitInfo(entry))
        throw new Error('Too many failed attempts. Wait for the cooldown.')
      }
      vipEmailRef.current = values.email
      setIsPending(true)
      try {
        const result = await authService.login(values)
        if (result.requiresMfa && result.challenge) {
          setMfaChallenge(result.challenge)
          return result.challenge
        }
        if (result.tokens && result.user) {
          applyTokens(result.tokens, result.user)
          clearRateLimit(values.email)
        }
        return null
      } catch (error) {
        recordFailure(values.email)
        throw error
      } finally {
        setIsPending(false)
      }
    },
    [applyTokens, clearRateLimit, recordFailure],
  )

  const verifyMfa = useCallback(
    async (code: string) => {
      if (!mfaChallenge) {
        throw new Error('No MFA challenge is pending.')
      }
      setIsPending(true)
      try {
        const response = await authService.verifyMfa(code, mfaChallenge.challengeId)
        applyTokens(response.tokens, response.user)
        if (vipEmailRef.current) {
          clearRateLimit(vipEmailRef.current)
        }
      } finally {
        setIsPending(false)
      }
    },
    [mfaChallenge, applyTokens, clearRateLimit],
  )

  const resendTotp = useCallback(async () => {
    const nextChallenge = await authService.resendTotp()
    setMfaChallenge(nextChallenge)
    return nextChallenge
  }, [])

  const logout = useCallback(async () => {
    setIsPending(true)
    try {
      await authService.logout()
    } finally {
      authTokenStore.clear()
      setUser(null)
      setIsAuthenticated(false)
      setMfaChallenge(null)
      setRateLimit(null)
      setIsPending(false)
    }
  }, [])

  const fetchMfaSetup = useCallback(() => authService.fetchMfaSetup(), [])
  const verifySetupTotp = useCallback((code: string) => authService.verifySetupTotp(code), [])
  const regenerateBackupCodes = useCallback(() => authService.regenerateBackupCodes(), [])
  const fetchBackupCodes = useCallback(() => authService.fetchBackupCodes(), [])
  const fetchDevInfo = useCallback(() => authService.fetchDevInfo(), [])
  const requestWebAuthnChallenge = useCallback(() => authService.requestWebAuthnChallenge(), [])
  const verifyWebAuthn = useCallback(
    (assertion: unknown) => authService.verifyWebAuthnAssertion(assertion),
    [],
  )
  const requestPasswordReset = useCallback(
    (email: string) => authService.requestPasswordReset(email),
    [],
  )
  const verifyPasswordReset = useCallback(
    (payload: { email: string; code: string }) =>
      authService.verifyPasswordReset(payload.email, payload.code),
    [],
  )
  const completePasswordReset = useCallback(
    (payload: PasswordResetPayload) => authService.completePasswordReset(payload),
    [],
  )

  const value = useMemo(
    () => ({
      isAuthenticated,
      isInitializing,
      isPending,
      user,
      mfaChallenge,
      rateLimit,
      login,
      logout,
      verifyMfa,
      resendTotp,
      fetchMfaSetup,
      verifySetupTotp,
      regenerateBackupCodes,
      fetchBackupCodes,
      requestWebAuthnChallenge,
      verifyWebAuthn,
      fetchDevInfo,
      requestPasswordReset,
      verifyPasswordReset,
      completePasswordReset,
    }),
    [
      isAuthenticated,
      isInitializing,
      isPending,
      user,
      mfaChallenge,
      rateLimit,
      login,
      logout,
      verifyMfa,
      resendTotp,
      fetchMfaSetup,
      verifySetupTotp,
      regenerateBackupCodes,
      fetchBackupCodes,
      requestWebAuthnChallenge,
      verifyWebAuthn,
      fetchDevInfo,
      requestPasswordReset,
      verifyPasswordReset,
      completePasswordReset,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
