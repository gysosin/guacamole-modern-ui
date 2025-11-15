import type { CSSProperties } from 'react'
import { useMemo } from 'react'
import { Text, View } from 'react-bits'
import type { Connection, ConnectionStatus } from '@types/connections'
import { useTheme } from '@hooks/useTheme'

interface ConnectionCardProps {
  connection: Connection
  onConnect: (id: string) => void
  onToggleFavorite: (id: string) => void
  onEdit: (connection: Connection) => void
  onDelete: (id: string) => void
  isActionPending?: boolean
}

const formatLastUsed = (timestamp: number) => {
  const diff = Date.now() - timestamp
  if (diff < 60_000) {
    return 'Just now'
  }
  if (diff < 60 * 60_000) {
    return `${Math.round(diff / 60_000)}m ago`
  }
  if (diff < 24 * 60 * 60_000) {
    return `${Math.round(diff / (60 * 60_000))}h ago`
  }
  return `${Math.round(diff / (24 * 60 * 60_000))}d ago`
}

export const ConnectionCard = ({
  connection,
  onConnect,
  onToggleFavorite,
  onEdit,
  onDelete,
  isActionPending = false,
}: ConnectionCardProps) => {
  const { tokens } = useTheme()
  const styles = useMemo(() => createStyles(tokens), [tokens])
  const statusColors: Record<ConnectionStatus, string> = {
    online: tokens.palette.success,
    idle: tokens.palette.info,
    active: tokens.palette.primary,
    error: tokens.palette.error,
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>{connection.name}</Text>
        <View style={{ ...styles.badge, backgroundColor: statusColors[connection.status] }}>
          <Text style={styles.badgeText}>{connection.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.subText}>
        {connection.protocol} · {connection.host}:{connection.port}
      </Text>
      <Text style={styles.meta}>{formatLastUsed(connection.lastUsed)}</Text>

      <View style={styles.tags}>
        {connection.tags.map((tag) => (
          <Text key={tag} style={styles.tag}>
            {tag}
          </Text>
        ))}
      </View>

      <View style={styles.actions}>
        <button
          type="button"
          onClick={() => onConnect(connection.id)}
          style={{
            ...styles.primaryButton,
            opacity: isActionPending ? 0.7 : 1,
          }}
          disabled={isActionPending}
        >
          Quick connect
        </button>
        <button
          type="button"
          onClick={() => onToggleFavorite(connection.id)}
          style={styles.secondaryButton}
        >
          {connection.isFavorite ? '★ Favorite' : '☆ Favorite'}
        </button>
      </View>

      <View style={styles.actions}>
        <button type="button" onClick={() => onEdit(connection)} style={styles.tertiaryButton}>
          Edit
        </button>
        <button type="button" onClick={() => onDelete(connection.id)} style={styles.dangerButton}>
          Delete
        </button>
      </View>
    </View>
  )
}

const createStyles = (
  tokens: ReturnType<typeof useTheme>['tokens'],
): Record<string, CSSProperties> => ({
  root: {
    backgroundColor: tokens.palette.surface,
    border: `1px solid ${tokens.palette.border}`,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.md,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.sm,
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: tokens.spacing.sm,
    alignItems: 'baseline',
  },
  heading: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.palette.textPrimary,
  },
  badge: {
    borderRadius: tokens.radii.sm,
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
  },
  badgeText: {
    color: tokens.palette.accentContrast,
    fontSize: tokens.typography.sizes.xs,
  },
  subText: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.md,
  },
  meta: {
    color: tokens.palette.info,
    fontSize: tokens.typography.sizes.sm,
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
  },
  tag: {
    padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
    borderRadius: tokens.radii.sm,
    backgroundColor: tokens.palette.border,
    fontSize: tokens.typography.sizes.xs,
    color: tokens.palette.textSecondary,
  },
  actions: {
    display: 'flex',
    gap: tokens.spacing.sm,
    flexWrap: 'wrap',
  },
  primaryButton: {
    backgroundColor: tokens.palette.primary,
    color: tokens.palette.accentContrast,
    border: 'none',
    borderRadius: tokens.radii.sm,
    padding: `${tokens.spacing.xs}px ${tokens.spacing.md}px`,
    cursor: 'pointer',
  },
  secondaryButton: {
    backgroundColor: tokens.palette.surface,
    color: tokens.palette.primary,
    border: `1px solid ${tokens.palette.primary}`,
    borderRadius: tokens.radii.sm,
    padding: `${tokens.spacing.xs}px ${tokens.spacing.md}px`,
    cursor: 'pointer',
  },
  tertiaryButton: {
    backgroundColor: tokens.palette.border,
    color: tokens.palette.textPrimary,
    border: 'none',
    borderRadius: tokens.radii.sm,
    padding: `${tokens.spacing.xs}px ${tokens.spacing.md}px`,
    cursor: 'pointer',
  },
  dangerButton: {
    backgroundColor: tokens.palette.error,
    color: tokens.palette.accentContrast,
    border: 'none',
    borderRadius: tokens.radii.sm,
    padding: `${tokens.spacing.xs}px ${tokens.spacing.md}px`,
    cursor: 'pointer',
  },
})
