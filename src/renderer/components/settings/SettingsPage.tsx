import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Settings, Zap, MessageSquare, CheckCircle2, XCircle, Loader2,
  LogOut, GraduationCap, Lock, Trash2, Info, Monitor, AlertTriangle,
} from 'lucide-react'
import { ipc } from '../../lib/ipc'
import { useAppStore } from '../../stores/app-store'

interface ProviderStatus {
  installed: boolean
  loggedIn: boolean
  email?: string
  subscriptionType?: string
}

export default function SettingsPage() {
  const [claudeStatus, setClaudeStatus] = useState<ProviderStatus | null>(null)
  const [codexStatus, setCodexStatus] = useState<ProviderStatus | null>(null)
  const [activeProvider, setActiveProvider] = useState<string>('claude')
  const [loading, setLoading] = useState(true)
  const { canvasConnected } = useAppStore()
  const [showUninstallConfirm, setShowUninstallConfirm] = useState(false)
  const [clearDataConfirm, setClearDataConfirm] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'none'>('idle')

  useEffect(() => {
    loadProviderStatus()
  }, [])

  async function loadProviderStatus() {
    setLoading(true)
    try {
      const [auth, active] = await Promise.all([
        ipc.getProvidersAuth(),
        ipc.getActiveProvider(),
      ])
      setClaudeStatus(auth.claude)
      setCodexStatus(auth.codex)
      setActiveProvider(active)
    } catch {
      // Mock fallback
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect(id: string) {
    try {
      await ipc.providerLogin(id)
      loadProviderStatus()
    } catch { /* ignore */ }
  }

  async function handleDisconnect(id: string) {
    try {
      await ipc.providerLogout(id)
      loadProviderStatus()
    } catch { /* ignore */ }
  }

  async function handleSetActive(id: string) {
    await ipc.setActiveProvider(id)
    setActiveProvider(id)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: '#0a0f0d' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #1a2420', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Settings size={18} style={{ color: '#FEE123' }} />
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#e8ede9', margin: 0 }}>Settings</h2>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', maxWidth: '640px' }}>
        {/* AI Providers */}
        <SectionTitle title="AI Providers" />
        {loading ? (
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
            <Loader2 size={20} style={{ color: '#FEE123', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
            <ProviderRow
              name="Claude"
              icon={<Zap size={16} style={{ color: '#FEE123' }} />}
              status={claudeStatus}
              isActive={activeProvider === 'claude'}
              onConnect={() => handleConnect('claude')}
              onDisconnect={() => handleDisconnect('claude')}
              onSetActive={() => handleSetActive('claude')}
            />
            <ProviderRow
              name="ChatGPT (Codex)"
              icon={<MessageSquare size={16} style={{ color: '#22c55e' }} />}
              status={codexStatus}
              isActive={activeProvider === 'codex'}
              onConnect={() => handleConnect('codex')}
              onDisconnect={() => handleDisconnect('codex')}
              onSetActive={() => handleSetActive('codex')}
            />
          </div>
        )}

        {/* Connections */}
        <SectionTitle title="Connections" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          <ConnectionRow
            name="Canvas LMS"
            icon={<GraduationCap size={16} style={{ color: '#FEE123' }} />}
            connected={canvasConnected}
            detail={canvasConnected ? 'canvas.uoregon.edu' : 'Not connected'}
          />
        </div>

        {/* Data */}
        <SectionTitle title="Data" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          <SettingsRow
            icon={<Lock size={16} style={{ color: '#a855f7' }} />}
            label="Vault"
            detail="Encrypted secrets stored locally"
          />
          <div
            onClick={() => setClearDataConfirm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 14px', background: '#111916',
              border: '1px solid #1e2d26', borderRadius: '10px', cursor: 'pointer',
            }}
          >
            <Trash2 size={16} style={{ color: '#ef4444' }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>Clear all data</span>
              <div style={{ fontSize: '10px', color: '#5a6b60', marginTop: '1px' }}>Reset onboarding, conversations, and vault</div>
            </div>
          </div>
          {clearDataConfirm && (
            <ConfirmBanner
              message="This will clear all conversations, vault entries, and reset onboarding. Continue?"
              onConfirm={async () => {
                const api = (window as unknown as { api: Record<string, (...a: unknown[]) => unknown> }).api
                if (api.clearAllData) await api.clearAllData()
                localStorage.clear()
                location.reload()
              }}
              onCancel={() => setClearDataConfirm(false)}
            />
          )}
        </div>

        {/* Uninstall */}
        <SectionTitle title="Uninstall" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          <div
            onClick={() => setShowUninstallConfirm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px', background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '10px', cursor: 'pointer',
            }}
          >
            <AlertTriangle size={18} style={{ color: '#ef4444' }} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>Uninstall Plume</span>
              <div style={{ fontSize: '10px', color: '#5a6b60', marginTop: '2px' }}>
                Remove Plume, clear all app data, vault, and cached files from this computer
              </div>
            </div>
          </div>
          {showUninstallConfirm && (
            <ConfirmBanner
              message="This will delete all Plume data and launch the Windows uninstaller. Are you sure?"
              onConfirm={async () => {
                const api = (window as unknown as { api: Record<string, (...a: unknown[]) => unknown> }).api
                if (api.uninstallPlume) await api.uninstallPlume()
              }}
              onCancel={() => setShowUninstallConfirm(false)}
            />
          )}
        </div>

        {/* About + Updates */}
        <SectionTitle title="About" />
        <div style={{
          padding: '16px',
          background: '#111916',
          border: '1px solid #1e2d26',
          borderRadius: '10px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #154733, #006747)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#FEE123', fontSize: '18px', fontWeight: 900,
            }}>
              P
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8ede9' }}>Plume</div>
              <div style={{ fontSize: '11px', color: '#5a6b60' }}>Version 1.0.0</div>
            </div>
            <button
              onClick={async () => {
                setUpdateStatus('checking')
                try {
                  const api = (window as unknown as { api: Record<string, (...a: unknown[]) => Promise<unknown>> }).api
                  const result = await api.checkForUpdates() as { available: boolean; version?: string }
                  setUpdateStatus(result.available ? 'available' : 'none')
                } catch {
                  setUpdateStatus('none')
                }
              }}
              disabled={updateStatus === 'checking'}
              style={{
                padding: '6px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                border: '1px solid #2a3a32', background: 'transparent',
                color: updateStatus === 'checking' ? '#5a6b60' : '#8a9b90',
                cursor: updateStatus === 'checking' ? 'default' : 'pointer',
              }}
            >
              {updateStatus === 'checking' ? 'Checking...'
                : updateStatus === 'available' ? 'Update available!'
                : updateStatus === 'downloading' ? 'Downloading...'
                : updateStatus === 'ready' ? 'Restart to update'
                : updateStatus === 'none' ? 'Up to date'
                : 'Check for updates'}
            </button>
          </div>
          <p style={{ fontSize: '11px', color: '#8a9b90', lineHeight: 1.6, margin: 0 }}>
            AI assistant built for University of Oregon students. Powered by your existing
            Claude or ChatGPT subscription — no extra cost.
          </p>
          <div style={{ marginTop: '10px', display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '10px', color: '#5a6b60' }}>Built by Bryson</span>
            <span style={{ fontSize: '10px', color: '#3a4a40' }}>•</span>
            <span style={{ fontSize: '10px', color: '#5a6b60' }}>University of Oregon</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionTitle({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: '10px', fontWeight: 700, color: '#5a6b60',
      letterSpacing: '0.08em', textTransform: 'uppercase',
      marginBottom: '8px',
    }}>
      {title}
    </div>
  )
}

function ProviderRow({
  name, icon, status, isActive, onConnect, onDisconnect, onSetActive,
}: {
  name: string
  icon: React.ReactNode
  status: ProviderStatus | null
  isActive: boolean
  onConnect: () => void
  onDisconnect: () => void
  onSetActive: () => void
}) {
  if (!status) return null

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 14px', background: '#111916',
      border: `1px solid ${isActive && status.loggedIn ? '#006747' : '#1e2d26'}`,
      borderRadius: '10px',
    }}>
      {icon}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#e8ede9' }}>{name}</span>
          {isActive && status.loggedIn && (
            <span style={{
              fontSize: '8px', fontWeight: 700, color: '#FEE123',
              background: 'rgba(254,225,35,0.15)', borderRadius: '4px', padding: '1px 5px',
              textTransform: 'uppercase',
            }}>
              Active
            </span>
          )}
        </div>
        <div style={{ fontSize: '10px', color: '#5a6b60', marginTop: '1px' }}>
          {!status.installed
            ? 'CLI not installed'
            : status.loggedIn
              ? `${status.email ?? 'Connected'} • ${status.subscriptionType ?? ''}`
              : 'Not connected'
          }
        </div>
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {status.installed && !status.loggedIn && (
          <SmallBtn label="Connect" onClick={onConnect} />
        )}
        {status.loggedIn && !isActive && (
          <SmallBtn label="Set Active" onClick={onSetActive} />
        )}
        {status.loggedIn && (
          <SmallBtn label="Disconnect" onClick={onDisconnect} danger />
        )}
      </div>
    </div>
  )
}

