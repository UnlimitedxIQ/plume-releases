import { useState } from 'react'
import { ExternalLink, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { ipc } from '../../lib/ipc'
import { useCanvasStore } from '../../stores/canvas-store'

interface CanvasStepProps {
  onNext: () => void
  onSkip: () => void
}

export default function CanvasStep({ onNext, onSkip }: CanvasStepProps) {
  const [token,   setToken]   = useState('')
  const [testing, setTesting] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fetchCourses = useCanvasStore((s) => s.fetchCourses)

  async function handleTest() {
    const trimmed = token.trim()
    if (!trimmed) {
      setError('Please paste your Canvas access token.')
      return
    }
    setTesting(true)
    setError(null)
    try {
      const result = await ipc.testCanvasConnection(trimmed)
      if (!result.success) {
        setError(result.error ?? 'Connection failed. Check your token and try again.')
        return
      }
      await ipc.setCanvasToken(trimmed)
      await fetchCourses()
      setSuccess(true)
      setTimeout(onNext, 800)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div style={{ padding: '28px 32px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>🎓</div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#e8ede9', marginBottom: '6px' }}>
          Connect Canvas LMS
        </h2>
        <p style={{ fontSize: '13px', color: '#8a9b90', lineHeight: 1.65 }}>
          Link your Canvas account to see assignments and due dates.
          This is optional — you can do it later in Settings.
        </p>
      </div>

      {/* Instructions */}
      <div
        style={{
          background:   '#0c1510',
          border:       '1px solid #2a3a32',
          borderRadius: '10px',
          padding:      '12px 14px',
          marginBottom: '14px',
          fontSize:     '12px',
          color:        '#8a9b90',
          lineHeight:   1.8,
        }}
      >
        <strong style={{ color: '#e8ede9', display: 'block', marginBottom: '6px' }}>
          To get your token:
        </strong>
        <ol style={{ paddingLeft: '16px' }}>
          <li>Log in at canvas.uoregon.edu</li>
          <li>Account → Settings → Approved Integrations</li>
          <li>Click "+ New Access Token" → name it "Plume"</li>
          <li>Copy the token and paste it below</li>
        </ol>
      </div>

      <a
        href="https://canvas.uoregon.edu/profile/settings"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '6px',
          padding:        '8px 12px',
          borderRadius:   '8px',
          border:         '1px solid #2a3a32',
          background:     'transparent',
          color:          '#8a9b90',
          fontSize:       '12px',
          textDecoration: 'none',
          marginBottom:   '14px',
          transition:     'all 0.15s ease',
        }}
      >
        <ExternalLink size={12} />
        Open Canvas Settings
      </a>

      {/* Token input */}
      <textarea
        value={token}
        onChange={(e) => { setToken(e.target.value); setError(null); setSuccess(false) }}
        placeholder="Paste your Canvas access token here…"
        rows={3}
        className="selectable"
        style={{
          width:        '100%',
          background:   '#0c1510',
          border:       `1px solid ${error ? '#ef4444' : success ? '#22c55e' : '#2a3a32'}`,
          borderRadius: '8px',
          padding:      '10px 12px',
          color:        '#e8ede9',
          fontSize:     '12px',
          fontFamily:   "'JetBrains Mono', monospace",
          resize:       'none',
          outline:      'none',
          marginBottom: '10px',
        }}
        onFocus={(e) => { if (!error && !success) e.currentTarget.style.borderColor = '#006747' }}
        onBlur={(e)  => { if (!error && !success) e.currentTarget.style.borderColor = '#2a3a32' }}
      />

      {error && (
        <div
          style={{
            display:      'flex',
            alignItems:   'flex-start',
            gap:          '6px',
            padding:      '8px 10px',
            borderRadius: '7px',
            background:   'rgba(239,68,68,0.1)',
            border:       '1px solid rgba(239,68,68,0.25)',
            color:        '#ef4444',
            fontSize:     '12px',
            marginBottom: '10px',
          }}
        >
          <AlertCircle size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
            padding:      '8px 10px',
            borderRadius: '7px',
            background:   'rgba(34,197,94,0.1)',
            border:       '1px solid rgba(34,197,94,0.25)',
            color:        '#22c55e',
            fontSize:     '12px',
            marginBottom: '10px',
          }}
        >
          <CheckCircle2 size={13} />
          Canvas connected successfully!
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={onSkip}
          style={{
            padding:      '10px 16px',
            borderRadius: '8px',
            border:       '1px solid #2a3a32',
            background:   'transparent',
            color:        '#5a6b60',
            fontSize:     '13px',
            cursor:       'pointer',
            flexShrink:   0,
          }}
        >
          Skip for now
        </button>
        <button
          onClick={handleTest}
          disabled={testing || success || !token.trim()}
          style={{
            flex:         1,
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
            gap:          '7px',
            padding:      '10px',
            borderRadius: '8px',
            border:       'none',
            background:   token.trim() && !testing && !success
              ? 'linear-gradient(135deg, #154733, #006747)'
              : '#1a2420',
            color:        token.trim() && !testing && !success ? '#FEE123' : '#5a6b60',
            fontWeight:   700,
            fontSize:     '13px',
            cursor:       token.trim() && !testing && !success ? 'pointer' : 'not-allowed',
          }}
        >
          {testing ? (
            <>
              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              Testing…
            </>
          ) : success ? (
            <>
              <CheckCircle2 size={13} />
              Connected!
            </>
          ) : (
            'Connect Canvas →'
          )}
        </button>
      </div>
    </div>
  )
}
