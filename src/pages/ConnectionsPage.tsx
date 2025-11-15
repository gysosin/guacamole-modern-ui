import { type CSSProperties, useMemo, useState } from 'react'
import { Text, View } from 'react-bits'
import { ConnectionCard } from '@components/connections/ConnectionCard'
import { ConnectionForm } from '@components/connections/ConnectionForm'
import type { Connection, ConnectionInput } from '@types/connections'
import { useConnections } from '@hooks/useConnections'
import { useTheme } from '@hooks/useTheme'

export const ConnectionsPage = () => {
  const { tokens } = useTheme()
  const styles = useMemo(() => createStyles(tokens), [tokens])
  const {
    connections,
    isLoading,
    createConnection,
    updateConnection,
    deleteConnection,
    importConnections,
    exportConnections,
    isCreating,
    isUpdating,
    isDeleting,
    isImporting,
    isExporting,
  } = useConnections()

  const [searchTerm, setSearchTerm] = useState('')
  const [showFavorites, setShowFavorites] = useState(false)
  const [editingConnection, setEditingConnection] = useState<Connection | null>(null)
  const [connectingId, setConnectingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const filteredConnections = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    return connections.filter((connection) => {
      if (showFavorites && !connection.isFavorite) {
        return false
      }
      if (!term) {
        return true
      }
      return (
        connection.name.toLowerCase().includes(term) ||
        connection.host.toLowerCase().includes(term) ||
        connection.tags.some((tag) => tag.toLowerCase().includes(term)) ||
        (connection.group?.toLowerCase().includes(term) ?? false)
      )
    })
  }, [connections, searchTerm, showFavorites])

  const statusTotals = useMemo(() => {
    const totals: Record<Connection['status'], number> = {
      online: 0,
      idle: 0,
      active: 0,
      error: 0,
    }
    connections.forEach((connection) => {
      totals[connection.status] += 1
    })
    return totals
  }, [connections])

  const handleConnect = async (id: string) => {
    setConnectingId(id)
    try {
      await updateConnection({
        id,
        payload: {
          status: 'active',
          lastUsed: Date.now(),
        },
      })
      setTimeout(() => {
        updateConnection({
          id,
          payload: {
            status: 'online',
          },
        })
      }, 1_500)
    } finally {
      setConnectingId(null)
    }
  }

  const handleToggleFavorite = async (id: string) => {
    const connection = connections.find((item) => item.id === id)
    if (!connection) return
    await updateConnection({ id, payload: { isFavorite: !connection.isFavorite } })
  }

  const handleRemove = async (id: string) => {
    await deleteConnection(id)
    setMessage('Connection removed.')
  }

  const handleFormSubmit = async (payload: ConnectionInput) => {
    try {
      if (editingConnection) {
        await updateConnection({ id: editingConnection.id, payload })
        setMessage('Connection updated.')
        setEditingConnection(null)
      } else {
        await createConnection(payload)
        setMessage('Connection created.')
      }
    } catch (error) {
      console.error(error)
      setMessage('Unable to save connection.')
    }
  }

  const handleEdit = (connection: Connection) => {
    setEditingConnection(connection)
  }

  const handleExport = async () => {
    if (!exportConnections) return
    try {
      const payload = await exportConnections()
      if (payload) {
        const blob = new Blob([payload], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `guac-connections-${Date.now()}.json`
        anchor.click()
        URL.revokeObjectURL(url)
        setMessage('Connections exported to your downloads.')
      }
    } catch (error) {
      console.error(error)
      setMessage('Export failed.')
    }
  }

  const handleImport = async () => {
    if (!importConnections) return
    if (typeof window === 'undefined') {
      return
    }
    const payload = window.prompt('Paste the exported connections JSON:')
    if (!payload) {
      return
    }
    try {
      await importConnections(payload)
      setMessage('Connections imported successfully.')
    } catch (error) {
      console.error(error)
      setMessage('Import failed. Check the payload format.')
    }
  }

  const busy = isCreating || isUpdating || isDeleting || isImporting || isExporting

  return (
    <View style={styles.page}>
      <View style={styles.hero}>
        <Text style={styles.title}>Connections</Text>
        <Text style={styles.subtitle}>
          Manage servers, protocols, and grouping rules with quick connects, favorites, and
          import/export helpers.
        </Text>
      </View>

      <View style={styles.metrics}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{connections.length}</Text>
          <Text style={styles.metricLabel}>total connections</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{statusTotals.online}</Text>
          <Text style={styles.metricLabel}>online</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{statusTotals.error}</Text>
          <Text style={styles.metricLabel}>errors</Text>
        </View>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>
            {connections.filter((conn) => conn.isFavorite).length}
          </Text>
          <Text style={styles.metricLabel}>favorites</Text>
        </View>
      </View>

      <View style={styles.toolbar}>
        <input
          type="search"
          placeholder="Search by name, host, or tag"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          style={styles.searchInput}
        />
        <button
          type="button"
          onClick={() => setShowFavorites((prev) => !prev)}
          style={{
            ...styles.toggleButton,
            borderColor: showFavorites ? tokens.palette.primary : tokens.palette.border,
            color: showFavorites ? tokens.palette.accentContrast : tokens.palette.textPrimary,
            backgroundColor: showFavorites ? tokens.palette.primary : tokens.palette.surface,
          }}
        >
          {showFavorites ? 'Showing favorites' : 'Show favorites'}
        </button>
        <button
          type="button"
          onClick={handleImport}
          disabled={isImporting}
          style={{
            ...styles.secondaryButton,
            opacity: isImporting ? 0.6 : 1,
          }}
        >
          Import JSON
        </button>
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          style={{
            ...styles.secondaryButton,
            opacity: isExporting ? 0.6 : 1,
          }}
        >
          Export JSON
        </button>
      </View>

      {message && (
        <Text style={styles.message} role="status">
          {message}
        </Text>
      )}

      <View style={styles.grid}>
        <View style={styles.listColumn}>
          {isLoading ? (
            <Text style={styles.loading}>Loading connections…</Text>
          ) : filteredConnections.length === 0 ? (
            <Text style={styles.empty}>No connections match the filters.</Text>
          ) : (
            filteredConnections.map((connection) => (
              <ConnectionCard
                key={connection.id}
                connection={connection}
                onConnect={handleConnect}
                onToggleFavorite={handleToggleFavorite}
                onEdit={handleEdit}
                onDelete={handleRemove}
                isActionPending={connectingId === connection.id}
              />
            ))
          )}
        </View>
        <View style={styles.formColumn}>
          <ConnectionForm
            connection={editingConnection ?? undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => setEditingConnection(null)}
            isSaving={busy}
          />
        </View>
      </View>
    </View>
  )
}

