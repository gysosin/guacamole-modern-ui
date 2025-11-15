import type { ChangeEvent, CSSProperties, FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Text, View } from 'react-bits'
import { useTheme } from '@hooks/useTheme'
import type {
  Connection,
  ConnectionInput,
  ConnectionProtocol,
  ConnectionSettings,
} from '@types/connections'
import { DEFAULT_CONNECTION_SETTINGS } from '@types/connections'

interface ConnectionFormProps {
  connection?: Connection
  onSubmit: (values: ConnectionInput) => Promise<void> | void
  onCancel?: () => void
  isSaving?: boolean
}

const PROTOCOL_OPTIONS: ConnectionProtocol[] = ['RDP', 'VNC', 'SSH', 'Kubernetes']

const createInitialState = (connection?: Connection): ConnectionInput => ({
  name: connection?.name ?? '',
  description: connection?.description,
  host: connection?.host ?? '',
  port: connection?.port ?? 3389,
  protocol: connection?.protocol ?? 'RDP',
  group: connection?.group,
  tags: connection?.tags ?? [],
  isFavorite: connection?.isFavorite ?? false,
  settings: connection?.settings ?? DEFAULT_CONNECTION_SETTINGS,
})

const formatTagsInput = (tags: string[]) => tags.join(', ')

const sanitizeTags = (value: string) =>
  value
    .split(',')
    .map((segment) => segment.trim())
    .filter(Boolean)

