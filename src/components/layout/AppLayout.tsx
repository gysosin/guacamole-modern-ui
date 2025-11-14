import type { CSSProperties, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { View, Text } from 'react-bits'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'
import { useTheme } from '@hooks/useTheme'
import { useMediaQuery } from '@hooks/useMediaQuery'
import { primaryRoutes } from '@utils/navigation'
import type { ThemeTokens } from '@theme/theme'
import { PageHeader } from './PageHeader'
import { Sidebar } from './Sidebar'

interface AppLayoutProps {
  children: ReactNode
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { tokens, mode, toggleMode } = useTheme()
  const { user } = useAuth()
  const location = useLocation()
  const isNarrow = useMediaQuery('(max-width: 900px)')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const styles = useMemo(() => createStyles(tokens, isNarrow), [tokens, isNarrow])

  const activeRoute =
    primaryRoutes.find((route) => location.pathname.startsWith(route.path)) ?? primaryRoutes[0]

  const handleSidebarToggle = () => setSidebarOpen((prev) => !prev)
  const handleNavigation = () => {
    if (isNarrow) {
      setSidebarOpen(false)
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.toolbar} role="banner">
        <View style={styles.brandRow}>
          {isNarrow && (
            <button
              type="button"
              style={styles.menuButton}
              onClick={handleSidebarToggle}
              aria-label="Toggle navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="primary-navigation"
            >
              ☰
            </button>
          )}
          <View style={styles.brandGroup}>
            <Text style={styles.brand}>Guacamole Modern</Text>
            <Text style={styles.tagline}>Secure remote access, reimagined.</Text>
          </View>
        </View>
        <View style={styles.toolbarActions}>
          <Text style={styles.welcomeText}>
            {user ? `Signed in as ${user.name}` : 'Ready to connect'}
          </Text>
          <button type="button" style={styles.toggleButton} onClick={toggleMode}>
            Switch to {mode === 'light' ? 'dark' : 'light'} mode
          </button>
        </View>
      </View>

      <View style={styles.grid}>
        <Sidebar
          activePath={location.pathname}
          isMobile={isNarrow}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNavigate={handleNavigation}
          routes={primaryRoutes}
          tokens={tokens}
        />

        <View style={styles.panel}>
          <PageHeader title={activeRoute.label} subtitle={activeRoute.short} tokens={tokens} />
          <View style={styles.content}>{children}</View>
        </View>
      </View>
    </View>
  )
}

const createStyles = (tokens: ThemeTokens, isNarrow: boolean): Record<string, CSSProperties> => ({
  root: {
    minHeight: '100vh',
    backgroundColor: tokens.palette.background,
    color: tokens.palette.textPrimary,
    padding: tokens.spacing.md,
    paddingTop: tokens.spacing.lg,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    borderRadius: tokens.radii.md,
    backgroundColor: tokens.palette.surface,
    border: `1px solid ${tokens.palette.border}`,
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  brandGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.xs,
  },
  brand: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.palette.accentContrast,
  },
  tagline: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.palette.textSecondary,
  },
  toolbarActions: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
  },
  welcomeText: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.palette.textSecondary,
  },
  toggleButton: {
    backgroundColor: tokens.palette.primary,
    color: tokens.palette.accentContrast,
    border: 'none',
    borderRadius: tokens.radii.sm,
    padding: `${tokens.spacing.xs}px ${tokens.spacing.md}px`,
    cursor: 'pointer',
  },
  menuButton: {
    border: 'none',
    backgroundColor: tokens.palette.secondary,
    color: tokens.palette.accentContrast,
    borderRadius: tokens.radii.sm,
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: isNarrow ? '1fr' : '280px 1fr',
    gap: tokens.spacing.lg,
    flex: 1,
  },
  panel: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
  },
  content: {
    backgroundColor: tokens.palette.surface,
    padding: tokens.spacing.lg,
    borderRadius: tokens.radii.lg,
    border: `1px solid ${tokens.palette.border}`,
    minHeight: '60vh',
  },
})
