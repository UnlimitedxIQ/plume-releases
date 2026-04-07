import { Cpu, X } from 'lucide-react'
import { useGradingStore } from '../../stores/grading-store'
import { useGrading } from '../../hooks/useGrading'

export default function ProvisionalProgress() {
  const { provisionalProgress, error, session } = useGradingStore()
  const { cancelScoring } = useGrading()

  const { completed, total, current } = provisionalProgress
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="flex-1 flex items-center justify-center" style={{ background: '#0a0f0d' }}>
      <div
        style={{
          display:      'flex',
          flexDirection: 'column',
          alignItems:   'center',
          gap:          '24px',
          maxWidth:     '400px',
          width:        '100%',
          padding:      '40px',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width:        '56px',
            height:       '56px',
            borderRadius: '14px',
            background:   'rgba(254, 225, 35, 0.1)',
            border:       '1px solid rgba(254, 225, 35, 0.2)',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
          }}
        >
          <Cpu size={24} style={{ color: '#FEE123' }} className="animate-spin-slow" />
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#e8ede9', margin: 0 }}>
            Provisional Scoring
          </h2>
          {session && (
            <p style={{ fontSize: '13px', color: '#5a6b60', marginTop: '4px' }}>
              {session.assignmentName}
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: '#8a9b90' }}>{current}</span>
            <span style={{ fontSize: '12px', color: '#FEE123', fontWeight: 600 }}>{percent}%</span>
          </div>
          <div
            style={{
              width:        '100%',
              height:       '6px',
              borderRadius: '3px',
              background:   '#1a2420',
              overflow:     'hidden',
            }}
          >
            <div
              style={{
                width:        `${percent}%`,
                height:       '100%',
                borderRadius: '3px',
                background:   'linear-gradient(90deg, #006747, #FEE123)',
                transition:   'width 0.3s ease',
              }}
            />
          </div>
          <div style={{ fontSize: '11px', color: '#5a6b60', marginTop: '6px', textAlign: 'center' }}>
            {completed} of {total} submissions scored
          </div>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              padding:      '10px 14px',
              borderRadius: '8px',
              background:   'rgba(239, 68, 68, 0.1)',
              border:       '1px solid rgba(239, 68, 68, 0.2)',
              color:        '#ef4444',
              fontSize:     '12px',
              width:        '100%',
            }}
          >
            {error}
          </div>
        )}

        {/* Cancel */}
        <button
          onClick={cancelScoring}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
            padding:      '8px 16px',
            borderRadius: '6px',
            border:       '1px solid #2a3a32',
            background:   'transparent',
            color:        '#8a9b90',
            fontSize:     '12px',
            cursor:       'pointer',
            transition:   'all 0.15s ease',
          }}
        >
          <X size={12} />
          Cancel
        </button>
      </div>
    </div>
  )
}
