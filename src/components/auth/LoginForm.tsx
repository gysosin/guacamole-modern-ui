import type { ChangeEvent, CSSProperties, FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Text, View } from 'react-bits'
import { useTheme } from '@hooks/useTheme'
import type { ThemeTokens } from '@theme/theme'

export interface LoginFormValues {
  email: string
  password: string
  rememberDevice: boolean
}

export interface LoginFormProps {
  initialValues?: Partial<LoginFormValues>
  isSubmitting?: boolean
  onSubmit?: (values: LoginFormValues) => Promise<void> | void
  onForgotPasswordNavigate?: () => void
  title?: string
  subtitle?: string
}

type FieldName = 'email' | 'password'

interface ValidationErrors {
  email?: string
  password?: string
}

const DEFAULT_VALUES: LoginFormValues = {
  email: '',
  password: '',
  rememberDevice: true,
}

export const LoginForm = ({
  initialValues,
  isSubmitting = false,
  onSubmit,
  onForgotPasswordNavigate,
  title = 'Welcome back',
  subtitle = 'Connect to Guacamole Modern with enterprise-grade security.',
}: LoginFormProps) => {
  const { tokens } = useTheme()
  const styles = useMemo(() => createStyles(tokens), [tokens])

  const [values, setValues] = useState<LoginFormValues>({ ...DEFAULT_VALUES, ...initialValues })
  const [touched, setTouched] = useState<Record<FieldName, boolean>>({
    email: false,
    password: false,
  })
  const [submissionError, setSubmissionError] = useState<string | null>(null)
  const [successPulse, setSuccessPulse] = useState(false)

  const errors = useMemo(() => validate(values), [values])

  const handleBlur = (field: FieldName) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target
    setValues((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouched({ email: true, password: true })
    setSubmissionError(null)

    const hasErrors = Boolean(errors.email || errors.password)
    if (hasErrors) {
      setSuccessPulse(false)
      return
    }

    try {
      await onSubmit?.(values)
      setSuccessPulse(true)
      setTimeout(() => setSuccessPulse(false), 800)
    } catch (error) {
      console.error(error)
      setSubmissionError('Unable to sign in. Check your credentials or try again later.')
      setSuccessPulse(false)
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} style={styles.form} data-testid="login-form">
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <FloatingLabelField
        id="email"
        name="email"
        label="Work email"
        type="email"
        autoComplete="email"
        value={values.email}
        error={errors.email}
        touched={touched.email}
        onBlur={() => handleBlur('email')}
        onChange={handleChange}
        tokens={tokens}
      />

      <FloatingLabelField
        id="password"
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        value={values.password}
        error={errors.password}
        touched={touched.password}
        onBlur={() => handleBlur('password')}
        onChange={handleChange}
        tokens={tokens}
      />

      <View style={styles.controls}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            name="rememberDevice"
            checked={values.rememberDevice}
            onChange={handleChange}
            style={styles.checkbox}
          />
          <span style={styles.checkboxText}>Trust this device for 7 days</span>
        </label>

        <button
          type="button"
          style={styles.linkButton}
          onClick={onForgotPasswordNavigate}
          aria-label="Start password reset"
        >
          Forgot password?
        </button>
      </View>

      {submissionError ? (
        <View style={styles.formError} role="alert">
          <Text style={styles.formErrorText}>{submissionError}</Text>
        </View>
      ) : null}

      <button type="submit" disabled={isSubmitting} style={styles.submitButton}>
        {isSubmitting ? 'Securing session…' : 'Sign in'}
      </button>

      <View style={styles.helper}>
        <Text style={styles.helperText}>Need an account?</Text>
        <Link to="/connections" style={styles.helperLink}>
          Request operator access
        </Link>
      </View>

      <View
        style={{
          ...styles.successPulse,
          opacity: successPulse ? 1 : 0,
          transform: successPulse ? 'scale(1)' : 'scale(0.92)',
        }}
      >
        <Text style={styles.successText}>Credentials valid — launching MFA.</Text>
      </View>
    </form>
  )
}

interface FloatingLabelFieldProps {
  id: string
  name: FieldName
  label: string
  type: string
  autoComplete?: string
  value: string
  error?: string
  touched?: boolean
  onBlur: () => void
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  tokens: ThemeTokens
}

const FloatingLabelField = ({
  id,
  name,
  label,
  type,
  autoComplete,
  value,
  error,
  touched,
  onBlur,
  onChange,
  tokens,
}: FloatingLabelFieldProps) => {
  const [focused, setFocused] = useState(false)
  const styles = useMemo(() => createFieldStyles(tokens), [tokens])
  const hasValue = value.length > 0
  const showFloating = focused || hasValue
  const showSuccess = !error && touched

  return (
    <View style={styles.field}>
      <div style={styles.inputWrapper}>
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            onBlur()
          }}
          onChange={onChange}
          style={{
            ...styles.input,
            borderColor:
              error && touched
                ? tokens.palette.error
                : showSuccess
                  ? tokens.palette.success
                  : tokens.palette.border,
            boxShadow: focused ? `0 0 0 2px ${tokens.palette.accent}33` : 'none',
          }}
          aria-invalid={Boolean(error && touched)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <label
          htmlFor={id}
          style={{
            ...styles.label,
            transform: showFloating ? 'translateY(-8px) scale(0.85)' : 'translateY(6px) scale(1)',
            color: showFloating ? tokens.palette.textSecondary : tokens.palette.textPrimary,
          }}
        >
          {label}
        </label>
        <ValidationBadge visible={showSuccess} tokens={tokens} />
      </div>
      {error && touched ? (
        <Text id={`${id}-error`} style={styles.errorText} role="alert">
          {error}
        </Text>
      ) : null}
    </View>
  )
}

