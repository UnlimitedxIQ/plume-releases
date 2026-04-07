import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, Plus, Loader2, FileText, X } from 'lucide-react'
import { ipc } from '../../lib/ipc'
import { useStyleStore } from '../../stores/style-store'
import { useWritingStyle } from '../../hooks/useWritingStyle'
import StyleProfile from './StyleProfile'
import StyleRules from './StyleRules'
import StylePreview from './StylePreview'
import type { StyleProfile as StyleProfileType } from '../../types/style'

type WizardView = 'list' | 'create' | 'detail'

export default function StyleWizard() {
  const [view,           setView]          = useState<WizardView>('list')
  const [selectedId,     setSelectedId]    = useState<string | null>(null)
  const { profiles, activeProfileId, setActiveProfile } = useStyleStore()
  const { analyzeAndSave, isAnalyzing }    = useWritingStyle()

  const activeProfile = profiles.find((p) => p.id === selectedId) ?? null

  function handleSelect(id: string) {
    setSelectedId(id)
    setView('detail')
  }

  async function handleAnalyzed(profile: StyleProfileType) {
    setSelectedId(profile.id)
    setView('detail')
  }

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ background: '#0a0f0d' }}
    >
      {/* Header */}
      <div
        style={{
          padding:      '14px 20px',
          borderBottom: '1px solid #1a2420',
          display:      'flex',
          alignItems:   'center',
          gap:          '12px',
          flexShrink:   0,
        }}
      >
        {view !== 'list' && (
          <button
            onClick={() => setView('list')}
            style={{
              background: 'transparent',
              border:     'none',
              color:      '#5a6b60',
              cursor:     'pointer',
              fontSize:   '18px',
              lineHeight: 1,
              padding:    '2px 6px',
            }}
          >
            ←
          </button>
        )}
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#e8ede9' }}>
            Writing Style
          </h2>
          <p style={{ fontSize: '12px', color: '#5a6b60' }}>
            Teach Plume to write like you.
          </p>
        </div>
        {view === 'list' && (
          <button
            onClick={() => setView('create')}
            style={{
              marginLeft:    'auto',
              display:       'flex',
              alignItems:    'center',
              gap:           '6px',
              padding:       '7px 14px',
              borderRadius:  '8px',
              border:        '1px solid #006747',
              background:    'rgba(0,103,71,0.15)',
              color:         '#FEE123',
              fontWeight:    600,
              fontSize:      '12px',
              cursor:        'pointer',
              transition:    'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,103,71,0.3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,103,71,0.15)' }}
          >
            <Plus size={13} />
            New Profile
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 overflow-y-auto"
              style={{ padding: '16px 20px', height: '100%' }}
            >
              {profiles.length === 0 ? (
                <EmptyProfileState onCreate={() => setView('create')} />
              ) : (
                <div
                  style={{
                    display:             'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                    gap:                 '12px',
                  }}
                >
                  {profiles.map((p) => (
                    <ProfileCard
                      key={p.id}
                      profile={p}
                      isActive={p.id === activeProfileId}
                      onSelect={() => handleSelect(p.id)}
                      onActivate={() => setActiveProfile(p.id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {view === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <UploadWizard
                onComplete={handleAnalyzed}
                isAnalyzing={isAnalyzing}
                onAnalyze={analyzeAndSave}
              />
            </motion.div>
          )}

          {view === 'detail' && activeProfile && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              <div className="flex flex-1 min-h-0 overflow-hidden">
                <div className="flex flex-col gap-4 flex-1 overflow-y-auto" style={{ padding: '16px' }}>
                  <StyleProfile profile={activeProfile} />
                  <StyleRules profile={activeProfile} />
                </div>
                <div style={{ width: '400px', borderLeft: '1px solid #1a2420', minWidth: '320px' }}>
                  <StylePreview profile={activeProfile} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Profile Card ──────────────────────────────────────────────────────────

function ProfileCard({
  profile,
  isActive,
  onSelect,
  onActivate,
}: {
  profile:    StyleProfileType
  isActive:   boolean
  onSelect:   () => void
  onActivate: () => void
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        background:   '#111916',
        border:       `1px solid ${isActive ? 'rgba(0,103,71,0.5)' : '#2a3a32'}`,
        borderRadius: '12px',
        padding:      '14px',
        cursor:       'pointer',
        transition:   'all 0.15s ease',
        boxShadow:    isActive ? '0 0 16px rgba(0,103,71,0.15)' : 'none',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#374f44' }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = isActive ? 'rgba(0,103,71,0.5)' : '#2a3a32' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#e8ede9' }}>
            {profile.name}
          </div>
          <div style={{ fontSize: '11px', color: '#5a6b60' }}>
            {profile.sampleCount} sample{profile.sampleCount !== 1 ? 's' : ''}
          </div>
        </div>
        {isActive && (
          <span
            style={{
              fontSize:     '10px',
              fontWeight:   700,
              padding:      '2px 7px',
              borderRadius: '5px',
              background:   'rgba(0,103,71,0.2)',
              color:        '#22c55e',
              border:       '1px solid rgba(0,103,71,0.4)',
            }}
          >
            Active
          </span>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mb-3">
        <StatBadge label="Formality" value={`${profile.formality}%`} />
        <StatBadge label="Tone" value={profile.tone} />
        <StatBadge label="Vocab" value={profile.vocabulary} />
      </div>

      {!isActive && (
        <button
          onClick={(e) => { e.stopPropagation(); onActivate() }}
          style={{
            width:        '100%',
            padding:      '6px',
            borderRadius: '6px',
            border:       '1px solid #2a3a32',
            background:   'transparent',
            color:        '#5a6b60',
            fontSize:     '11px',
            cursor:       'pointer',
            transition:   'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#006747'
            e.currentTarget.style.color = '#22c55e'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2a3a32'
            e.currentTarget.style.color = '#5a6b60'
          }}
        >
          Set active
        </button>
      )}
    </div>
  )
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        fontSize:     '10px',
        padding:      '2px 8px',
        borderRadius: '5px',
        background:   '#1a2420',
        color:        '#8a9b90',
        border:       '1px solid #2a3a32',
      }}
    >
      <span style={{ color: '#5a6b60' }}>{label}: </span>
      {value}
    </span>
  )
}

function EmptyProfileState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center" style={{ minHeight: '300px', gap: '16px' }}>
      <div style={{ fontSize: '48px' }}>✍️</div>
      <div className="text-center">
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#e8ede9', marginBottom: '6px' }}>
          No style profiles yet
        </h3>
        <p style={{ fontSize: '13px', color: '#5a6b60', lineHeight: 1.6 }}>
          Upload samples of your writing and Plume will learn<br />to match your unique voice.
        </p>
      </div>
      <button
        onClick={onCreate}
        style={{
          padding:      '10px 24px',
          borderRadius: '8px',
          border:       '1px solid #006747',
          background:   'rgba(0,103,71,0.15)',
          color:        '#FEE123',
          fontWeight:   600,
          fontSize:     '13px',
          cursor:       'pointer',
        }}
      >
        Create Your First Profile
      </button>
    </div>
  )
}

// ── Upload Wizard ─────────────────────────────────────────────────────────

function UploadWizard({
  onComplete,
  isAnalyzing,
  onAnalyze,
}: {
  onComplete:  (profile: StyleProfileType) => void
  isAnalyzing: boolean
  onAnalyze:   (samples: string[], name: string) => Promise<StyleProfileType | null>
}) {
  const [samples,   setSamples]   = useState<string[]>([''])
  const [files,     setFiles]     = useState<{ name: string; content: string }[]>([])
  const [name,      setName]      = useState('My Writing Style')
  const [dragOver,  setDragOver]  = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addSampleField() {
    setSamples((s) => [...s, ''])
  }

  function updateSample(i: number, val: string) {
    setSamples((s) => s.map((x, j) => j === i ? val : x))
  }

  function removeSample(i: number) {
    setSamples((s) => s.filter((_, j) => j !== i))
  }

  function removeFile(i: number) {
    setFiles((f) => f.filter((_, j) => j !== i))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    Array.from(e.dataTransfer.files).forEach(readFile)
  }

  function readFile(file: File) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      setFiles((f) => [...f, { name: file.name, content }])
    }
    reader.readAsText(file)
  }

  async function handlePickFiles() {
    try {
      const picked = await ipc.pickFiles()
      picked.forEach((f) => {
        if (f.content) setFiles((prev) => [...prev, { name: f.name, content: f.content! }])
      })
    } catch {}
  }

  async function handleAnalyze() {
    const allSamples = [
      ...samples.filter((s) => s.trim()),
      ...files.map((f) => f.content),
    ]
    if (allSamples.length === 0) return
    const profile = await onAnalyze(allSamples, name)
    if (profile) onComplete(profile)
  }

  const hasContent = samples.some((s) => s.trim()) || files.length > 0

  return (
    <div className="flex-1 overflow-y-auto" style={{ padding: '20px', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
      {/* Profile name */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#8a9b90', display: 'block', marginBottom: '6px' }}>
          Profile name
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{
            width:        '100%',
            background:   '#111916',
            border:       '1px solid #2a3a32',
            borderRadius: '8px',
            padding:      '9px 12px',
            color:        '#e8ede9',
            fontSize:     '13px',
            outline:      'none',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#006747' }}
          onBlur={(e)  => { e.currentTarget.style.borderColor = '#2a3a32' }}
        />
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onClick={handlePickFiles}
        style={{
          border:       `2px dashed ${dragOver ? '#006747' : '#2a3a32'}`,
          borderRadius: '12px',
          padding:      '24px',
          textAlign:    'center',
          cursor:       'pointer',
          background:   dragOver ? 'rgba(0,103,71,0.08)' : 'transparent',
          transition:   'all 0.2s ease',
          marginBottom: '16px',
        }}
      >
        <Upload size={24} style={{ color: '#5a6b60', margin: '0 auto 8px' }} />
        <p style={{ fontSize: '13px', color: '#8a9b90', marginBottom: '4px' }}>
          Drop files here or click to browse
        </p>
        <p style={{ fontSize: '11px', color: '#5a6b60' }}>
          .txt, .md, .docx — essays, emails, notes, anything you've written
        </p>
      </div>

      {/* Uploaded files */}
      {files.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          {files.map((f, i) => (
            <div
              key={i}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '8px',
                padding:      '6px 10px',
                borderRadius: '6px',
                background:   '#111916',
                border:       '1px solid #2a3a32',
                marginBottom: '4px',
              }}
            >
              <FileText size={12} style={{ color: '#006747' }} />
              <span style={{ flex: 1, fontSize: '12px', color: '#8a9b90', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </span>
              <button onClick={() => removeFile(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5a6b60', padding: 0 }}>
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Text paste areas */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#8a9b90', marginBottom: '8px' }}>
          Or paste writing samples directly
        </div>
        {samples.map((s, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: '8px' }}>
            <textarea
              value={s}
              onChange={(e) => updateSample(i, e.target.value)}
              placeholder={`Sample ${i + 1} — paste any writing here…`}
              rows={4}
              className="selectable"
              style={{
                width:        '100%',
                background:   '#111916',
                border:       '1px solid #2a3a32',
                borderRadius: '8px',
                padding:      '10px 12px',
                color:        '#e8ede9',
                fontSize:     '13px',
                resize:       'vertical',
                outline:      'none',
                fontFamily:   'inherit',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#006747' }}
              onBlur={(e)  => { e.currentTarget.style.borderColor = '#2a3a32' }}
            />
            {samples.length > 1 && (
              <button
                onClick={() => removeSample(i)}
                style={{
                  position:  'absolute',
                  top:       '6px',
                  right:     '8px',
                  background:'transparent',
                  border:    'none',
                  cursor:    'pointer',
                  color:     '#5a6b60',
                  padding:   0,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addSampleField}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '6px',
            background: 'transparent',
            border:     'none',
            color:      '#5a6b60',
            fontSize:   '12px',
            cursor:     'pointer',
            padding:    '4px 0',
          }}
        >
          <Plus size={12} /> Add another sample
        </button>
      </div>

      {/* Analyze button */}
      <button
        onClick={handleAnalyze}
        disabled={!hasContent || isAnalyzing}
        style={{
          width:        '100%',
          padding:      '11px',
          borderRadius: '8px',
          border:       '1px solid #006747',
          background:   hasContent && !isAnalyzing ? 'rgba(0,103,71,0.2)' : '#1a2420',
          color:        hasContent && !isAnalyzing ? '#FEE123' : '#5a6b60',
          fontWeight:   700,
          fontSize:     '13px',
          cursor:       hasContent && !isAnalyzing ? 'pointer' : 'not-allowed',
          display:      'flex',
          alignItems:   'center',
          justifyContent:'center',
          gap:          '8px',
          transition:   'all 0.15s ease',
        }}
      >
        {isAnalyzing ? (
          <>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            Analyzing your style…
          </>
        ) : (
          'Analyze My Writing Style'
        )}
      </button>
    </div>
  )
}
