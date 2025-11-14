import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text, View } from 'react-bits'
import { useTheme } from '@hooks/useTheme'
import { useAuth } from '@hooks/useAuth'
import type { DevAuthInfo } from '@types/auth'
import { AuthPageShell } from '@components/auth/AuthPageShell'
import { LoginForm, type LoginFormValues } from '@components/auth/LoginForm'
import { MfaVerification } from '@components/auth/MfaVerification'

const LoginPage = () => {
  const navigate = useNavigate()
  const { tokens } = useTheme()
  const { login, isPending, rateLimit } = useAuth()
  const [formError, setFormError] = useState<string | null>(null)

  const rateLimitMessage = rateLimit?.isLocked
    ? `Too many attempts. Try again in ${rateLimit.retryAfterSeconds}s.`
    : null

  const handleSubmit = async (values: LoginFormValues) => {
    setFormError(null)
    try {
      const challenge = await login(values)
      if (challenge) {
        navigate('/auth/mfa')
        return
      }
      navigate('/dashboard')
    } catch (error) {
      console.error('Login failed', error)
      setFormError((error as Error).message ?? 'Unable to sign in at this time.')
    }
  }

  return (
    <AuthPageShell
      title="Authenticate to access remote desktops"
      subtitle="All sessions are validated with adaptive MFA and monitored for unusual behavior."
      footer={
        <>
          <Text>Encrypted by TLS 1.3 &amp; FIPS validated ciphers.</Text>
          <Text>Need assistance? Contact security@guacmod.dev</Text>
        </>
      }
      sideContent={
        <View style={{ display: 'flex', flexDirection: 'column', gap: tokens.spacing.md }}>
          <Text
            style={{
              color: tokens.palette.accentContrast,
              fontWeight: tokens.typography.weights.bold,
            }}
          >
            Preview MFA challenge
          </Text>
          <MfaVerification
            codeLength={6}
            initialSeconds={24}
            onResend={() => console.info('resend code')}
            onUseBackup={() => navigate('/auth/reset')}
            description="Codes rotate every 30 seconds. We also support WebAuthn for phishing-resistant sign-ins."
          />
          <DevSecretInspector />
        </View>
      }
    >
      <LoginForm
        isSubmitting={isPending}
        submissionError={formError ?? rateLimitMessage}
        onSubmit={handleSubmit}
        onForgotPasswordNavigate={() => navigate('/auth/reset')}
      />
    </AuthPageShell>
  )
}

const DevSecretInspector = () => {
  const [info, setInfo] = useState<DevAuthInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const { fetchDevInfo } = useAuth()

  if (!import.meta.env.DEV) {
    return null
  }

  const handleShow = async () => {
    setLoading(true)
    setInfo(null)
    try {
      const devInfo = await fetchDevInfo()
      setInfo(devInfo)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View
      style={{
        borderRadius: 10,
        border: '1px dashed #94a3b8',
        padding: 12,
        backgroundColor: 'rgba(148, 163, 184, 0.08)',
      }}
    >
      <button
        type="button"
        style={{
          border: 'none',
          padding: '6px 12px',
          borderRadius: 6,
          background: '#6366f1',
          color: '#fff',
          cursor: loading ? 'wait' : 'pointer',
        }}
        onClick={handleShow}
        disabled={loading}
      >
        {loading ? 'Fetching dev secret…' : 'Show dev secret (dev mode)'}
      </button>
      {info ? (
        <View style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Text style={{ fontSize: 12, color: '#e0e7ff' }}>Secret: {info.secret}</Text>
          <Text style={{ fontSize: 12, color: '#14b8a6' }}>Current code: {info.currentCode}</Text>
          <View style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {info.backupCodes.map((code) => (
              <Text
                key={code}
                style={{
                  fontSize: 11,
                  color: '#0f172a',
                  padding: '2px 6px',
                  backgroundColor: '#c7d2fe',
                  borderRadius: 999,
                }}
              >
                {code}
              </Text>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  )
}

export default LoginPage
