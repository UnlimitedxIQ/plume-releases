import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Loader2, Zap, MessageSquare } from 'lucide-react'
import { ipc } from '../../lib/ipc'

interface ProviderStepProps {
  onNext: () => void
  onSkip: () => void
}

interface ProviderInfo {
  id: string
  name: string
  description: string
  icon: React.ElementType
  color: string
  installed: boolean
  loggedIn: boolean
  email?: string
  subscriptionType?: string
}

export default function ProviderStep({ onNext, onSkip }: ProviderStepProps) {
  const [providers, setProviders] = useState<ProviderInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const anyConnected = providers.some(p => p.loggedIn)

  useEffect(() => {
    detectProviders()
  }, [])

  async function detectProviders() {
    setLoading(true)
    try {
      const [installed, auth] = await Promise.all([
        ipc.checkProviders(),
        ipc.getProvidersAuth(),
      ])

      const list: ProviderInfo[] = []

      list.push({
        id: 'claude',
        name: 'Claude',
        description: 'Connect your Claude Pro or Max subscription',
        icon: Zap,
        color: '#FEE123',
        installed: installed.claude,
        loggedIn: auth.claude.loggedIn,
        email: auth.claude.email,
        subscriptionType: auth.claude.subscriptionType,
      })

      list.push({
        id: 'codex',
        name: 'ChatGPT',
        description: 'Connect your ChatGPT Plus subscription',
        icon: MessageSquare,
        color: '#22c55e',
        installed: installed.codex,
        loggedIn: auth.codex.loggedIn,
        email: auth.codex.email,
        subscriptionType: auth.codex.subscriptionType,
      })

      setProviders(list)
    } catch {
      setProviders([
        { id: 'claude', name: 'Claude', description: 'Connect your Claude Pro or Max subscription', icon: Zap, color: '#FEE123', installed: false, loggedIn: false },
        { id: 'codex', name: 'ChatGPT', description: 'Connect your ChatGPT Plus subscription', icon: MessageSquare, color: '#22c55e', installed: false, loggedIn: false },
      ])
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect(id: string) {
    setConnecting(id)
    setError(null)
    try {
      const result = await ipc.providerLogin(id)
      // Refresh provider list
      await detectProviders()
      if (result.loggedIn) {
        // Auto-set as active provider
        await ipc.setActiveProvider(id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connection failed. Please try again.')
    } finally {
      setConnecting(null)
    }
  }

  return (
    <div style={{ padding: '28px 32px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔗</div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#e8ede9', marginBottom: '6px' }}>
          Connect your AI subscription
        </h2>
        <p style={{ fontSize: '13px', color: '#8a9b90', lineHeight: 1.65 }}>
          Plume works with your existing subscription — no extra cost.
          Connect Claude or ChatGPT (or both) to get started.
        </p>
      </div>

      {/* Provider cards */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
          <Loader2 size={24} style={{ color: '#FEE123', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
          {providers.map(p => (
            <ProviderCard
              key={p.id}
              provider={p}
              connecting={connecting === p.id}
              onConnect={() => handleConnect(p.id)}
            />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            padding: '8px 10px',
            borderRadius: '7px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#ef4444',
            fontSize: '12px',
            marginBottom: '12px',
          }}
        >
          <AlertCircle size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
          {error}
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onSkip}
          style={{
            padding: '10px 16px',
            borderRadius: '8px',
            border: '1px solid #2a3a32',
            background: 'transparent',
            color: '#5a6b60',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Skip for now
        </button>
        {anyConnected && (
          <button
            onClick={onNext}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #154733, #006747)',
              color: '#FEE123',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Continue →
          </button>
        )}
      </div>
    </div>
  )
}

function ProviderCard({
  provider,
  connecting,
  onConnect,
}: {
  provider: ProviderInfo
  connecting: boolean
  onConnect: () => void
}) {
  const Icon = provider.icon

  if (!provider.installed) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          borderRadius: '10px',
          background: '#111916',
          border: '1px solid #1e2d26',
          opacity: 0.5,
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: '#1a2420',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} style={{ color: '#3a4a40' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#5a6b60' }}>
            {provider.name}
          </div>
          <div style={{ fontSize: '11px', color: '#3a4a40', marginTop: '2px' }}>
            CLI not installed — install {provider.id === 'claude' ? 'Claude Code' : 'Codex CLI'} first
          </div>
        </div>
      </div>
    )
  }

  if (provider.loggedIn) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 16px',
          borderRadius: '10px',
          background: '#111916',
          border: `1px solid ${provider.color}33`,
          borderLeft: `3px solid ${provider.color}`,
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: `${provider.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={20} style={{ color: provider.color }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8ede9' }}>
            {provider.name}
            {provider.subscriptionType && (
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: provider.color,
                background: `${provider.color}15`,
                borderRadius: '4px',
                padding: '1px 6px',
                marginLeft: '8px',
                textTransform: 'uppercase',
              }}>
                {provider.subscriptionType}
              </span>
            )}
          </div>
          <div style={{ fontSize: '11px', color: '#8a9b90', marginTop: '2px' }}>
            {provider.email ?? 'Connected'}
          </div>
        </div>
        <CheckCircle2 size={20} style={{ color: '#22c55e', flexShrink: 0 }} />
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        borderRadius: '10px',
        background: '#111916',
        border: '1px solid #1e2d26',
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: `${provider.color}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={20} style={{ color: provider.color }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 700, color: '#e8ede9' }}>
          {provider.name}
        </div>
        <div style={{ fontSize: '11px', color: '#5a6b60', marginTop: '2px' }}>
          {provider.description}
        </div>
      </div>
      <button
        onClick={onConnect}
        disabled={connecting}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 16px',
          borderRadius: '8px',
          border: 'none',
          background: connecting ? '#1a2420' : provider.color,
          color: connecting ? '#5a6b60' : '#0a0f0d',
          fontSize: '12px',
          fontWeight: 700,
          cursor: connecting ? 'not-allowed' : 'pointer',
          flexShrink: 0,
        }}
      >
        {connecting ? (
          <>
            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
            Connecting...
          </>
        ) : (
          'Connect'
        )}
      </button>
    </div>
  )
}
