interface SubmissionCardProps {
  body:        string | null
  submittedAt: string | null
  tier?:       'top' | 'middle' | 'bottom'
  index?:      number
}

const TIER_COLORS = {
  top:    { bg: 'rgba(34, 197, 94, 0.08)',  border: 'rgba(34, 197, 94, 0.2)',  label: '#22c55e' },
  middle: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)', label: '#f59e0b' },
  bottom: { bg: 'rgba(239, 68, 68, 0.08)',  border: 'rgba(239, 68, 68, 0.2)',  label: '#ef4444' },
}

export default function SubmissionCard({ body, submittedAt, tier, index }: SubmissionCardProps) {
  const wordCount = body ? body.split(/\s+/).filter(Boolean).length : 0
  const tierStyle = tier ? TIER_COLORS[tier] : null

  return (
    <div
      style={{
        border:       `1px solid ${tierStyle?.border ?? '#2a3a32'}`,
        borderRadius: '8px',
        background:   tierStyle?.bg ?? '#111916',
        overflow:     'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display:       'flex',
          alignItems:    'center',
          justifyContent: 'space-between',
          padding:       '8px 12px',
          borderBottom:  '1px solid rgba(42, 58, 50, 0.5)',
          background:    'rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {tier && (
            <span
              style={{
                fontSize:     '10px',
                fontWeight:   700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color:        tierStyle?.label,
                background:   'rgba(0, 0, 0, 0.3)',
                padding:      '2px 6px',
                borderRadius: '4px',
              }}
            >
              {tier} {index !== undefined ? `#${index + 1}` : ''}
            </span>
          )}
          <span style={{ fontSize: '11px', color: '#5a6b60' }}>{wordCount} words</span>
        </div>
        {submittedAt && (
          <span style={{ fontSize: '11px', color: '#5a6b60' }}>
            {new Date(submittedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Body */}
      <div
        style={{
          padding:    '12px',
          maxHeight:  '300px',
          overflowY:  'auto',
          fontSize:   '13px',
          lineHeight: 1.6,
          color:      '#e8ede9',
          whiteSpace: 'pre-wrap',
        }}
      >
        {body ?? 'No text content available.'}
      </div>
    </div>
  )
}