const ValidationBadge = ({ visible, tokens }: { visible: boolean; tokens: ThemeTokens }) => {
  const styles = useMemo(() => createValidationBadgeStyles(tokens), [tokens])
  return (
    <View
      aria-hidden
      style={{
        ...styles.badge,
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.6)',
      }}
    >
      <Text style={styles.badgeText}>✓</Text>
    </View>
  )
}

const validate = (values: LoginFormValues): ValidationErrors => {
  const errs: ValidationErrors = {}
  if (!values.email) {
    errs.email = 'Enter the email your admin provided.'
  } else if (!/\S+@\S+\.\S+/.test(values.email)) {
    errs.email = 'Provide a valid email address.'
  }

  if (!values.password) {
    errs.password = 'Enter your password.'
  } else if (values.password.length < 8) {
    errs.password = 'Password must be at least eight characters.'
  }

  return errs
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
  title: {
    fontSize: tokens.typography.sizes.lg,
    color: tokens.palette.accentContrast,
    fontWeight: tokens.typography.weights.bold,
  },
  subtitle: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.sm,
    lineHeight: 1.5,
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    flexWrap: 'wrap',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.xs,
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.sm,
  },
  checkbox: {
    width: 18,
    height: 18,
    accentColor: tokens.palette.primary,
  },
  checkboxText: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.sm,
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: tokens.palette.info,
    fontWeight: tokens.typography.weights.medium,
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  formError: {
    backgroundColor: `${tokens.palette.error}22`,
    border: `1px solid ${tokens.palette.error}`,
    borderRadius: tokens.radii.sm,
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
  },
  formErrorText: {
    color: tokens.palette.error,
  },
  submitButton: {
    background: `linear-gradient(120deg, ${tokens.palette.primary}, ${tokens.palette.accent})`,
    border: 'none',
    borderRadius: tokens.radii.sm,
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    color: tokens.palette.accentContrast,
    fontWeight: tokens.typography.weights.medium,
    fontSize: tokens.typography.sizes.md,
    cursor: 'pointer',
    transition: 'transform 120ms ease',
  },
  helper: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  helperText: {
    color: tokens.palette.textSecondary,
  },
  helperLink: {
    color: tokens.palette.info,
    textDecoration: 'underline',
    fontWeight: tokens.typography.weights.medium,
  },
  successPulse: {
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.success}`,
    padding: tokens.spacing.sm,
    backgroundColor: `${tokens.palette.success}22`,
    transition: 'opacity 200ms ease, transform 200ms ease',
  },
  successText: {
    color: tokens.palette.success,
    fontWeight: tokens.typography.weights.medium,
  },
})

const createFieldStyles = (tokens: ThemeTokens): Record<string, CSSProperties> => ({
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.xs,
  },
  inputWrapper: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.border}`,
    backgroundColor: `${tokens.palette.background}88`,
    color: tokens.palette.accentContrast,
    fontSize: tokens.typography.sizes.md,
    outline: 'none',
    transition: 'border-color 120ms ease, box-shadow 120ms ease',
  },
  label: {
    position: 'absolute',
    left: tokens.spacing.md,
    top: tokens.spacing.sm,
    pointerEvents: 'none',
    transition: 'transform 150ms ease, color 200ms ease',
    fontSize: tokens.typography.sizes.sm,
  },
  errorText: {
    color: tokens.palette.error,
    fontSize: tokens.typography.sizes.sm,
  },
})

const createValidationBadgeStyles = (tokens: ThemeTokens): Record<string, CSSProperties> => ({
  badge: {
    position: 'absolute',
    right: tokens.spacing.sm,
    top: '50%',
    transform: 'translateY(-50%)',
    width: 24,
    height: 24,
    borderRadius: '50%',
    backgroundColor: `${tokens.palette.success}30`,
    border: `1px solid ${tokens.palette.success}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 200ms ease, transform 200ms ease',
  },
  badgeText: {
    color: tokens.palette.success,
    fontWeight: tokens.typography.weights.bold,
  },
})
