import { CSSProperties, useMemo } from 'react'
import { Text, View } from 'react-bits'
import type { ThemeTokens } from '@theme/theme'
import { useTheme } from '@hooks/useTheme'

export const SettingsPage = () => {
  const { tokens } = useTheme()
  const styles = useMemo(() => createStyles(tokens), [tokens])

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.body}>
        Configure authentication providers, session recording, and WebSocket tuning from this
        centralized control panel.
      </Text>
      <View style={styles.grid}>
        {[
          'MFA Provider',
          'OAuth / OIDC',
          'Session Retention',
          'Protocol Pooling',
          'Clipboard Policy',
        ].map((item) => (
          <View key={item} style={styles.card}>
            <Text style={styles.cardTitle}>{item}</Text>
            <Text style={styles.cardDetail}>Coming soon</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const createStyles = (tokens: ThemeTokens): Record<string, CSSProperties> => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
  },
  title: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.palette.accentContrast,
  },
  body: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.md,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: tokens.spacing.md,
  },
  card: {
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    border: `1px solid ${tokens.palette.border}`,
    backgroundColor: tokens.palette.background,
  },
  cardTitle: {
    fontWeight: tokens.typography.weights.medium,
    color: tokens.palette.textPrimary,
  },
  cardDetail: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.sm,
  },
})

export default SettingsPage
