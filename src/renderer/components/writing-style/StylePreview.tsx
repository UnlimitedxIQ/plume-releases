import { useState } from 'react'
import { Loader2, ArrowRight } from 'lucide-react'
import { useWritingStyle } from '../../hooks/useWritingStyle'
import type { StyleProfile } from '../../types/style'

interface StylePreviewProps {
  profile: StyleProfile
}

export default function StylePreview({ profile }: StylePreviewProps) {
  const [input,      setInput]      = useState('')
  const [output,     setOutput]     = useState('')
  const [isLoading,  setIsLoading]  = useState(false)
  const { rewriteInStyle } = useWritingStyle()

  async function handleRewrite() {
    if (!input.trim() || isLoading) return
    setIsLoading(true)
    setOutput('')
    try {
      const result = await rewriteInStyle(input, profile)
      setOutput(result)
    } catch {
      setOutput('Failed to rewrite. Please check your API key and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: '#0c1510' }}
    >
      {/* Header */}
      <div
        style={{
          padding:      '12px 14px',
          borderBottom: '1px solid #1a2420',
          flexShrink:   0,
        }}
      >
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#e8ede9' }}>
          Style Preview
        </h3>
        <p style={{ fontSize: '11px', color: '#5a6b60' }}>
          Rewrite any text in {profile.name}
        </p>
      </div>

      {/* Input area */}
      <div
        style={{
          flex:        1,
          padding:     '12px',
          display:     'flex',
          flexDirection:'column',
          gap:         '10px',
          overflowY:   'auto',
        }}
      >
        <div>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#5a6b60', display: 'block', marginBottom: '5px' }}>
            Original text
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste any text here to rewrite it in your style…"
            rows={5}
            className="selectable"
            style={{
              width:        '100%',
              background:   '#111916',
              border:       '1px solid #2a3a32',
              borderRadius: '8px',
              padding:      '10px',
              color:        '#e8ede9',
              fontSize:     '12px',
              resize:       'vertical',
              outline:      'none',
              fontFamily:   'inherit',
              lineHeight:   1.6,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#006747' }}
            onBlur={(e)  => { e.currentTarget.style.borderColor = '#2a3a32' }}
          />
        </div>

        {/* Rewrite button */}
        <button
          onClick={handleRewrite}
          disabled={!input.trim() || isLoading}
          style={{
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            gap:           '8px',
            padding:       '9px',
            borderRadius:  '8px',
            border:        '1px solid #006747',
            background:    input.trim() && !isLoading ? 'rgba(0,103,71,0.2)' : '#1a2420',
            color:         input.trim() && !isLoading ? '#FEE123' : '#5a6b60',
            fontWeight:    600,
            fontSize:      '12px',
            cursor:        input.trim() && !isLoading ? 'pointer' : 'not-allowed',
            transition:    'all 0.15s ease',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              Rewriting…
            </>
          ) : (
            <>
              Rewrite in my style
              <ArrowRight size={13} />
            </>
          )}
        </button>

        {/* Output */}
        {(output || isLoading) && (
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#5a6b60', display: 'block', marginBottom: '5px' }}>
              Rewritten in {profile.name}
            </label>
            <div
              className="selectable"
              style={{
                background:   '#111916',
                border:       '1px solid rgba(0,103,71,0.3)',
                borderRadius: '8px',
                padding:      '10px',
                color:        '#e8ede9',
                fontSize:     '12px',
                lineHeight:   1.7,
                minHeight:    '80px',
                fontStyle:    isLoading ? 'italic' : 'normal',
              }}
            >
              {isLoading ? (
                <span style={{ color: '#5a6b60' }}>Generating…</span>
              ) : (
                output
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