export const ConnectionForm = ({
  connection,
  onSubmit,
  onCancel,
  isSaving = false,
}: ConnectionFormProps) => {
  const { tokens } = useTheme()
  const styles = useMemo(() => createStyles(tokens), [tokens])
  const [values, setValues] = useState<ConnectionInput>(() => createInitialState(connection))
  const [tagsInput, setTagsInput] = useState(() => formatTagsInput(values.tags ?? []))
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(!!connection)

  const validationError = useMemo(() => {
    if (!values.name.trim() || !values.host.trim()) {
      return 'Name and host are required.'
    }
    if (!values.port || values.port <= 0 || values.port > 65535) {
      return 'Port must be between 1 and 65535.'
    }
    return null
  }, [values])

  const handleInput =
    (
      field: keyof ConnectionInput,
      transformer: (value: string) => ConnectionInput[keyof ConnectionInput] = (value) => value,
    ) =>
    (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({
        ...prev,
        [field]: transformer(event.target.value),
      }))
    }

  const handleToggle = (field: keyof ConnectionInput) => () => {
    setValues((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const updateSettings = (next: Partial<ConnectionSettings>) => {
    setValues((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...next,
      },
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (validationError) {
      setStatusMessage(validationError)
      return
    }

    setIsSubmitting(true)
    setStatusMessage(null)

    const payload: ConnectionInput = {
      ...values,
      tags: sanitizeTags(tagsInput),
    }

    try {
      await onSubmit(payload)
      setStatusMessage('Connection saved successfully.')
    } catch (error) {
      console.error(error)
      setStatusMessage('Unable to save connection. Try again in a moment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setValues(createInitialState(connection))
    setTagsInput(formatTagsInput(connection?.tags ?? []))
    setStatusMessage(null)
  }

  const isBusy = isSaving || isSubmitting

  return (
    <View style={styles.root}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <View style={styles.header}>
          <Text style={styles.title}>{connection ? 'Edit connection' : 'Add connection'}</Text>
          <Text style={styles.subtitle}>
            Blend protocols, groups, and secure controls into reusable definitions.
          </Text>
        </View>

        <label style={styles.label}>
          <span style={styles.labelText}>Name</span>
          <input
            type="text"
            value={values.name}
            onChange={handleInput('name')}
            style={styles.input}
            placeholder="e.g. hq-rdp"
            required
          />
        </label>

        <label style={styles.label}>
          <span style={styles.labelText}>Host</span>
          <input
            type="text"
            value={values.host}
            onChange={handleInput('host')}
            style={styles.input}
            placeholder="hostname or IP"
            required
          />
        </label>

        <View style={styles.inlineRow}>
          <label style={{ ...styles.label, flex: 1 }}>
            <span style={styles.labelText}>Port</span>
            <input
              type="number"
              min={1}
              max={65535}
              value={values.port}
              onChange={handleInput('port', (target) => Number(target))}
              style={styles.input}
            />
          </label>

          <label style={{ ...styles.label, flex: 1 }}>
            <span style={styles.labelText}>Protocol</span>
            <select value={values.protocol} onChange={handleInput('protocol')} style={styles.input}>
              {PROTOCOL_OPTIONS.map((protocol) => (
                <option key={protocol} value={protocol}>
                  {protocol}
                </option>
              ))}
            </select>
          </label>
        </View>

        <label style={styles.label}>
          <span style={styles.labelText}>Group</span>
          <input
            type="text"
            value={values.group ?? ''}
            onChange={handleInput('group')}
            style={styles.input}
            placeholder="Production, Staging, Operations"
          />
        </label>

        <label style={styles.label}>
          <span style={styles.labelText}>Description</span>
          <textarea
            value={values.description ?? ''}
            onChange={handleInput('description')}
            style={styles.textarea}
            rows={3}
            placeholder="Optional guidance for operators"
          ></textarea>
        </label>

        <label style={styles.label}>
          <span style={styles.labelText}>Tags</span>
          <input
            type="text"
            value={tagsInput}
            onChange={(event) => setTagsInput(event.target.value)}
            style={styles.input}
            placeholder="Comma-separated tags"
          />
        </label>

        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={values.isFavorite ?? false}
            onChange={handleToggle('isFavorite')}
            style={styles.checkbox}
          />
          <span style={styles.checkboxText}>Mark as favorite</span>
        </label>

        <details
          open={advancedOpen}
          style={styles.accordion}
          onToggle={(event) => setAdvancedOpen(event.currentTarget.open)}
        >
          <summary style={styles.summary}>Advanced settings</summary>
          <View style={styles.accordionPanel}>
            <View style={styles.inlineRow}>
              <label style={{ ...styles.label, flex: 1 }}>
                <span style={styles.labelText}>Display</span>
                <select
                  value={values.settings.display ?? DEFAULT_CONNECTION_SETTINGS.display}
                  onChange={(event) =>
                    updateSettings({
                      display: event.target.value as ConnectionSettings['display'],
                    })
                  }
                  style={styles.input}
                >
                  <option value="auto">Auto</option>
                  <option value="fullscreen">Fullscreen</option>
                </select>
              </label>

              <label style={{ ...styles.label, flex: 1 }}>
                <span style={styles.labelText}>Color depth</span>
                <select
                  value={values.settings.colorDepth ?? DEFAULT_CONNECTION_SETTINGS.colorDepth}
                  onChange={(event) =>
                    updateSettings({
                      colorDepth: event.target.value as ConnectionSettings['colorDepth'],
                    })
                  }
                  style={styles.input}
                >
                  <option value="16-bit">16-bit</option>
                  <option value="24-bit">24-bit</option>
                  <option value="32-bit">32-bit</option>
                </select>
              </label>
            </View>

            <label style={styles.label}>
              <span style={styles.labelText}>Compression</span>
              <select
                value={values.settings.compression ?? DEFAULT_CONNECTION_SETTINGS.compression}
                onChange={(event) =>
                  updateSettings({
                    compression: event.target.value as ConnectionSettings['compression'],
                  })
                }
                style={styles.input}
              >
                <option value="balanced">Balanced</option>
                <option value="max">Max quality</option>
              </select>
            </label>

            <label style={styles.label}>
              <span style={styles.labelText}>Authentication</span>
              <select
                value={values.settings.authentication ?? DEFAULT_CONNECTION_SETTINGS.authentication}
                onChange={(event) =>
                  updateSettings({
                    authentication: event.target.value as ConnectionSettings['authentication'],
                  })
                }
                style={styles.input}
              >
                <option value="password">Password</option>
                <option value="key">Key</option>
              </select>
            </label>

            <label style={styles.label}>
              <span style={styles.labelText}>Namespace</span>
              <input
                type="text"
                value={values.settings.namespace ?? ''}
                onChange={(event) => updateSettings({ namespace: event.target.value })}
                style={styles.input}
                placeholder="e.g. default (Kubernetes only)"
              />
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={values.settings.clipboardSync ?? DEFAULT_CONNECTION_SETTINGS.clipboardSync}
                onChange={() =>
                  updateSettings({
                    clipboardSync: !(values.settings.clipboardSync ?? true),
                  })
                }
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>Enable clipboard synchronization</span>
            </label>

            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={values.settings.secureTunnel ?? DEFAULT_CONNECTION_SETTINGS.secureTunnel}
                onChange={() =>
                  updateSettings({
                    secureTunnel: !(values.settings.secureTunnel ?? false),
                  })
                }
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>Force secure tunnel</span>
            </label>
          </View>
        </details>

        {statusMessage && (
          <Text style={styles.statusText} role="status">
            {statusMessage}
          </Text>
        )}

        <View style={styles.footer}>
          <button
            type="submit"
            disabled={isBusy}
            style={{
              ...styles.primaryButton,
              opacity: isBusy ? 0.6 : 1,
            }}
          >
            {connection ? 'Save changes' : 'Create connection'}
          </button>
          <button
            type="button"
            onClick={onCancel ?? handleReset}
            disabled={isBusy}
            style={{
              ...styles.secondaryButton,
              opacity: isBusy ? 0.6 : 1,
            }}
          >
            {connection ? 'Cancel' : 'Reset'}
          </button>
        </View>
      </form>
    </View>
  )
}

const createStyles = (
  tokens: ReturnType<typeof useTheme>['tokens'],
): Record<string, CSSProperties> => ({
  root: {
    border: `1px solid ${tokens.palette.border}`,
    borderRadius: tokens.radii.md,
    padding: tokens.spacing.lg,
    backgroundColor: tokens.palette.surface,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.md,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.xs,
  },
  title: {
    fontSize: tokens.typography.sizes.xl,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.palette.textPrimary,
  },
  subtitle: {
    color: tokens.palette.textSecondary,
    fontSize: tokens.typography.sizes.sm,
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.xs,
  },
  labelText: {
    fontSize: tokens.typography.sizes.xs,
    letterSpacing: 0.5,
    color: tokens.palette.textSecondary,
  },
  input: {
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.border}`,
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    backgroundColor: tokens.palette.background,
    color: tokens.palette.textPrimary,
  },
  textarea: {
    minHeight: 72,
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.border}`,
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    backgroundColor: tokens.palette.background,
    color: tokens.palette.textPrimary,
    resize: 'vertical',
  },
  inlineRow: {
    display: 'flex',
    gap: tokens.spacing.md,
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    fontSize: tokens.typography.sizes.sm,
    color: tokens.palette.textPrimary,
  },
  checkbox: {
    accentColor: tokens.palette.primary,
    width: 16,
    height: 16,
  },
  checkboxText: {
    color: tokens.palette.textSecondary,
  },
  accordion: {
    borderRadius: tokens.radii.md,
    border: `1px solid ${tokens.palette.border}`,
    padding: tokens.spacing.sm,
    backgroundColor: tokens.palette.background,
  },
  summary: {
    cursor: 'pointer',
    fontSize: tokens.typography.sizes.md,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.palette.primary,
    outline: 'none',
  },
  accordionPanel: {
    marginTop: tokens.spacing.sm,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacing.sm,
  },
  statusText: {
    color: tokens.palette.info,
    fontSize: tokens.typography.sizes.sm,
    marginTop: tokens.spacing.sm,
  },
  footer: {
    display: 'flex',
    gap: tokens.spacing.sm,
    marginTop: tokens.spacing.md,
  },
  primaryButton: {
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    borderRadius: tokens.radii.sm,
    border: 'none',
    backgroundColor: tokens.palette.primary,
    color: tokens.palette.accentContrast,
    cursor: 'pointer',
  },
  secondaryButton: {
    padding: `${tokens.spacing.sm}px ${tokens.spacing.md}px`,
    borderRadius: tokens.radii.sm,
    border: `1px solid ${tokens.palette.border}`,
    backgroundColor: tokens.palette.surface,
    color: tokens.palette.textPrimary,
    cursor: 'pointer',
  },
})
