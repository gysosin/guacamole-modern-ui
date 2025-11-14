import type { CSSProperties, ReactNode } from 'react'
import { useMemo } from 'react'
import { Text, View } from 'react-bits'
import type { ThemeTokens } from '@theme/theme'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  tokens: ThemeTokens
}

export const PageHeader = ({ title, subtitle, actions, tokens }: PageHeaderProps) => {
  const styles = useMemo(() => createStyles(tokens), [tokens])

  return (
    <View style={styles.root}>
      <View style={styles.heading}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {actions && <View style={styles.actions}>{actions}</View>}
    </View>
  )
}

const createStyles = (tokens: ThemeTokens): Record<string, CSSProperties> => ({
  root: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: tokens.spacing.md,
  },
  heading: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.xs,
  },
  title: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.palette.accent,
  },
  subtitle: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.palette.textSecondary,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacing.sm,
    alignItems: 'center',
  },
})
