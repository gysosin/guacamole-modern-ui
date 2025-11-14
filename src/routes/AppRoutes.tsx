import { Suspense, lazy, useMemo } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Text, View } from 'react-bits'
import { useTheme } from '@hooks/useTheme'
import { ProtectedRoute } from '@components/routes/ProtectedRoute'
import type { ThemeTokens } from '@theme/theme'

const DashboardPage = lazy(() => import('@pages/DashboardPage'))
const ConnectionsPage = lazy(() => import('@pages/ConnectionsPage'))
const SessionsPage = lazy(() => import('@pages/SessionsPage'))
const SettingsPage = lazy(() => import('@pages/SettingsPage'))
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'))

export const AppRoutes = () => (
  <Suspense fallback={<RoutesFallback />}>
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/connections"
        element={
          <ProtectedRoute>
            <ConnectionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sessions"
        element={
          <ProtectedRoute>
            <SessionsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <ProtectedRoute>
            <NotFoundPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  </Suspense>
)

const RoutesFallback = () => {
  const { tokens } = useTheme()
  const styles = useMemo(() => createFallbackStyles(tokens), [tokens])
  return (
    <View style={styles.root}>
      <Text style={styles.text}>Loading session views…</Text>
    </View>
  )
}

const createFallbackStyles = (tokens: ThemeTokens) => ({
  root: {
    padding: tokens.spacing.lg,
    display: 'flex',
    justifyContent: 'center',
    borderRadius: tokens.radii.md,
    border: `1px solid ${tokens.palette.border}`,
    backgroundColor: tokens.palette.surface,
  },
  text: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.md,
  },
})
