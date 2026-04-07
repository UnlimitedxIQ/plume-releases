import { motion } from 'framer-motion'
import { StopCircle, RefreshCw } from 'lucide-react'
import { useAgentMode } from '../../hooks/useAgentMode'

interface LoopPanelProps {
  tabId: string
}

export default function LoopPanel({ tabId }: LoopPanelProps) {
  const { loopState, stopLoop } = useAgentMode(tabId)

  const {
    currentIteration = 0,
    maxIterations    = 5,
    deltas           = [],
    isRunning        = false,
  } = loopState ?? {}

  const progress = maxIterations > 0 ? currentIteration / maxIterations : 0
  const radius   = 36
  const circ     = 2 * Math.PI * radius
  const offset   = circ * (1 - progress)

  return (
    <div
      className="flex flex-col shrink-0"
      style={{
        width:      '200px',
        minWidth:   '180px',
        background: '#0a0f0d',
        borderLeft: '1px solid #1a2420',
        height:     '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding:      '10px 12px',
          borderBottom: '1px solid #1a2420',
          display:      'flex',
          alignItems:   'center',
          gap:          '8px',
          flexShrink:   0,
        }}
      >
        <RefreshCw
          size={13}
          style={{
            color:     '#006747',
            animation: isRunning ? 'spin 2s linear infinite' : 'none',
          }}
        />
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#e8ede9' }}>
          Loop
        </h3>
      </div>

      {/* Circular progress */}
      <div
        className="flex flex-col items-center"
        style={{ padding: '20px 12px' }}
      >
        <div style={{ position: 'relative', width: '96px', height: '96px' }}>
          <svg
            width="96"
            height="96"
            viewBox="0 0 96 96"
            style={{ transform: 'rotate(-90deg)' }}
          >
            {/* Track */}
            <circle
              cx="48" cy="48" r={radius}
              fill="none"
              stroke="#1a2420"
              strokeWidth="6"
            />
            {/* Progress */}
            <motion.circle
              cx="48" cy="48" r={radius}
              fill="none"
              stroke={isRunning ? '#FEE123' : '#006747'}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circ}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.4 }}
            />
          </svg>
          {/* Center text */}
          <div
            style={{
              position:       'absolute',
              inset:          0,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize:   '22px',
                fontWeight: 800,
                color:      '#e8ede9',
                lineHeight: 1,
              }}
            >
              {currentIteration}
            </span>
            <span style={{ fontSize: '10px', color: '#5a6b60' }}>
              / {maxIterations}
            </span>
          </div>
        </div>

        <p
          style={{
            marginTop: '10px',
            fontSize:  '12px',
            color:     isRunning ? '#FEE123' : '#8a9b90',
            fontWeight:600,
          }}
        >
          {isRunning
            ? `Iteration ${currentIteration}`
            : currentIteration === 0
              ? 'Not started'
              : currentIteration >= maxIterations
                ? 'Completed'
                : 'Paused'
          }
        </p>
      </div>

      {/* Delta summary */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: '0 10px 10px' }}
      >
        {deltas.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p
              style={{
                fontSize:     '10px',
                fontWeight:   600,
                color:        '#5a6b60',
                textTransform:'uppercase',
                letterSpacing:'0.05em',
                marginBottom: '4px',
              }}
            >
              Changes per iteration
            </p>
            {deltas.map((delta, i) => (
              <div
                key={i}
                style={{
                  padding:      '6px 8px',
                  borderRadius: '6px',
                  background:   '#111916',
                  border:       '1px solid #1a2420',
                  fontSize:     '11px',
                  color:        '#8a9b90',
                  lineHeight:   1.4,
                }}
              >
                <span
                  style={{
                    fontSize:   '10px',
                    color:      '#5a6b60',
                    marginRight:'6px',
                    fontWeight: 600,
                  }}
                >
                  #{i + 1}
                </span>
                {delta}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stop button */}
      {isRunning && (
        <div style={{ padding: '10px', borderTop: '1px solid #1a2420', flexShrink: 0 }}>
          <button
            onClick={stopLoop}
            style={{
              width:         '100%',
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              gap:           '6px',
              padding:       '8px',
              borderRadius:  '8px',
              border:        '1px solid rgba(239,68,68,0.4)',
              background:    'rgba(239,68,68,0.1)',
              color:         '#ef4444',
              fontWeight:    600,
              fontSize:      '12px',
              cursor:        'pointer',
              transition:    'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.2)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
            }}
          >
            <StopCircle size={13} />
            Stop Loop
          </button>
        </div>
      )}
    </div>
  )
}
