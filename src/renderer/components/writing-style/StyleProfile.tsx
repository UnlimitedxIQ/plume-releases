import type { StyleProfile } from '../../types/style'

interface StyleProfileProps {
  profile: StyleProfile
}

export default function StyleProfileView({ profile }: StyleProfileProps) {
  return (
    <div
      style={{
        background:   '#111916',
        border:       '1px solid #2a3a32',
        borderRadius: '12px',
        padding:      '16px',
      }}
    >
      {/* Stats row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <StatBadge label="Formality" value={`${profile.formality}%`} />
        <StatBadge label="Vocabulary" value={profile.vocabulary} />
        <StatBadge label="Tone" value={profile.tone} />
        <StatBadge label="Avg sentence" value={`~${profile.avgSentenceLength} words`} />
      </div>

      {/* Formality bar */}
      <div style={{ marginBottom: '16px' }}>
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: '6px' }}
        >
          <span style={{ fontSize: '11px', color: '#5a6b60' }}>Informal</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#e8ede9' }}>
            Formality — {profile.formality}%
          </span>
          <span style={{ fontSize: '11px', color: '#5a6b60' }}>Formal</span>
        </div>
        <div
          style={{
            height:       '6px',
            background:   '#1a2420',
            borderRadius: '3px',
            overflow:     'hidden',
          }}
        >
          <div
            style={{
              height:     '100%',
              width:      `${profile.formality}%`,
              background: 'linear-gradient(90deg, #154733, #FEE123)',
              borderRadius:'3px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* Sentence pacing */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontSize:     '11px',
            fontWeight:   600,
            color:        '#5a6b60',
            textTransform:'uppercase',
            letterSpacing:'0.05em',
            marginBottom: '8px',
          }}
        >
          Sentence Pacing
        </div>
        <div className="flex gap-1 items-end" style={{ height: '40px' }}>
          {generatePacingBars(profile.avgSentenceLength).map((h, i) => (
            <div
              key={i}
              style={{
                flex:         1,
                height:       `${h}%`,
                background:   i === Math.floor(generatePacingBars(profile.avgSentenceLength).length / 2)
                  ? '#006747'
                  : '#2a3a32',
                borderRadius: '2px 2px 0 0',
                transition:   'height 0.4s ease',
              }}
            />
          ))}
        </div>
        <div className="flex justify-between" style={{ marginTop: '4px' }}>
          <span style={{ fontSize: '10px', color: '#5a6b60' }}>Short</span>
          <span style={{ fontSize: '10px', color: '#8a9b90' }}>
            ~{profile.avgSentenceLength} words
          </span>
          <span style={{ fontSize: '10px', color: '#5a6b60' }}>Long</span>
        </div>
      </div>

      {/* Punctuation */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontSize:     '11px',
            fontWeight:   600,
            color:        '#5a6b60',
            textTransform:'uppercase',
            letterSpacing:'0.05em',
            marginBottom: '8px',
          }}
        >
          Punctuation
        </div>
        <div className="flex flex-wrap gap-2">
          <PunctBadge label="Commas" value={`${profile.punctuationFrequency.commasPer100Words}/100w`} />
          <PunctBadge label="Semicolons" value={`${profile.punctuationFrequency.semicolonsPer100Words}/100w`} />
          <PunctBadge label="Dashes" value={profile.punctuationFrequency.dashUsage} />
          <PunctBadge label="Parens" value={profile.punctuationFrequency.parenthesesUsage} />
          <PunctBadge label="Ellipsis" value={profile.punctuationFrequency.ellipsisUsage} />
        </div>
      </div>

      {/* Quirks */}
      {profile.quirks.length > 0 && (
        <div>
          <div
            style={{
              fontSize:     '11px',
              fontWeight:   600,
              color:        '#5a6b60',
              textTransform:'uppercase',
              letterSpacing:'0.05em',
              marginBottom: '8px',
            }}
          >
            Style Quirks
          </div>
          <div className="flex flex-col gap-1">
            {profile.quirks.map((q, i) => (
              <div
                key={i}
                style={{
                  fontSize:   '12px',
                  color:      '#8a9b90',
                  padding:    '4px 8px',
                  borderRadius:'5px',
                  background: '#0c1510',
                  border:     '1px solid #1a2420',
                }}
              >
                • {q}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '4px',
        padding:      '4px 10px',
        borderRadius: '6px',
        background:   '#1a2420',
        border:       '1px solid #2a3a32',
        fontSize:     '12px',
      }}
    >
      <span style={{ color: '#5a6b60' }}>{label}:</span>
      <span style={{ color: '#e8ede9', fontWeight: 600 }}>{value}</span>
    </span>
  )
}

function PunctBadge({ label, value }: { label: string; value: string }) {
  return (
    <span
      style={{
        padding:      '3px 8px',
        borderRadius: '5px',
        background:   '#0c1510',
        border:       '1px solid #1a2420',
        fontSize:     '11px',
        color:        '#8a9b90',
      }}
    >
      <span style={{ color: '#5a6b60' }}>{label}: </span>
      {value}
    </span>
  )
}

/** Generate a simple bell-curve-ish bar chart centered on the avg sentence length. */
function generatePacingBars(avg: number): number[] {
  const bars = 12
  const center = Math.min(Math.max((avg - 5) / 45, 0), 1) * (bars - 1)
  return Array.from({ length: bars }, (_, i) => {
    const dist = Math.abs(i - center) / (bars * 0.35)
    return Math.round(Math.max(20, 100 * Math.exp(-(dist ** 2))))
  })
}
