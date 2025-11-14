import type { CSSProperties, FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Text, View } from 'react-bits'
import { useTheme } from '@hooks/useTheme'
import type { ThemeTokens } from '@theme/theme'

const STEP_DEFINITIONS = [
  { id: 'identify', label: 'Identify', description: 'Confirm the account email' },
  { id: 'challenge', label: 'Challenge', description: 'Validate the recovery code' },
  { id: 'reset', label: 'Reset', description: 'Create a strong new password' },
] as const

type StepId = (typeof STEP_DEFINITIONS)[number]['id']

interface PasswordResetFlowProps {
  onRequestChallenge?: (email: string) => Promise<void> | void
  onVerifyChallenge?: (payload: { email: string; code: string }) => Promise<void> | void
  onCompleteReset?: (payload: {
    email: string
    code: string
    password: string
  }) => Promise<void> | void
}

interface ResetFormState {
  email: string
  code: string
  password: string
  confirmPassword: string
}

type ResetErrors = Partial<Record<keyof ResetFormState, string>>

export const PasswordResetFlow = ({
  onRequestChallenge,
  onVerifyChallenge,
  onCompleteReset,
}: PasswordResetFlowProps) => {
  const { tokens } = useTheme()
  const styles = useMemo(() => createStyles(tokens), [tokens])

  const [activeStep, setActiveStep] = useState(0)
  const [state, setState] = useState<ResetFormState>({
    email: '',
    code: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<ResetErrors>({})
  const [status, setStatus] = useState<'idle' | 'pending'>('idle')
  const [toast, setToast] = useState<string | null>(null)

  const handleInputChange = (event: FormEvent<HTMLInputElement>) => {
    const { name, value } = event.currentTarget
    setState((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const goBack = () => {
    if (activeStep === 0) return
    setActiveStep((prev) => prev - 1)
    setToast(null)
  }

  const handleNext = async () => {
    const validation = validate(activeStep, state)
    if (Object.keys(validation).length > 0) {
      setErrors(validation)
      return
    }

    try {
      setStatus('pending')
      if (activeStep === 0) {
        await onRequestChallenge?.(state.email)
        setToast('Verification code sent to your inbox.')
      } else if (activeStep === 1) {
        await onVerifyChallenge?.({ email: state.email, code: state.code })
        setToast('Challenge verified. Create a new password.')
      } else if (activeStep === 2) {
        await onCompleteReset?.({
          email: state.email,
          code: state.code,
          password: state.password,
        })
        setToast('Password updated. Return to login to continue.')
        return
      }
      if (activeStep < STEP_DEFINITIONS.length - 1) {
        setActiveStep((prev) => prev + 1)
      }
    } catch (error) {
      console.error(error)
      setToast('Something went wrong. Try again or contact your administrator.')
    } finally {
      setStatus('idle')
    }
  }

  const renderStepFields = () => {
    switch (STEP_DEFINITIONS[activeStep].id) {
      case 'identify':
        return (
          <Field
            label="Account email"
            name="email"
            type="email"
            value={state.email}
            onChange={handleInputChange}
            error={errors.email}
            placeholder="operator@company.com"
            tokens={tokens}
          />
        )
      case 'challenge':
        return (
          <Field
            label="6-digit verification code"
            name="code"
            type="text"
            value={state.code}
            onChange={handleInputChange}
            error={errors.code}
            placeholder="123 456"
            tokens={tokens}
            maxLength={6}
          />
        )
      case 'reset':
        return (
          <View style={styles.resetGrid}>
            <Field
              label="New password"
              name="password"
              type="password"
              value={state.password}
              onChange={handleInputChange}
              error={errors.password}
              tokens={tokens}
            />
            <Field
              label="Confirm password"
              name="confirmPassword"
              type="password"
              value={state.confirmPassword}
              onChange={handleInputChange}
              error={errors.confirmPassword}
              tokens={tokens}
            />
            <PasswordHints tokens={tokens} />
          </View>
        )
      default:
        return null
    }
  }

  return (
    <View style={styles.root}>
      <Stepper tokens={tokens} activeIndex={activeStep} />

      <View style={styles.panel}>
        {renderStepFields()}
        <View style={styles.actions}>
          <button
            type="button"
            style={styles.secondaryButton}
            onClick={goBack}
            disabled={activeStep === 0}
          >
            Back
          </button>
          <button
            type="button"
            style={styles.primaryButton}
            onClick={handleNext}
            disabled={status === 'pending'}
          >
            {activeStep === STEP_DEFINITIONS.length - 1 ? 'Reset password' : 'Continue'}
          </button>
        </View>
        {toast ? (
          <View style={styles.toast} role="status">
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

const Stepper = ({ tokens, activeIndex }: { tokens: ThemeTokens; activeIndex: number }) => {
  const styles = useMemo(() => createStepperStyles(tokens), [tokens])
  return (
    <View style={styles.root}>
      {STEP_DEFINITIONS.map((step, index) => {
        const isActive = index === activeIndex
        const isComplete = index < activeIndex
        return (
          <View key={step.id} style={styles.step}>
            <View
              style={{
                ...styles.badge,
                backgroundColor: isComplete
                  ? tokens.palette.success
                  : isActive
                    ? tokens.palette.primary
                    : 'transparent',
                color:
                  isActive || isComplete
                    ? tokens.palette.accentContrast
                    : tokens.palette.textSecondary,
                borderColor: isActive
                  ? tokens.palette.primary
                  : isComplete
                    ? tokens.palette.success
                    : tokens.palette.border,
              }}
            >
              {isComplete ? '✓' : index + 1}
            </View>
            <View>
              <Text style={styles.label}>{step.label}</Text>
              <Text style={styles.description}>{step.description}</Text>
            </View>
            {index < STEP_DEFINITIONS.length - 1 ? (
              <View style={styles.connector} aria-hidden />
            ) : null}
          </View>
        )
      })}
    </View>
  )
}

interface FieldProps {
  label: string
  name: keyof ResetFormState
  type: string
  value: string
  onChange: (event: FormEvent<HTMLInputElement>) => void
  error?: string
  tokens: ThemeTokens
  placeholder?: string
  maxLength?: number
}

const Field = ({
  label,
  name,
  type,
  value,
  onChange,
  error,
  tokens,
  placeholder,
  maxLength,
}: FieldProps) => {
  const styles = useMemo(() => createFieldStyles(tokens), [tokens])
  return (
    <label style={styles.root}>
      <span style={styles.label}>{label}</span>
      <input
        style={{
          ...styles.input,
          borderColor: error ? tokens.palette.error : tokens.palette.border,
        }}
        type={type}
        name={name}
        value={value}
        onInput={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${name}-reset-error` : undefined}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      {error ? (
        <Text id={`${name}-reset-error`} style={styles.error}>
          {error}
        </Text>
      ) : null}
    </label>
  )
}

const PasswordHints = ({ tokens }: { tokens: ThemeTokens }) => {
  const styles = useMemo(() => createHintStyles(tokens), [tokens])
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Complexity requirements</Text>
      <ul style={styles.list}>
        <li>Minimum 12 characters</li>
        <li>Include upper, lower, number, and symbol</li>
        <li>No previous 5 passwords</li>
      </ul>
    </View>
  )
}

const validate = (stepIndex: number, state: ResetFormState): ResetErrors => {
  const errors: ResetErrors = {}
  const step = STEP_DEFINITIONS[stepIndex].id as StepId

  if (step === 'identify') {
    if (!state.email) {
      errors.email = 'Enter the email tied to your Guacamole account.'
    } else if (!/\S+@\S+\.\S+/.test(state.email)) {
      errors.email = 'Provide a valid email address.'
    }
  }

  if (step === 'challenge') {
    if (!state.code) {
      errors.code = 'Enter the code we emailed you.'
    } else if (state.code.replace(/\s/g, '').length < 6) {
      errors.code = 'Codes are six digits.'
    }
  }

  if (step === 'reset') {
    if (!state.password) {
      errors.password = 'Create a strong password.'
    } else if (state.password.length < 12) {
      errors.password = 'Password must be at least 12 characters.'
    }

    if (!state.confirmPassword) {
      errors.confirmPassword = 'Confirm the password.'
    } else if (state.password !== state.confirmPassword) {
      errors.confirmPassword = 'Passwords must match.'
    }
  }

  return errors
}

const createStyles = (tokens: ThemeTokens): Record<string, CSSProperties> => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
  },
  panel: {
    borderRadius: tokens.radii.md,
    border: `1px solid ${tokens.palette.border}`,
    padding: tokens.spacing.lg,
    backgroundColor: `${tokens.palette.surface}`,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
  },
  resetGrid: {
    display: 'grid',
    gap: tokens.spacing.md,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
    flexWrap: 'wrap',
  },
  primaryButton: {
    border: 'none',
    borderRadius: tokens.radii.sm,
    background: `linear-gradient(100deg, ${tokens.palette.primary}, ${tokens.palette.accent})`,
    color: tokens.palette.accentContrast,
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    cursor: 'pointer',
  },
  secondaryButton: {
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.border}`,
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    background: 'none',
    color: tokens.palette.textSecondary,
    cursor: 'pointer',
  },
  toast: {
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.info}`,
    backgroundColor: `${tokens.palette.info}22`,
    padding: tokens.spacing.sm,
  },
  toastText: {
    color: tokens.palette.info,
  },
})

const createStepperStyles = (tokens: ThemeTokens): Record<string, CSSProperties> => ({
  root: {
    display: 'flex',
    gap: tokens.spacing.sm,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  step: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    flex: 1,
  },
  badge: {
    width: 36,
    height: 36,
    borderRadius: '999px',
    border: `1px solid ${tokens.palette.border}`,
    display: 'grid',
    placeItems: 'center',
    fontWeight: tokens.typography.weights.medium,
    transition: 'all 160ms ease',
  },
  label: {
    color: tokens.palette.accentContrast,
    fontWeight: tokens.typography.weights.medium,
  },
  description: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.xs,
  },
  connector: {
    flex: 1,
    height: 1,
    background: `linear-gradient(90deg, ${tokens.palette.border}, transparent)`,
  },
})

const createFieldStyles = (tokens: ThemeTokens): Record<string, CSSProperties> => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.xs,
  },
  label: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.sm,
  },
  input: {
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.border}`,
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    backgroundColor: `${tokens.palette.background}44`,
    color: tokens.palette.accentContrast,
    fontSize: tokens.typography.sizes.md,
    outline: 'none',
  },
  error: {
    color: tokens.palette.error,
    fontSize: tokens.typography.sizes.sm,
  },
})

const createHintStyles = (tokens: ThemeTokens): Record<string, CSSProperties> => ({
  root: {
    backgroundColor: `${tokens.palette.border}33`,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
  },
  title: {
    fontWeight: tokens.typography.weights.medium,
    color: tokens.palette.accentContrast,
    marginBottom: tokens.spacing.xs,
  },
  list: {
    paddingLeft: tokens.spacing.lg,
    margin: 0,
    color: tokens.palette.textSecondary,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.xs,
  },
})
