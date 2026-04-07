import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Plus, AlertCircle, Eye, EyeOff, Save, Loader2, Key } from 'lucide-react'
import { ipc } from '../../lib/ipc'
import { getIcon, C, CATEGORY_COLORS } from './skill-data'
import type { McpServer, McpCredential } from './skill-data'

interface McpCardProps {
  mcp: McpServer
  mode: 'library' | 'marketplace'
  index: number
  onInstall?: () => void
}

export default function McpCard({ mcp, mode, index, onInstall }: McpCardProps) {
  const Icon = getIcon(mcp.icon)
  const accentColor = CATEGORY_COLORS[mcp.category] ?? '#5a6b60'
  const [hovered, setHovered] = useState(false)
  const [credentialStatus, setCredentialStatus] = useState<Record<string, boolean>>({})
  const [showCredForm, setShowCredForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const hasCredentials = mcp.requiredCredentials && mcp.requiredCredentials.length > 0
  const allCredsSet = !hasCredentials || Object.values(credentialStatus).every(Boolean)
  const anyCredMissing = hasCredentials && !allCredsSet

  // Check vault for existing credentials on mount
  useEffect(() => {
    if (!hasCredentials) {
      setLoading(false)
      return
    }
    checkCredentials()
  }, [])

  async function checkCredentials() {
    if (!mcp.requiredCredentials) return
    setLoading(true)
    const status: Record<string, boolean> = {}
    for (const cred of mcp.requiredCredentials) {
      const val = await ipc.vaultGet(cred.vaultKey)
      status[cred.vaultKey] = val !== null && val !== ''
    }
    setCredentialStatus(status)
    setLoading(false)
  }

  // Installed MCP in library mode
  if (mode === 'library') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03 }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        style={{
          background: hovered ? '#1a2420' : C.surface,
          border: `1px solid #1e2d26`,
          borderLeft: `3px solid ${accentColor}`,
          borderRadius: '10px',
          overflow: 'hidden',
          transition: 'all 0.15s ease',
        }}
      >
        {/* Main row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${accentColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={16} style={{ color: accentColor }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#e8ede9' }}>{mcp.name}</div>
            <div style={{ fontSize: '10px', color: '#5a6b60', marginTop: '1px' }}>{mcp.description}</div>
          </div>
          {loading ? (
            <Loader2 size={14} style={{ color: '#5a6b60', animation: 'spin 1s linear infinite' }} />
          ) : allCredsSet ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '10px', fontWeight: 600, color: '#22c55e' }}>Connected</span>
              <Check size={14} style={{ color: '#22c55e' }} />
            </div>
          ) : (
            <button
              onClick={() => setShowCredForm(f => !f)}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '4px 8px', borderRadius: '6px',
                border: '1px solid rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.1)',
                color: '#f97316', fontSize: '10px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Key size={10} /> API Key Needed
            </button>
          )}
        </div>

        {/* Credential input form */}
        {showCredForm && anyCredMissing && mcp.requiredCredentials && (
          <CredentialForm
            credentials={mcp.requiredCredentials}
            credentialStatus={credentialStatus}
            onSaved={checkCredentials}
            onClose={() => setShowCredForm(false)}
          />
        )}
      </motion.div>
    )
  }

  // Marketplace mode
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        background: hovered ? '#1a2420' : C.surface,
        border: '1px solid #1e2d26',
        borderRadius: '10px',
        overflow: 'hidden',
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.3)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${accentColor}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} style={{ color: accentColor }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#e8ede9' }}>{mcp.name}</div>
          <div style={{ fontSize: '10px', color: '#5a6b60', marginTop: '2px' }}>{mcp.description}</div>
          {mcp.requiresAccess && (
            <div style={{ fontSize: '9px', color: '#f59e0b', fontStyle: 'italic', marginTop: '3px' }}>
              {mcp.requiresAccess}
            </div>
          )}
          {hasCredentials && (
            <div style={{ fontSize: '9px', color: '#5a6b60', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Key size={8} /> Requires: {mcp.requiredCredentials!.map(c => c.label).join(', ')}
            </div>
          )}
        </div>
        {mcp.installed ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: '#22c55e', fontWeight: 600 }}>
            <Check size={12} /> Installed
          </span>
        ) : (
          <button
            onClick={onInstall}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '5px 10px', borderRadius: '6px', border: 'none',
              background: '#006747', color: '#e8ede9', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={11} /> Add
          </button>
        )}
      </div>
    </motion.div>
  )
}

// ── Credential Input Form ─────────────────────────────────────────────────

function CredentialForm({
  credentials,
  credentialStatus,
  onSaved,
  onClose,
}: {
  credentials: McpCredential[]
  credentialStatus: Record<string, boolean>
  onSaved: () => void
  onClose: () => void
}) {
  const missing = credentials.filter(c => !credentialStatus[c.vaultKey])

  return (
    <div style={{
      padding: '0 12px 12px',
      borderTop: '1px solid #1a2420',
    }}>
      {missing.map(cred => (
        <CredentialInput
          key={cred.vaultKey}
          credential={cred}
          onSaved={onSaved}
        />
      ))}
    </div>
  )
}

function CredentialInput({
  credential,
  onSaved,
}: {
  credential: McpCredential
  onSaved: () => void
}) {
  const [value, setValue] = useState('')
  const [visible, setVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    if (!value.trim()) return
    setSaving(true)
    await ipc.vaultSet(credential.vaultKey, value.trim(), credential.label, credential.category)
    setSaving(false)
    setSaved(true)
    onSaved()
  }

  if (saved) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 0', fontSize: '11px', color: '#22c55e' }}>
        <Check size={12} /> {credential.label} saved to vault
      </div>
    )
  }

  return (
    <div style={{ padding: '8px 0' }}>
      <label style={{ fontSize: '10px', fontWeight: 600, color: '#8a9b90', display: 'block', marginBottom: '4px' }}>
        {credential.label}
      </label>
      <div style={{ display: 'flex', gap: '6px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type={visible ? 'text' : 'password'}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={credential.placeholder}
            style={{
              width: '100%',
              padding: '7px 32px 7px 8px',
              borderRadius: '6px',
              border: '1px solid #2a3a32',
              background: '#0a0f0d',
              color: '#e8ede9',
              fontSize: '11px',
              outline: 'none',
              fontFamily: 'monospace',
            }}
          />
          <button
            onClick={() => setVisible(v => !v)}
            style={{
              position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: '#5a6b60', padding: 0,
            }}
          >
            {visible ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !value.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '6px 10px', borderRadius: '6px', border: 'none',
            background: value.trim() ? '#006747' : '#1a2420',
            color: value.trim() ? '#e8ede9' : '#3a4a40',
            fontSize: '10px', fontWeight: 600,
            cursor: value.trim() ? 'pointer' : 'not-allowed',
            flexShrink: 0,
          }}
        >
          {saving ? <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={10} />}
          Save
        </button>
      </div>
    </div>
  )
}
