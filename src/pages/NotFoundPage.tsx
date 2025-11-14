import { CSSProperties, useMemo } from 'react'
import { Text, View } from 'react-bits'
import type { ThemeTokens } from '@theme/theme'
import { useTheme } from '@hooks/useTheme'
import { Link } from 'react-router-dom'

export const NotFoundPage = () => {
  const { tokens } = useTheme()
  const styles = useMemo(() => createStyles(tokens), [tokens])

  return (
    <View style={styles.root}>
      <Text style={styles.title}>404 · Page not found</Text>
      <Text style={styles.body}>
        The route you requested does not exist in this modernization preview. Head back to the
        dashboard to continue.
      </Text>
      <Link to="/dashboard" style={styles.link}>
        <Text style={styles.linkText}>Return to dashboard</Text>
      </Link>
    </View>
  )
}

const createStyles = (tokens: ThemeTokens): Record<string, CSSProperties> => ({
  root: {
    padding: tokens.spacing.md,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.palette.warning,
  },
  body: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.md,
  },
  link: {
    textDecoration: 'none',
  },
  linkText: {
    color: tokens.palette.accent,
    fontWeight: tokens.typography.weights.medium,
  },
})

export default NotFoundPage
