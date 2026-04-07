import { motion } from 'framer-motion'
import { CheckCircle2, Circle, SkipForward, Loader2, AlertCircle } from 'lucide-react'
import type { PlanStep, PlanStepStatus } from '../../types/agent'

interface PlanNodeProps {
  step: PlanStep
}

const STATUS_ICON: Record<PlanStepStatus, React.ElementType> = {
  pending: Circle,
  active:  Loader2,
  done:    CheckCircle2,
  skipped: SkipForward,
  error:   AlertCircle,
}

const STATUS_COLOR: Record<PlanStepStatus, string> = {
  pending: '#5a6b60',
  active:  '#FEE123',
  done:    '#22c55e',
  skipped: '#5a6b60',
  error:   '#ef4444',
}

export default function PlanNode({ step }: PlanNodeProps) {
  const Icon  = STATUS_ICON[step.status]
  const color = STATUS_COLOR[step.status]
  const isDone    = step.status === 'done'
  const isActive  = step.status === 'active'
  const isSkipped = step.status === 'skipped'

  return (
    <motion.div
      layout
      animate={{
        opacity: isSkipped ? 0.5 : 1,
        scale:   isActive  ? 1.01 : 1,
      }}
      transition={{ duration: 0.25 }}
      style={{
        display:      'flex',
        alignItems:   'flex-start',
        gap:          '10px',
        padding:      '10px 10px',
        borderRadius: '8px',
        background:   isActive ? 'rgba(254,225,35,0.05)' : 'rgba(17,25,22,0.5)',
        border:       `1px solid ${isActive ? 'rgba(254,225,35,0.2)' : '#1a2420'}`,
        boxShadow:    isActive ? '0 0 12px rgba(254,225,35,0.08)' : 'none',
        transition:   'all 0.25s ease',
      }}
    >
      {/* Step number + icon */}
      <div
        style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           '4px',
          flexShrink:    0,
        }}
      >
        <div
          style={{
            width:        '20px',
            height:       '20px',
            borderRadius: '50%',
            background:   `${color}22`,
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
            color,
          }}
        >
          <Icon
            size={12}
            style={{
              animation: isActive ? 'spin 1s linear infinite' : 'none',
            }}
          />
        </div>
        <span
          style={{
            fontSize:   '10px',
            color:      '#5a6b60',
            fontWeight: 600,
          }}
        >
          {String(step.index + 1).padStart(2, '0')}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize:        '12px',
            fontWeight:      600,
            color:           isSkipped ? '#5a6b60' : '#e8ede9',
            marginBottom:    '3px',
            textDecoration:  isSkipped ? 'line-through' : 'none',
            lineHeight:      1.4,
          }}
        >
          {step.title}
        </div>
        <div
          style={{
            fontSize:    '11px',
            color:       '#5a6b60',
            lineHeight:  1.45,
            textDecoration: isSkipped ? 'line-through' : 'none',
          }}
        >
          {step.description}
        </div>

        {/* Result when done */}
        {isDone && step.result && (
          <div
            style={{
              marginTop:    '6px',
              padding:      '4px 8px',
              borderRadius: '5px',
              background:   'rgba(34,197,94,0.08)',
              border:       '1px solid rgba(34,197,94,0.2)',
              fontSize:     '10px',
              color:        '#22c55e',
              lineHeight:   1.4,
            }}
          >
            {step.result}
          </div>
        )}
      </div>
    </motion.div>
  )
}
