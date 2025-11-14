import type { CSSProperties, ReactNode } from 'react'
import { useMemo } from 'react'
import { Text, View } from 'react-bits'
import { useTheme } from '@hooks/useTheme'
import type { ThemeTokens } from '@theme/theme'

interface AuthPageShellProps {
  title: string
  subtitle: string
  kicker?: string
  children: ReactNode
  footer?: ReactNode
  sideContent?: ReactNode
}

export const AuthPageShell = ({
  title,
  subtitle,
  kicker = 'Secure Access',
  children,
  footer,
  sideContent,
}: AuthPageShellProps) => {
  const { tokens } = useTheme()
  const styles = useMemo(() => createStyles(tokens), [tokens])

  return (
    <View style={styles.page}>
      <View style={styles.glow} aria-hidden />
      <View style={styles.shell}>
        <View style={styles.card}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.content}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
        <View style={styles.aside}>{sideContent ?? <DefaultAside tokens={tokens} />}</View>
      </View>
    </View>
  )
}

const DefaultAside = ({ tokens }: { tokens: ThemeTokens }) => {
  const styles = useMemo(() => createAsideStyles(tokens), [tokens])

  return (
    <View style={styles.wrapper}>
      <Text style={styles.headline}>Sessions stay encrypted at rest and in transit.</Text>
      <Text style={styles.copy}>
        We apply adaptive MFA challenges, device fingerprinting, and live heuristics to keep
        sensitive infrastructure safe. Performance overlays verify that every connect stays under
        two seconds.
      </Text>
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>60 FPS</Text>
          <Text style={styles.metricLabel}>Realtime rendering target</Text>
        </View>
        <View style={styles.metricDivider} aria-hidden />
        <View style={styles.metric}>
          <Text style={styles.metricValue}>99.99%</Text>
          <Text style={styles.metricLabel}>Uptime across clusters</Text>
        </View>
      </View>
    </View>
  )
}

const createStyles = (tokens: ThemeTokens): Record<string, CSSProperties> => ({
  page: {
    minHeight: '100vh',
    padding: tokens.spacing.lg,
    background: `radial-gradient(circle at top, ${tokens.palette.surface} 0%, ${tokens.palette.background} 55%)`,
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    inset: tokens.spacing.sm,
    borderRadius: tokens.radii.lg * 2,
    background: `radial-gradient(circle at 20% 20%, ${tokens.palette.accent}33, transparent)`,
    filter: 'blur(60px)',
    zIndex: 0,
  },
  shell: {
    position: 'relative',
    zIndex: 1,
    margin: '0 auto',
    maxWidth: 1200,
    display: 'grid',
    gap: tokens.spacing.lg,
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    alignItems: 'stretch',
  },
  card: {
    backgroundColor: tokens.palette.surface,
    borderRadius: tokens.radii.lg,
    padding: tokens.spacing.lg,
    border: `1px solid ${tokens.palette.border}`,
    boxShadow: '0 25px 70px rgba(15, 23, 42, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
  },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: tokens.typography.sizes.xs,
    color: tokens.palette.info,
    fontWeight: tokens.typography.weights.medium,
  },
  title: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.palette.accentContrast,
  },
  subtitle: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.md,
    lineHeight: 1.5,
    marginBottom: tokens.spacing.sm,
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
  },
  footer: {
    borderTop: `1px solid ${tokens.palette.border}`,
    paddingTop: tokens.spacing.sm,
    display: 'flex',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
    flexWrap: 'wrap',
  },
  aside: {
    borderRadius: tokens.radii.lg,
    border: `1px solid ${tokens.palette.border}`,
    background: `linear-gradient(145deg, ${tokens.palette.surface}, ${tokens.palette.background})`,
    padding: tokens.spacing.lg,
  },
})

const createAsideStyles = (tokens: ThemeTokens): Record<string, CSSProperties> => ({
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
  },
  headline: {
    fontSize: tokens.typography.sizes.lg,
    color: tokens.palette.accentContrast,
    fontWeight: tokens.typography.weights.bold,
  },
  copy: {
    color: tokens.palette.textSecondary,
    lineHeight: 1.6,
  },
  metrics: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: tokens.radii.md,
    backgroundColor: `${tokens.palette.border}66`,
    padding: tokens.spacing.md,
    gap: tokens.spacing.md,
    flexWrap: 'wrap',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.xs,
    flex: 1,
  },
  metricValue: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.palette.info,
  },
  metricLabel: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.sm,
  },
  metricDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: tokens.palette.border,
    opacity: 0.5,
  },
})
