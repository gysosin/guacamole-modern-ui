import { CSSProperties, useMemo } from 'react'
import { Text, View } from 'react-bits'
import type { ThemeTokens } from '@theme/theme'
import { useTheme } from '@hooks/useTheme'

const sessions = [
  { id: 'sess-1', user: 'admin', protocol: 'RDP', latency: '42 ms', quality: 'High' },
  { id: 'sess-2', user: 'support', protocol: 'SSH', latency: '12 ms', quality: 'Ultra' },
  { id: 'sess-3', user: 'installer', protocol: 'VNC', latency: '68 ms', quality: 'Medium' },
]

export const SessionsPage = () => {
  const { tokens } = useTheme()
  const styles = useMemo(() => createStyles(tokens), [tokens])

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Sessions</Text>
      <View style={styles.table}>
        {sessions.map((session) => (
          <View key={session.id} style={styles.row}>
            <Text style={styles.cell}>
              <strong>{session.user}</strong>
            </Text>
            <Text style={styles.cell}>{session.protocol}</Text>
            <Text style={styles.cell}>{session.latency}</Text>
            <Text style={styles.cell}>{session.quality}</Text>
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
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.sm,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '120px repeat(3, minmax(100px, 1fr))',
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.border}`,
    backgroundColor: tokens.palette.background,
  },
  cell: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.md,
  },
})
