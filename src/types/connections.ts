export type ConnectionProtocol = 'RDP' | 'VNC' | 'SSH' | 'Kubernetes'

export type ConnectionStatus = 'online' | 'idle' | 'active' | 'error'

export interface ConnectionSettings {
  colorDepth?: '16-bit' | '24-bit' | '32-bit'
  display?: 'auto' | 'fullscreen'
  compression?: 'balanced' | 'max'
  authentication?: 'password' | 'key'
  namespace?: string
  clipboardSync?: boolean
  secureTunnel?: boolean
}

export interface Connection {
  id: string
  name: string
  description?: string
  host: string
  port: number
  protocol: ConnectionProtocol
  status: ConnectionStatus
  group?: string
  tags: string[]
  isFavorite: boolean
  lastUsed: number
  settings: ConnectionSettings
}

export interface ConnectionInput {
  name: string
  description?: string
  host: string
  port: number
  protocol: ConnectionProtocol
  group?: string
  tags?: string[]
  isFavorite?: boolean
  settings?: ConnectionSettings
}

export interface ConnectionUpdatePayload {
  id: string
  payload: Partial<Connection>
}

export const DEFAULT_CONNECTION_SETTINGS: ConnectionSettings = {
  colorDepth: '32-bit',
  display: 'auto',
  compression: 'balanced',
  authentication: 'password',
  clipboardSync: true,
  secureTunnel: false,
}

const now = Date.now()

export const DEFAULT_CONNECTIONS: Connection[] = [
  {
    id: 'conn-hq-rdp',
    name: 'hq-rdp',
    description: 'Production Windows host',
    host: 'rdp.prod.guacmod.net',
    port: 3389,
    protocol: 'RDP',
    status: 'online',
    group: 'Production',
    tags: ['prod', 'windows', 'critical'],
    isFavorite: true,
    lastUsed: now - 2 * 60_000,
    settings: { ...DEFAULT_CONNECTION_SETTINGS, display: 'fullscreen' },
  },
  {
    id: 'conn-staging-vnc',
    name: 'staging-vnc',
    description: 'Linux VNC staging environment',
    host: 'vnc.staging.guacmod.net',
    port: 5901,
    protocol: 'VNC',
    status: 'idle',
    group: 'Staging',
    tags: ['staging', 'linux'],
    isFavorite: false,
    lastUsed: now - 25 * 60_000,
    settings: { ...DEFAULT_CONNECTION_SETTINGS, colorDepth: '24-bit', compression: 'max' },
  },
  {
    id: 'conn-ops-ssh',
    name: 'ssh-admin',
    description: 'Operations jump host',
    host: 'ssh.ops.guacmod.net',
    port: 22,
    protocol: 'SSH',
    status: 'active',
    group: 'Operations',
    tags: ['ssh', 'linux', 'admin'],
    isFavorite: true,
    lastUsed: now - 8 * 60_000,
    settings: {
      ...DEFAULT_CONNECTION_SETTINGS,
      authentication: 'key',
      secureTunnel: true,
      clipboardSync: false,
    },
  },
  {
    id: 'conn-k8s-control',
    name: 'k8s-control',
    description: 'Kubernetes control plane',
    host: 'api.k8s.guacmod.net',
    port: 6443,
    protocol: 'Kubernetes',
    status: 'error',
    group: 'Platform',
    tags: ['k8s', 'api'],
    isFavorite: false,
    lastUsed: now - 5 * 24 * 60 * 60 * 1000,
    settings: {
      ...DEFAULT_CONNECTION_SETTINGS,
      namespace: 'default',
      secureTunnel: true,
      clipboardSync: false,
    },
  },
]
