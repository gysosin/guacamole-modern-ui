import type { Connection, ConnectionInput, ConnectionUpdatePayload } from '@types/connections'
import { DEFAULT_CONNECTION_SETTINGS, DEFAULT_CONNECTIONS } from '@types/connections'

const STORAGE_KEY = 'guacmod:connections'
const NETWORK_DELAY_MS = 260

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const getStoredConnections = (): Connection[] => {
  if (typeof window === 'undefined') {
    return [...DEFAULT_CONNECTIONS]
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed: Connection[] = JSON.parse(stored)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch {
    // ignore corrupt data
  }

  return [...DEFAULT_CONNECTIONS]
}

const persistConnections = (connections: Connection[]) => {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(connections))
  } catch {
    // private mode might block storage
  }
}

let connectionStore = getStoredConnections()

const buildId = () => {
  const cryptoSource =
    globalThis.crypto ?? (globalThis as typeof globalThis & { msCrypto?: Crypto }).msCrypto
  if (cryptoSource?.randomUUID) {
    return cryptoSource.randomUUID()
  }
  return `conn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

const cloneConnection = (connection: Connection): Connection => ({
  ...connection,
  settings: { ...connection.settings },
  tags: [...connection.tags],
})

export const connectionsService = {
  fetchConnections: async () => {
    await delay(NETWORK_DELAY_MS)
    return connectionStore.map(cloneConnection)
  },

  createConnection: async (payload: ConnectionInput) => {
    await delay(NETWORK_DELAY_MS)
    const newConnection: Connection = {
      id: buildId(),
      name: payload.name,
      description: payload.description,
      host: payload.host,
      port: payload.port,
      protocol: payload.protocol,
      status: 'idle',
      group: payload.group,
      tags: payload.tags ?? [],
      isFavorite: payload.isFavorite ?? false,
      lastUsed: Date.now(),
      settings: { ...DEFAULT_CONNECTION_SETTINGS, ...payload.settings },
    }
    connectionStore = [newConnection, ...connectionStore]
    persistConnections(connectionStore)
    return cloneConnection(newConnection)
  },

  updateConnection: async ({ id, payload }: ConnectionUpdatePayload) => {
    await delay(NETWORK_DELAY_MS)
    const index = connectionStore.findIndex((item) => item.id === id)
    if (index === -1) {
      throw new Error('Connection not found')
    }

    const existing = connectionStore[index]
    const updated: Connection = {
      ...existing,
      ...payload,
      tags: payload.tags ?? existing.tags,
      settings: { ...existing.settings, ...payload.settings },
      lastUsed: payload.lastUsed ?? existing.lastUsed,
    }

    connectionStore = [
      ...connectionStore.slice(0, index),
      updated,
      ...connectionStore.slice(index + 1),
    ]
    persistConnections(connectionStore)
    return cloneConnection(updated)
  },

  deleteConnection: async (id: string) => {
    await delay(NETWORK_DELAY_MS)
    connectionStore = connectionStore.filter((item) => item.id !== id)
    persistConnections(connectionStore)
    return { success: true }
  },

  importConnections: async (payload: string | Connection[]) => {
    await delay(NETWORK_DELAY_MS)
    let parsed: Connection[] = []
    if (typeof payload === 'string') {
      try {
        const parsedRaw = JSON.parse(payload)
        if (Array.isArray(parsedRaw)) {
          parsed = parsedRaw
        }
      } catch {
        // ignore invalid JSON
      }
    } else {
      parsed = payload
    }

    if (parsed.length === 0) {
      return { imported: 0 }
    }

    connectionStore = [
      ...parsed.map((entry) => ({
        ...entry,
        id: entry.id ?? buildId(),
        tags: entry.tags ?? [],
        settings: { ...DEFAULT_CONNECTION_SETTINGS, ...entry.settings },
      })),
      ...connectionStore,
    ]

    persistConnections(connectionStore)
    return { imported: parsed.length }
  },

  exportConnections: async () => {
    await delay(NETWORK_DELAY_MS)
    return JSON.stringify(connectionStore, null, 2)
  },
}