function ConnectionRow({
  name, icon, connected, detail,
}: {
  name: string; icon: React.ReactNode; connected: boolean; detail: string
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 14px', background: '#111916',
      border: '1px solid #1e2d26', borderRadius: '10px',
    }}>
      {icon}
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#e8ede9' }}>{name}</span>
        <div style={{ fontSize: '10px', color: '#5a6b60', marginTop: '1px' }}>{detail}</div>
      </div>
      {connected
        ? <CheckCircle2 size={16} style={{ color: '#22c55e' }} />
        : <XCircle size={16} style={{ color: '#5a6b60' }} />
      }
    </div>
  )
}

function SettingsRow({
  icon, label, detail, danger,
}: {
  icon: React.ReactNode; label: string; detail: string; danger?: boolean
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px 14px', background: '#111916',
      border: '1px solid #1e2d26', borderRadius: '10px',
      cursor: 'pointer',
    }}>
      {icon}
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: danger ? '#ef4444' : '#e8ede9' }}>{label}</span>
        <div style={{ fontSize: '10px', color: '#5a6b60', marginTop: '1px' }}>{detail}</div>
      </div>
    </div>
  )
}

function ConfirmBanner({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        padding: '12px 14px', background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}
    >
      <span style={{ fontSize: '12px', color: '#fca5a5', flex: 1 }}>{message}</span>
      <button
        onClick={onConfirm}
        style={{
          padding: '6px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
          border: 'none', background: '#ef4444', color: '#fff', cursor: 'pointer',
        }}
      >
        Yes, do it
      </button>
      <button
        onClick={onCancel}
        style={{
          padding: '6px 14px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
          border: '1px solid #2a3a32', background: 'transparent', color: '#8a9b90', cursor: 'pointer',
        }}
      >
        Cancel
      </button>
    </motion.div>
  )
}

function SmallBtn({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 10px', borderRadius: '6px', fontSize: '10px', fontWeight: 600,
        border: `1px solid ${danger ? 'rgba(239,68,68,0.3)' : '#2a3a32'}`,
        background: danger ? 'rgba(239,68,68,0.1)' : 'transparent',
        color: danger ? '#fca5a5' : '#8a9b90',
        cursor: 'pointer',
      }}
    >
      {label}
    </button>
  )
}
