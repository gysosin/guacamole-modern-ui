import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Text, View } from 'react-bits'
import type { AppRoute } from '@utils/navigation'
import type { ThemeTokens } from '@theme/theme'

interface SidebarProps {
  routes: AppRoute[]
  activePath: string
  isMobile: boolean
  isOpen: boolean
  onClose: () => void
  onNavigate: () => void
  tokens: ThemeTokens
}

export const Sidebar = ({
  routes,
  activePath,
  isMobile,
  isOpen,
  onClose,
  onNavigate,
  tokens,
}: SidebarProps) => {
  const styles = useMemo(() => createStyles(tokens), [tokens])

  if (isMobile && !isOpen) {
    return null
  }

  return (
    <>
      {isMobile && (
        <button
          type="button"
          style={styles.overlay}
          aria-label="Dismiss navigation"
          onClick={onClose}
        />
      )}

      <View
        id="primary-navigation"
        style={isMobile ? styles.mobilePanel : styles.sidebar}
        role="navigation"
        aria-label="Primary navigation"
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Primary</Text>
          {isMobile && (
            <button type="button" style={styles.closeButton} onClick={onClose} aria-label="Close navigation">
              ✕
            </button>
          )}
        </View>

        <View style={styles.navList}>
          {routes.map((route) => {
            const isActive = activePath.startsWith(route.path)
            return (
              <Link
                key={route.path}
                to={route.path}
                style={styles.link}
                onClick={() => {
                  onNavigate()
                }}
              >
                <View style={isActive ? styles.navItemActive : styles.navItem} aria-current={isActive ? 'page' : undefined}>
                  <Text style={styles.navLabel}>{route.label}</Text>
                  <Text style={styles.navSubtext}>{route.short}</Text>
                </View>
              </Link>
            )
          })}
        </View>
      </View>
    </>
  )
}

const createStyles = (tokens: ThemeTokens): Record<string, CSSProperties> => ({
  sidebar: {
    backgroundColor: tokens.palette.surface,
    borderRadius: tokens.radii.md,
    border: `1px solid ${tokens.palette.border}`,
    padding: tokens.spacing.md,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.sm,
    height: '100%',
  },
  mobilePanel: {
    position: 'fixed',
    top: tokens.spacing.md,
    left: tokens.spacing.md,
    width: '240px',
    bottom: tokens.spacing.md,
    backgroundColor: tokens.palette.surface,
    border: `1px solid ${tokens.palette.border}`,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    zIndex: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.sm,
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    zIndex: 10,
    border: 'none',
    padding: 0,
    margin: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.palette.accentContrast,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.lg,
    cursor: 'pointer',
  },
  navList: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.sm,
  },
  navItem: {
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.sm,
    border: `1px solid transparent`,
    backgroundColor: tokens.palette.background,
  },
  navItemActive: {
    padding: tokens.spacing.sm,
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.primary}`,
    backgroundColor: tokens.palette.border,
  },
  navLabel: {
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.palette.textPrimary,
  },
  navSubtext: {
    fontSize: tokens.typography.sizes.sm,
    color: tokens.palette.textSecondary,
  },
  link: {
    textDecoration: 'none',
  },
})
