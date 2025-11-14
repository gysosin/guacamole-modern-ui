import { CSSProperties, useMemo } from 'react'
import { Text, View } from 'react-bits'
import type { ThemeTokens } from '@theme/theme'
import { useTheme } from '@hooks/useTheme'

const highlightCards = [
  { title: 'Active Sessions', value: '24', detail: '2 alerts pending' },
  { title: 'Latency', value: '34 ms', detail: 'dashboard target < 45 ms' },
  { title: 'Bandwidth', value: '720 Mbps', detail: 'steady since last deploy' },
]

export const DashboardPage = () => {
  const { tokens } = useTheme()
  const styles = useMemo(() => createStyles(tokens), [tokens])

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>
          Live telemetry, quick-connect actions, and health guidance for every connection.
        </Text>
      </View>

      <View style={styles.statsGrid}>
        {highlightCards.map((card) => (
          <View style={styles.statCard} key={card.title}>
            <Text style={styles.statHeader}>{card.title}</Text>
            <Text style={styles.statValue}>{card.value}</Text>
            <Text style={styles.statDetail}>{card.detail}</Text>
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
    gap: tokens.spacing.lg,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.palette.accentContrast,
  },
  subtitle: {
    fontSize: tokens.typography.sizes.md,
    color: tokens.palette.textSecondary,
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: tokens.spacing.md,
  },
  statCard: {
    backgroundColor: tokens.palette.background,
    border: `1px solid ${tokens.palette.border}`,
    borderRadius: tokens.radii.sm,
    padding: tokens.spacing.md,
  },
  statHeader: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.palette.textSecondary,
  },
  statValue: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.palette.accent,
  },
  statDetail: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.palette.textSecondary,
  },
})

export default DashboardPage
