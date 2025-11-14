import { Text, View } from 'react-bits'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@hooks/useTheme'
import { AuthPageShell } from '@components/auth/AuthPageShell'
import { PasswordResetFlow } from '@components/auth/PasswordResetFlow'

const PasswordResetPage = () => {
  const { tokens } = useTheme()
  const navigate = useNavigate()

  return (
    <AuthPageShell
      title="Reset password"
      subtitle="Follow the secure stepper to validate your identity and rebuild the credential."
      footer={
        <>
          <Text>Idle resets expire after 15 minutes.</Text>
          <Text>Activity is logged for SOC review.</Text>
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
            Why the multi-step flow?
          </Text>
          <Text style={{ color: tokens.palette.textSecondary }}>
            Requirements mandate user verification, out-of-band challenge, and secure credential
            delivery. Each step emits telemetry for the observability agents.
          </Text>
        </View>
      }
    >
      <PasswordResetFlow
        onRequestChallenge={(email) => console.info('Requesting reset for', email)}
        onVerifyChallenge={(payload) => console.info('Verifying code', payload)}
        onCompleteReset={() => navigate('/auth/login')}
      />
    </AuthPageShell>
  )
}

export default PasswordResetPage
