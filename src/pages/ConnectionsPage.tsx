import { CSSProperties, useMemo } from 'react'
import { Text, View } from 'react-bits'
import type { ThemeTokens } from '@theme/theme'
import { useTheme } from '@hooks/useTheme'

const connectionItems = [
  { name: 'hq-rdp', protocol: 'RDP', host: 'rdp.prod.example.com', status: 'online' },
  { name: 'staging-vnc', protocol: 'VNC', host: 'vnc.staging.example.com', status: 'idle' },
  { name: 'ssh-admin', protocol: 'SSH', host: 'ssh.ops.example.com', status: 'active' },
]

export const ConnectionsPage = () => {
  const { tokens } = useTheme()
  const styles = useMemo(() => createStyles(tokens), [tokens])

  return (
    <View style={styles.root}>
      <Text style={styles.title}>Connections</Text>
      <View style={styles.list}>
        {connectionItems.map((connection) => (
          <View style={styles.card} key={connection.name}>
            <View style={styles.row}>
              <Text style={styles.heading}>{connection.name}</Text>
              <Text style={styles.status}>{connection.status}</Text>
            </View>
            <Text style={styles.subText}>
              {connection.protocol} • {connection.host}
            </Text>
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.sm,
  },
  card: {
    padding: tokens.spacing.md,
    borderRadius: tokens.radii.md,
    border: `1px solid ${tokens.palette.border}`,
    backgroundColor: tokens.palette.background,
  },
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  heading: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.palette.textPrimary,
  },
  status: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.palette.success,
  },
  subText: {
    marginTop: tokens.spacing.xs,
    color: tokens.palette.textSecondary,
  },
})
