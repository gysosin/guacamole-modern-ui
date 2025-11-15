import { useCallback, useEffect, useMemo, useState } from 'react'
import { Text, View } from 'react-bits'
import { useTheme } from '@hooks/useTheme'
import { useAuth } from '@hooks/useAuth'
import type { MfaSetupInfo } from '@types/auth'

const STEPS = [
  {
    title: 'Pair authenticator',
    description: 'Scan the QR code or copy the secret into any TOTP app.',
  },
  { title: 'Verify code', description: 'Submit the one-time code to confirm your device.' },
  {
    title: 'Register WebAuthn',
    description: 'Add a security key or biometric device for phishing-resistant sign-ins.',
  },
  { title: 'Store backups', description: 'Secure backup codes guard against lost devices.' },
]

export const MfaSetupWizard = () => {
  const { tokens } = useTheme()
  const styles = useMemo(() => createStyles(tokens), [tokens])
  const {
    fetchMfaSetup,
    verifySetupTotp,
    requestWebAuthnChallenge,
    verifyWebAuthn,
    regenerateBackupCodes,
    fetchBackupCodes,
  } = useAuth()

  const [setupInfo, setSetupInfo] = useState<MfaSetupInfo | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [stepIndex, setStepIndex] = useState(0)
  const [code, setCode] = useState('')
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isCodeVerifying, setIsCodeVerifying] = useState(false)
  const [webAuthnStatus, setWebAuthnStatus] = useState<
    'idle' | 'registering' | 'success' | 'error'
  >('idle')

  useEffect(() => {
    fetchMfaSetup()
      .then(setSetupInfo)
      .catch(() => setSetupInfo(null))
    fetchBackupCodes().then(setBackupCodes)
  }, [fetchMfaSetup, fetchBackupCodes])

  const handleVerify = useCallback(async () => {
    if (!code) return
    setIsCodeVerifying(true)
    setStatusMessage(null)
    try {
      await verifySetupTotp(code)
      setStatusMessage('Authenticator linked successfully.')
      setStepIndex((prev) => (prev < 2 ? 2 : prev))
      setCode('')
    } catch (error) {
      setStatusMessage((error as Error).message ?? 'Verification failed. Try again.')
    } finally {
      setIsCodeVerifying(false)
    }
  }, [code, verifySetupTotp])

  const handleWebAuthn = useCallback(async () => {
    setWebAuthnStatus('registering')
    setStatusMessage(null)
    try {
      const challenge = await requestWebAuthnChallenge()
      if ('PublicKeyCredential' in window && navigator.credentials) {
        const publicKey: PublicKeyCredentialCreationOptions = {
          challenge: new TextEncoder().encode(challenge.challenge),
          rp: { name: 'Guacamole Modern', id: challenge.rpId },
          user: {
            id: new TextEncoder().encode('operator@guacmod.dev'),
            name: 'operator@guacmod.dev',
            displayName: 'Guacamole Operator',
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          authenticatorSelection: { userVerification: 'preferred' },
          timeout: challenge.timeout * 1000,
        }
        const credential = await navigator.credentials.create({ publicKey })
        await verifyWebAuthn(credential ?? { simulated: true })
      } else {
        await verifyWebAuthn({ simulated: true })
      }
      setWebAuthnStatus('success')
      setStatusMessage('WebAuthn device registered.')
      setStepIndex((prev) => (prev < 3 ? 3 : prev))
    } catch (error) {
      console.error('WebAuthn', error)
      setWebAuthnStatus('error')
      setStatusMessage('WebAuthn registration failed. Try another key or skip it.')
    }
  }, [requestWebAuthnChallenge, verifyWebAuthn])

  const handleRefreshCodes = useCallback(async () => {
    try {
      const codes = await regenerateBackupCodes()
      setBackupCodes(codes)
      setStatusMessage('Backup codes refreshed and ready for download.')
      setStepIndex(3)
    } catch (error) {
      console.error('Backup code refresh failed', error)
      setStatusMessage('Unable to regenerate backup codes. Retry in a moment.')
    }
  }, [regenerateBackupCodes])

  return (
    <View style={styles.root}>
      <View style={styles.stepper}>
        {STEPS.map((step, index) => (
          <View key={step.title} style={styles.step}>
            <View
              style={{
                ...styles.badge,
                backgroundColor:
                  index <= stepIndex ? tokens.palette.success : tokens.palette.border,
                color: tokens.palette.accentContrast,
              }}
            >
              <Text style={styles.badgeText}>{index + 1}</Text>
            </View>
            <View>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Scan the QR code</Text>
          {setupInfo ? (
            <View style={styles.qrWrapper}>
              <img src={setupInfo.qrCode} alt="TOTP QR" style={styles.qrImage} />
              <Text style={styles.text}>Secret: {setupInfo.secret}</Text>
            </View>
          ) : (
            <Text style={styles.text}>Loading authenticator details…</Text>
          )}
          <View style={styles.codeRow}>
            <input
              type="text"
              value={code}
              maxLength={6}
              placeholder="Enter code"
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              style={styles.codeInput}
            />
            <button
              type="button"
              onClick={handleVerify}
              style={styles.primaryButton}
              disabled={isCodeVerifying || !code}
            >
              {isCodeVerifying ? 'Verifying…' : 'Verify'}
            </button>
          </View>
          <Text style={styles.helperText}>Codes rotate every 30 seconds.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Register a hardware key</Text>
          <Text style={styles.text}>
            Add biometrics or a FIDO2 token for phishing-resistant sign-ins. PublicKeyCredential is
            used when supported.
          </Text>
          <button
            type="button"
            onClick={handleWebAuthn}
            style={styles.secondaryButton}
            disabled={webAuthnStatus === 'registering'}
          >
            {webAuthnStatus === 'registering' ? 'Registering…' : 'Register WebAuthn'}
          </button>
          {webAuthnStatus === 'success' && (
            <Text style={styles.successText}>Device registered.</Text>
          )}
          {webAuthnStatus === 'error' && <Text style={styles.errorText}>Registration failed.</Text>}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Backup codes</Text>
        <Text style={styles.text}>Store these in a sealed vault so you can recover access.</Text>
        <View style={styles.codesGrid}>
          {backupCodes.length > 0 ? (
            backupCodes.map((code) => (
              <Text key={code} style={styles.codeBadge}>
                {code}
              </Text>
            ))
          ) : (
            <Text style={styles.text}>Generating codes…</Text>
          )}
        </View>
        <button type="button" onClick={handleRefreshCodes} style={styles.secondaryButton}>
          Regenerate codes
        </button>
      </View>

      {statusMessage ? <Text style={styles.status}>{statusMessage}</Text> : null}
    </View>
  )
}

const createStyles = (tokens: ReturnType<typeof useTheme>['tokens']) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
    backgroundColor: `${tokens.palette.surface}ee`,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.md,
    border: `1px solid ${tokens.palette.border}`,
  },
  stepper: {
    display: 'flex',
    gap: tokens.spacing.sm,
    flexWrap: 'wrap',
  },
  step: {
    display: 'flex',
    gap: tokens.spacing.sm,
    alignItems: 'center',
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: '999px',
    display: 'grid',
    placeItems: 'center',
    backgroundColor: tokens.palette.border,
  },
  badgeText: {
    color: tokens.palette.accentContrast,
    fontWeight: tokens.typography.weights.bold,
  },
  stepTitle: {
    color: tokens.palette.textPrimary,
    fontWeight: tokens.typography.weights.medium,
  },
  stepDescription: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.xs,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: tokens.spacing.md,
  },
  card: {
    borderRadius: tokens.radii.md,
    border: `1px solid ${tokens.palette.border}`,
    padding: tokens.spacing.md,
    backgroundColor: tokens.palette.surface,
    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.sm,
  },
  cardTitle: {
    fontWeight: tokens.typography.weights.medium,
    color: tokens.palette.accentContrast,
  },
  text: {
    color: tokens.palette.textSecondary,
    lineHeight: 1.5,
  },
  qrWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.sm,
    alignItems: 'center',
  },
  qrImage: {
    width: 128,
    height: 128,
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.border}`,
  },
  codeRow: {
    display: 'flex',
    gap: tokens.spacing.sm,
    flexWrap: 'wrap',
  },
  codeInput: {
    padding: `${tokens.spacing.sm}px`,
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.border}`,
    backgroundColor: tokens.palette.background,
    color: tokens.palette.accentContrast,
    fontSize: tokens.typography.sizes.md,
    width: 120,
  },
  primaryButton: {
    borderRadius: tokens.radii.sm,
    border: 'none',
    background: `linear-gradient(120deg, ${tokens.palette.primary}, ${tokens.palette.accent})`,
    color: tokens.palette.accentContrast,
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    cursor: 'pointer',
  },
  secondaryButton: {
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.border}`,
    background: 'none',
    color: tokens.palette.info,
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    cursor: 'pointer',
    fontWeight: tokens.typography.weights.medium,
  },
  helperText: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.xs,
  },
  codesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))',
    gap: tokens.spacing.xs,
  },
  codeBadge: {
    padding: `${tokens.spacing.xs}px`,
    backgroundColor: `${tokens.palette.border}88`,
    borderRadius: tokens.radii.sm,
    textAlign: 'center' as const,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  status: {
    color: tokens.palette.info,
    fontSize: tokens.typography.sizes.sm,
  },
  successText: {
    color: tokens.palette.success,
    fontWeight: tokens.typography.weights.medium,
  },
  errorText: {
    color: tokens.palette.error,
  },
})
