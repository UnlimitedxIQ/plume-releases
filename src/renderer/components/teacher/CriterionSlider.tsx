interface Rating {
  id:          string
  description: string
  points:      number
}

interface CriterionSliderProps {
  criterionId:     string
  description:     string
  longDescription?: string
  maxPoints:       number
  ratings:         Rating[]
  teacherScore:    number | undefined
  aiScore?:        number
  onScore:         (criterionId: string, points: number) => void
}

export default function CriterionSlider({
  criterionId,
  description,
  longDescription,
  maxPoints,
  ratings,
  teacherScore,
  aiScore,
  onScore,
}: CriterionSliderProps) {
  // Sort ratings by points descending
  const sortedRatings = [...ratings].sort((a, b) => b.points - a.points)

  return (
    <div
      style={{
        padding:      '12px',
        borderRadius: '8px',
        border:       '1px solid #2a3a32',
        background:   '#111916',
      }}
    >
      {/* Criterion header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#e8ede9' }}>{description}</div>
          {longDescription && (
            <div style={{ fontSize: '11px', color: '#5a6b60', marginTop: '2px' }}>{longDescription}</div>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: 700, color: teacherScore !== undefined ? '#FEE123' : '#5a6b60' }}>
            {teacherScore !== undefined ? teacherScore : '—'}
          </span>
          <span style={{ fontSize: '12px', color: '#5a6b60' }}> / {maxPoints}</span>
        </div>
      </div>

      {/* Rating pills */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {sortedRatings.map((rating) => {
          const isSelected = teacherScore === rating.points
          return (
            <button
              key={rating.id}
              onClick={() => onScore(criterionId, rating.points)}
              title={rating.description}
              style={{
                padding:      '4px 10px',
                borderRadius: '6px',
                border:       `1px solid ${isSelected ? 'rgba(254, 225, 35, 0.4)' : '#2a3a32'}`,
                background:   isSelected ? 'rgba(254, 225, 35, 0.12)' : 'transparent',
                color:        isSelected ? '#FEE123' : '#8a9b90',
                fontSize:     '11px',
                fontWeight:   isSelected ? 600 : 400,
                cursor:       'pointer',
                transition:   'all 0.15s ease',
              }}
            >
              {rating.points}pts — {rating.description}
            </button>
          )
        })}
      </div>

      {/* AI score comparison (shown after teacher scores) */}
      {teacherScore !== undefined && aiScore !== undefined && (
        <div style={{ marginTop: '6px', fontSize: '11px', color: '#5a6b60' }}>
          AI scored: {aiScore}/{maxPoints}
          {teacherScore !== aiScore && (
            <span style={{ color: Math.abs(teacherScore - aiScore) > maxPoints * 0.15 ? '#ef4444' : '#f59e0b', marginLeft: '6px' }}>
              (delta: {teacherScore - aiScore > 0 ? '+' : ''}{teacherScore - aiScore})
            </span>
          )}
        </div>
      )}
    </div>
  )
}
