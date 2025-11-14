import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent, FormEvent } from 'react'
import { Text, View } from 'react-bits'
import { useTheme } from '@hooks/useTheme'
import type { ThemeTokens } from '@theme/theme'

export interface MfaVerificationProps {
  codeLength?: number
  initialSeconds?: number
  method?: 'totp' | 'push' | 'webauthn'
  onVerify?: (code: string) => Promise<void> | void
  onResend?: () => void
  onUseBackup?: () => void
  heading?: string
  description?: string
}

const DEFAULT_LENGTH = 6
const DEFAULT_SECONDS = 30

export const MfaVerification = ({
  codeLength = DEFAULT_LENGTH,
  initialSeconds = DEFAULT_SECONDS,
  method = 'totp',
  onVerify,
  onResend,
  onUseBackup,
  heading = 'Verify multi-factor code',
  description = 'Enter the rotating code from your authenticator app.',
}: MfaVerificationProps) => {
  const { tokens } = useTheme()
  const styles = useMemo(() => createStyles(tokens), [tokens])

  const [digits, setDigits] = useState<string[]>(() => Array(codeLength).fill(''))
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'verifying' | 'verified'>('idle')
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (secondsLeft <= 0) {
      return
    }
    const id = window.setInterval(() => {
      setSecondsLeft((previous) => (previous > 0 ? previous - 1 : 0))
    }, 1000)
    return () => {
      window.clearInterval(id)
    }
  }, [secondsLeft])

  useEffect(() => {
    setSecondsLeft(initialSeconds)
  }, [initialSeconds])

  const handleDigitChange = (event: FormEvent<HTMLInputElement>, index: number) => {
    const value = event.currentTarget.value
    if (!/^\d?$/.test(value)) {
      return
    }
    const updated = [...digits]
    updated[index] = value
    setDigits(updated)
    setError(null)
    if (value && index < codeLength - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
    if (event.key === 'ArrowRight' && index < codeLength - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const code = digits.join('')
    if (code.length !== codeLength) {
      setError(`Enter all ${codeLength} digits to continue.`)
      setStatus('idle')
      return
    }

    try {
      setStatus('verifying')
      await onVerify?.(code)
      setStatus('verified')
      setTimeout(() => setStatus('idle'), 1200)
    } catch (err) {
      console.error(err)
      setError('Verification failed. Try again or request a new code.')
      setStatus('idle')
    }
  }

  const handleResend = () => {
    if (secondsLeft > 0) {
      return
    }
    setDigits(Array(codeLength).fill(''))
    setSecondsLeft(initialSeconds)
    onResend?.()
  }

  const totalFilled = digits.filter(Boolean).length

  return (
    <form style={styles.form} onSubmit={handleSubmit} data-testid="mfa-form">
      <View style={styles.header}>
        <Text style={styles.heading}>{heading}</Text>
        <Text style={styles.description}>
          {description}{' '}
          {method === 'webauthn' ? 'You can also use a registered security key.' : null}
        </Text>
      </View>

      <View style={styles.codeRow} aria-live="polite">
        {Array.from({ length: codeLength }).map((_, index) => (
          <input
            key={index}
            inputMode="numeric"
            aria-label={`Digit ${index + 1}`}
            autoComplete="one-time-code"
            maxLength={1}
            value={digits[index]}
            onInput={(event) => handleDigitChange(event, index)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            ref={(element) => {
              inputsRef.current[index] = element
            }}
            style={styles.codeInput}
          />
        ))}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.timer} aria-live="polite">
          Code expires in {formatSeconds(secondsLeft)}
        </Text>
        <button
          type="button"
          onClick={handleResend}
          disabled={secondsLeft > 0}
          style={styles.resendButton}
        >
          Resend code
        </button>
      </View>

      {error ? (
        <Text role="alert" style={styles.errorText}>
          {error}
        </Text>
      ) : null}

      <button type="submit" style={styles.submitButton} disabled={status === 'verifying'}>
        {status === 'verifying'
          ? 'Verifying…'
          : `Approve ${method === 'totp' ? 'code' : 'challenge'}`}
      </button>

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={{ ...styles.progressBar, width: `${(totalFilled / codeLength) * 100}%` }} />
        </View>
        <Text style={styles.progressLabel}>
          {totalFilled}/{codeLength} digits entered
        </Text>
      </View>

      <button type="button" style={styles.secondaryButton} onClick={onUseBackup}>
        Use backup codes instead
      </button>

      {status === 'verified' ? (
        <View style={styles.statusToast} aria-live="assertive">
          <Text style={styles.statusText}>MFA satisfied — resuming session.</Text>
        </View>
      ) : null}
    </form>
  )
}

const formatSeconds = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

const createStyles = (tokens: ThemeTokens): Record<string, CSSProperties> => ({
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.xs,
  },
  heading: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.palette.accentContrast,
  },
  description: {
    color: tokens.palette.textSecondary,
    lineHeight: 1.6,
  },
  codeRow: {
    display: 'flex',
    gap: tokens.spacing.sm,
    justifyContent: 'space-between',
  },
  codeInput: {
    width: 48,
    height: 60,
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.border}`,
    backgroundColor: `${tokens.palette.background}55`,
    textAlign: 'center' as const,
    fontSize: tokens.typography.sizes.lg,
    color: tokens.palette.accentContrast,
    outline: 'none',
    transition: 'border-color 120ms ease, transform 120ms ease',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
  },
  timer: {
    color: tokens.palette.textSecondary,
  },
  resendButton: {
    border: 'none',
    background: 'none',
    color: tokens.palette.info,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  errorText: {
    color: tokens.palette.error,
  },
  submitButton: {
    backgroundColor: tokens.palette.primary,
    color: tokens.palette.accentContrast,
    border: 'none',
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    borderRadius: tokens.radii.sm,
    cursor: 'pointer',
    fontWeight: tokens.typography.weights.medium,
  },
  progressRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.xs,
  },
  progressTrack: {
    width: '100%',
    height: 4,
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.palette.border,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: tokens.palette.success,
    transition: 'width 150ms ease',
  },
  progressLabel: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.sm,
  },
  secondaryButton: {
    border: `1px solid ${tokens.palette.border}`,
    borderRadius: tokens.radii.sm,
    background: 'none',
    color: tokens.palette.textSecondary,
    padding: `${tokens.spacing.xs}px ${tokens.spacing.md}px`,
    cursor: 'pointer',
  },
  statusToast: {
    borderRadius: tokens.radii.md,
    backgroundColor: `${tokens.palette.success}22`,
    border: `1px solid ${tokens.palette.success}`,
    padding: tokens.spacing.sm,
  },
  statusText: {
    color: tokens.palette.success,
    fontWeight: tokens.typography.weights.medium,
  },
})