const createStyles = (
  tokens: ReturnType<typeof useTheme>['tokens'],
): Record<string, CSSProperties> => ({
  page: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.lg,
  },
  hero: {
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
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.sm,
  },
  metrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: tokens.spacing.md,
  },
  metricCard: {
    border: `1px solid ${tokens.palette.border}`,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.sm,
    backgroundColor: tokens.palette.surface,
  },
  metricValue: {
    fontSize: tokens.typography.sizes.lg,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.palette.accentContrast,
  },
  metricLabel: {
    fontSize: tokens.typography.sizes.xs,
    textTransform: 'uppercase',
    color: tokens.palette.textSecondary,
    letterSpacing: 0.1,
  },
  toolbar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacing.sm,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    minWidth: 220,
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.border}`,
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    backgroundColor: tokens.palette.background,
    color: tokens.palette.textPrimary,
  },
  toggleButton: {
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.border}`,
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    cursor: 'pointer',
  },
  secondaryButton: {
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.primary}`,
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    backgroundColor: tokens.palette.surface,
    color: tokens.palette.textPrimary,
    cursor: 'pointer',
  },
  message: {
    color: tokens.palette.info,
    fontSize: tokens.typography.sizes.sm,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: tokens.spacing.lg,
  },
  listColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
  },
  formColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  loading: {
    color: tokens.palette.textSecondary,
  },
  empty: {
    color: tokens.palette.textSecondary,
  },
})
