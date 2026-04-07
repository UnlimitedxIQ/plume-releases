import { motion } from 'framer-motion'
import { RefreshCw, CheckCircle2 } from 'lucide-react'
import { useAgentMode } from '../../hooks/useAgentMode'
import PlanNode from './PlanNode'

interface PlannerPanelProps {
  tabId: string
}

export default function PlannerPanel({ tabId }: PlannerPanelProps) {
  const { plan, approvePlan, regeneratePlan, isLoading } = useAgentMode(tabId)

  return (
    <div
      className="flex flex-col shrink-0"
      style={{
        width:        '300px',
        minWidth:     '260px',
        maxWidth:     '340px',
        background:   '#0c1510',
        borderRight:  '1px solid #1a2420',
        height:       '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding:      '12px 14px',
          borderBottom: '1px solid #1a2420',
          flexShrink:   0,
        }}
      >
        <h3
          style={{
            fontSize:   '13px',
            fontWeight: 700,
            color:      '#e8ede9',
            marginBottom:'2px',
          }}
        >
          Execution Plan
        </h3>
        {plan && (
          <p style={{ fontSize: '11px', color: '#5a6b60' }}>
            {plan.title}
          </p>
        )}
      </div>

      {/* Progress bar */}
      {plan && (
        <div
          style={{
            height:     '2px',
            background: '#1a2420',
            flexShrink: 0,
          }}
        >
          <motion.div
            animate={{ width: `${plan.progress}%` }}
            transition={{ duration: 0.4 }}
            style={{
              height:     '100%',
              background: 'linear-gradient(90deg, #154733, #FEE123)',
            }}
          />
        </div>
      )}

      {/* Steps */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: '10px' }}
      >
        {!plan ? (
          <EmptyPlanState />
        ) : (
          <div className="flex flex-col gap-2">
            {plan.steps.map((step) => (
              <PlanNode key={step.id} step={step} />
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {plan && plan.status === 'draft' && (
        <div
          style={{
            padding:      '10px',
            borderTop:    '1px solid #1a2420',
            display:      'flex',
            gap:          '8px',
            flexShrink:   0,
          }}
        >
          <button
            onClick={approvePlan}
            disabled={isLoading}
            style={{
              flex:         1,
              display:      'flex',
              alignItems:   'center',
              justifyContent:'center',
              gap:          '6px',
              padding:      '8px',
              borderRadius: '8px',
              border:       '1px solid #006747',
              background:   'rgba(0,103,71,0.15)',
              color:        '#FEE123',
              fontWeight:   600,
              fontSize:     '12px',
              cursor:       isLoading ? 'not-allowed' : 'pointer',
              transition:   'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.background = 'rgba(0,103,71,0.3)'
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.background = 'rgba(0,103,71,0.15)'
            }}
          >
            <CheckCircle2 size={13} />
            Approve Plan
          </button>
          <button
            onClick={regeneratePlan}
            disabled={isLoading}
            title="Regenerate plan"
            style={{
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              width:         '36px',
              borderRadius:  '8px',
              border:        '1px solid #2a3a32',
              background:    'transparent',
              color:         '#5a6b60',
              cursor:        isLoading ? 'not-allowed' : 'pointer',
              transition:    'all 0.15s ease',
              flexShrink:    0,
            }}
            onMouseEnter={(e) => {
              if (!isLoading) e.currentTarget.style.color = '#8a9b90'
            }}
            onMouseLeave={(e) => {
              if (!isLoading) e.currentTarget.style.color = '#5a6b60'
            }}
          >
            <RefreshCw size={13} style={{ animation: isLoading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      )}
    </div>
  )
}

function EmptyPlanState() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-3"
      style={{ minHeight: '120px' }}
    >
      <div
        style={{
          width:        '40px',
          height:       '40px',
          borderRadius: '50%',
          background:   'rgba(21,71,51,0.2)',
          border:       '1px dashed #2a3a32',
          display:      'flex',
          alignItems:   'center',
          justifyContent:'center',
          fontSize:     '18px',
        }}
      >
        📋
      </div>
      <p style={{ fontSize: '12px', color: '#5a6b60', textAlign: 'center', lineHeight: 1.5 }}>
        Send a message to generate an execution plan.
      </p>
    </div>
  )
}
