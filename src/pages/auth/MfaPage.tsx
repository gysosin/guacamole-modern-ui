import { useNavigate } from 'react-router-dom'
import { Text, View } from 'react-bits'
import { useTheme } from '@hooks/useTheme'
import { useAuth } from '@hooks/useAuth'
import { AuthPageShell } from '@components/auth/AuthPageShell'
import { MfaVerification } from '@components/auth/MfaVerification'
import { MfaSetupWizard } from '@components/auth/MfaSetupWizard'

const MfaPage = () => {
  const navigate = useNavigate()
  const { tokens } = useTheme()
  const { verifyMfa, resendTotp, mfaChallenge } = useAuth()

  const handleVerify = async (code: string) => {
    await verifyMfa(code)
    navigate('/dashboard')
  }

  return (
    <AuthPageShell
      title="Complete MFA verification"
      subtitle="Your session stays paused until the rotating code or registered WebAuthn device validates this sign-in."
      footer={
        <>
          <Text>Adaptive step-up occurs for unusual geo velocity.</Text>
          <Text>Lockout triggers after 5 failed attempts.</Text>
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
            Having trouble?
          </Text>
          <Text style={{ color: tokens.palette.textSecondary }}>
            Request backup codes from your administrator or switch to registered FIDO2 keys for
            phishing-resistant MFA.
          </Text>
          <MfaSetupWizard />
        </View>
      }
    >
      <MfaVerification
        initialSeconds={mfaChallenge?.expiresIn ?? 30}
        method={mfaChallenge?.method ?? 'totp'}
        onVerify={handleVerify}
        onResend={resendTotp}
        onUseBackup={() => navigate('/auth/reset')}
      />
    </AuthPageShell>
  )
}

export default MfaPage
