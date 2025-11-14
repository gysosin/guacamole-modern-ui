import { useNavigate } from 'react-router-dom'
import { Text, View } from 'react-bits'
import { useTheme } from '@hooks/useTheme'
import { AuthPageShell } from '@components/auth/AuthPageShell'
import { LoginForm, type LoginFormValues } from '@components/auth/LoginForm'
import { MfaVerification } from '@components/auth/MfaVerification'

const LoginPage = () => {
  const navigate = useNavigate()
  const { tokens } = useTheme()

  const handleSubmit = async (values: LoginFormValues) => {
    console.info('Login submitted', values)
    navigate('/auth/mfa')
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
        </View>
      }
    >
      <LoginForm onSubmit={handleSubmit} onForgotPasswordNavigate={() => navigate('/auth/reset')} />
    </AuthPageShell>
  )
}

export default LoginPage
