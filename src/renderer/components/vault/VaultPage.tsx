import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Plus, Trash2, Eye, EyeOff, Key, Shield, FileText, Hash, Save } from 'lucide-react'
import { ipc } from '../../lib/ipc'
import { useAppStore } from '../../stores/app-store'
import type { VaultEntryMasked } from '../../lib/ipc'

const CATEGORIES = [
  { id: 'api_key', label: 'API Key', icon: Key, color: '#FEE123' },
  { id: 'token', label: 'Token', icon: Shield, color: '#22c55e' },
  { id: 'secret', label: 'Secret', icon: Lock, color: '#a855f7' },
  { id: 'credential', label: 'Credential', icon: Hash, color: '#3b82f6' },
  { id: 'note', label: 'Note', icon: FileText, color: '#8a9b90' },
]

function getCategoryMeta(cat: string) {
  return CATEGORIES.find(c => c.id === cat) ?? CATEGORIES[4]
}

export default function VaultPage() {
  const [entries, setEntries] = useState<VaultEntryMasked[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newLabel, setNewLabel] = useState('')
  const [newCategory, setNewCategory] = useState('api_key')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadEntries()
  }, [])

  async function loadEntries() {
    const data = await ipc.vaultGetAll()
    setEntries(data)
  }

  async function handleSave() {
    if (!newKey.trim() || !newValue.trim() || !newLabel.trim()) return
    setSaving(true)
    await ipc.vaultSet(newKey.trim(), newValue.trim(), newLabel.trim(), newCategory)
    setNewKey('')
    setNewValue('')
    setNewLabel('')
    setNewCategory('api_key')
    setShowAdd(false)
    setSaving(false)
    loadEntries()
  }

  async function handleDelete(key: string) {
    await ipc.vaultDelete(key)
    // Vault deletion also revokes the backing credential
    if (key === 'canvas-token') {
      useAppStore.getState().setCanvasConnected(false)
      useAppStore.getState().setIsInstructor(false)
    }
    loadEntries()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: '#0a0f0d' }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px',
        borderBottom: '1px solid #1a2420',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        flexShrink: 0,
      }}>
        <Lock size={18} style={{ color: '#FEE123' }} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#e8ede9', margin: 0 }}>Vault</h2>
          <p style={{ fontSize: '11px', color: '#5a6b60', margin: 0 }}>
            Encrypted local storage for secrets, API keys, and credentials. Available to all sessions.
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '6px 12px',
            borderRadius: '7px',
            border: '1px solid #006747',
            background: 'transparent',
            color: '#FEE123',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={12} /> Add Secret
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Add form */}
        <AnimatePresence>
          {showAdd && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ overflow: 'hidden', marginBottom: '16px' }}
            >
              <div style={{
                background: '#111916',
                border: '1px solid #006747',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#FEE123', marginBottom: '4px' }}>
                  New Vault Entry
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input
                    placeholder="Label (e.g. OpenAI API Key)"
                    value={newLabel}
                    onChange={e => setNewLabel(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Key name (e.g. openai-key)"
                    value={newKey}
                    onChange={e => setNewKey(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <input
                  type="password"
                  placeholder="Secret value"
                  value={newValue}
                  onChange={e => setNewValue(e.target.value)}
                  style={inputStyle}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setNewCategory(cat.id)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '14px',
                        border: `1px solid ${newCategory === cat.id ? cat.color : '#2a3a32'}`,
                        background: newCategory === cat.id ? `${cat.color}20` : 'transparent',
                        color: newCategory === cat.id ? cat.color : '#5a6b60',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowAdd(false)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #2a3a32',
                      background: 'transparent',
                      color: '#5a6b60',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !newKey.trim() || !newValue.trim() || !newLabel.trim()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      background: newKey.trim() && newValue.trim() && newLabel.trim() ? '#006747' : '#1a2420',
                      color: newKey.trim() && newValue.trim() && newLabel.trim() ? '#e8ede9' : '#3a4a40',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: newKey.trim() && newValue.trim() && newLabel.trim() ? 'pointer' : 'not-allowed',
                    }}
                  >
                    <Save size={11} /> Save to Vault
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Entry list */}
        {entries.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 20px',
            gap: '12px',
          }}>
            <Lock size={40} style={{ color: '#2a3a32' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#5a6b60', margin: '0 0 4px' }}>
                Your vault is empty
              </p>
              <p style={{ fontSize: '12px', color: '#3a4a40', margin: 0 }}>
                Add API keys, tokens, and secrets. They'll be encrypted and available to all sessions.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {entries.map((entry, i) => (
              <VaultEntryCard
                key={entry.key}
                entry={entry}
                index={i}
                onDelete={() => handleDelete(entry.key)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function VaultEntryCard({
  entry,
  index,
  onDelete,
}: {
  entry: VaultEntryMasked
  index: number
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const cat = getCategoryMeta(entry.category)
  const Icon = cat.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        background: hovered ? '#1a2420' : '#111916',
        border: '1px solid #1e2d26',
        borderLeft: `3px solid ${cat.color}`,
        borderRadius: '10px',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        background: `${cat.color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={16} style={{ color: cat.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#e8ede9' }}>{entry.label}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
          <code style={{
            fontSize: '10px',
            color: '#5a6b60',
            background: '#0a0f0d',
            padding: '1px 5px',
            borderRadius: '3px',
          }}>
            {entry.key}
          </code>
          <span style={{ fontSize: '10px', color: '#3a4a40', fontFamily: 'monospace' }}>
            {entry.maskedValue}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <span style={{
          fontSize: '8px',
          fontWeight: 600,
          color: cat.color,
          background: `${cat.color}15`,
          borderRadius: '4px',
          padding: '2px 6px',
          textTransform: 'uppercase',
        }}>
          {cat.label}
        </span>
        {hovered && (
          <button
            onClick={onDelete}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              border: 'none',
              background: 'rgba(239,68,68,0.1)',
              color: '#ef4444',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </motion.div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: '6px',
  border: '1px solid #2a3a32',
  background: '#0a0f0d',
  color: '#e8ede9',
  fontSize: '12px',
  outline: 'none',
}
