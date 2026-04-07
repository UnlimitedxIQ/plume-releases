import { useState, useRef } from 'react'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { useWritingStyle } from '../../hooks/useWritingStyle'

interface StyleStepProps {
  onNext: () => void
  onSkip: () => void
}

export default function StyleStep({ onNext, onSkip }: StyleStepProps) {
  const [files,      setFiles]      = useState<{ name: string; content: string }[]>([])
  const [sampleText, setSampleText] = useState('')
  const [dragOver,   setDragOver]   = useState(false)
  const { analyzeAndSave, isAnalyzing } = useWritingStyle()
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    Array.from(e.target.files ?? []).forEach(readFile)
  }

  function removeFile(i: number) {
    setFiles((f) => f.filter((_, j) => j !== i))
  }

  async function handleAnalyze() {
    const samples = [
      ...files.map((f) => f.content),
      ...(sampleText.trim() ? [sampleText] : []),
    ]
    if (samples.length === 0) return
    await analyzeAndSave(samples, 'My Writing Style')
    onNext()
  }

  const hasContent = files.length > 0 || sampleText.trim().length > 0

  return (
    <div style={{ padding: '28px 32px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '24px', marginBottom: '10px' }}>✍️</div>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#e8ede9', marginBottom: '6px' }}>
          Teach Plume your writing style
        </h2>
        <p style={{ fontSize: '13px', color: '#8a9b90', lineHeight: 1.65 }}>
          Upload a few essays or emails and Plume will learn to write like you.
          This is completely optional and can be set up later.
        </p>
      </div>

      {/* Drop zone */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.doc,.docx"
        multiple
        style={{ display: 'none' }}
        onChange={handleInputChange}
      />
      <div
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        style={{
          border:       `2px dashed ${dragOver ? '#006747' : '#2a3a32'}`,
          borderRadius: '10px',
          padding:      '20px',
          textAlign:    'center',
          cursor:       'pointer',
          background:   dragOver ? 'rgba(0,103,71,0.06)' : 'transparent',
          transition:   'all 0.2s ease',
          marginBottom: '12px',
        }}
      >
        <Upload size={20} style={{ color: '#5a6b60', margin: '0 auto 6px' }} />
        <p style={{ fontSize: '13px', color: '#8a9b90', marginBottom: '3px' }}>
          Drop files or click to upload
        </p>
        <p style={{ fontSize: '11px', color: '#5a6b60' }}>
          Essays, emails, notes — any text you've written
        </p>
      </div>

      {/* Uploaded files */}
      {files.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {files.map((f, i) => (
            <div
              key={i}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '8px',
                padding:      '5px 10px',
                borderRadius: '6px',
                background:   '#111916',
                border:       '1px solid #2a3a32',
                marginBottom: '4px',
              }}
            >
              <FileText size={12} style={{ color: '#006747', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '12px', color: '#8a9b90', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </span>
              <button onClick={() => removeFile(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5a6b60', padding: 0 }}>
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Or paste text */}
      <textarea
        value={sampleText}
        onChange={(e) => setSampleText(e.target.value)}
        placeholder="Or paste a writing sample directly here…"
        rows={3}
        className="selectable"
        style={{
          width:        '100%',
          background:   '#0c1510',
          border:       '1px solid #2a3a32',
          borderRadius: '8px',
          padding:      '10px 12px',
          color:        '#e8ede9',
          fontSize:     '13px',
          resize:       'none',
          outline:      'none',
          fontFamily:   'inherit',
          marginBottom: '14px',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = '#006747' }}
        onBlur={(e)  => { e.currentTarget.style.borderColor = '#2a3a32' }}
      />

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
          onClick={handleAnalyze}
          disabled={!hasContent || isAnalyzing}
          style={{
            flex:         1,
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
            gap:          '7px',
            padding:      '10px',
            borderRadius: '8px',
            border:       'none',
            background:   hasContent && !isAnalyzing
              ? 'linear-gradient(135deg, #154733, #006747)'
              : '#1a2420',
            color:        hasContent && !isAnalyzing ? '#FEE123' : '#5a6b60',
            fontWeight:   700,
            fontSize:     '13px',
            cursor:       hasContent && !isAnalyzing ? 'pointer' : 'not-allowed',
          }}
        >
          {isAnalyzing ? (
            <>
              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
              Analyzing…
            </>
          ) : (
            'Analyze My Style →'
          )}
        </button>
      </div>

      <p
        style={{
          marginTop:  '10px',
          fontSize:   '11px',
          color:      '#5a6b60',
          textAlign:  'center',
        }}
      >
        You can always do this later in the Writing Style section.
      </p>
    </div>
  )
}
