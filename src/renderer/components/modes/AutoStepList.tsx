import { motion, AnimatePresence } from 'framer-motion'
import { Circle, CheckCircle, XCircle, Loader2, Wrench } from 'lucide-react'
import type { AutoStep } from '../../types/agent'

interface AutoStepListProps {
  steps:            AutoStep[]
  currentStepIndex: number
}

export default function AutoStepList({ steps, currentStepIndex }: AutoStepListProps) {
  if (steps.length === 0) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
      {steps.map((step, i) => (
        <StepRow
          key={step.id}
          step={step}
          index={i}
          isLast={i === steps.length - 1}
        />
      ))}
    </div>
  )
}

function StepRow({
  step,
  index,
  isLast,
}: {
  step:   AutoStep
  index:  number
  isLast: boolean
}) {
  const isActive  = step.status === 'active'
  const isDone    = step.status === 'done'
  const isError   = step.status === 'error'
  const isPending = step.status === 'pending'

  const lineColor = isDone
    ? '#22c55e'
    : isError
    ? '#ef4444'
    : isActive
    ? '#006747'
    : '#2a3a32'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      style={{ display: 'flex', gap: '10px' }}
    >
      {/* Left: index badge + connector line */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <StatusIcon step={step} />
        {!isLast && (
          <div
            style={{
              width:    '1px',
              flex:     1,
              minHeight:'12px',
              background: lineColor,
              marginTop: '3px',
              opacity:   isDone ? 0.6 : 0.3,
              transition:'background 0.3s ease',
            }}
          />
        )}
      </div>

      {/* Right: content */}
      <div
        style={{
          flex:          1,
          paddingBottom: isLast ? 0 : '8px',
        }}
      >
        {/* Title row */}
        <div
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '8px',
            minHeight:  '22px',
          }}
        >
          <span
            style={{
              fontSize:   '12px',
              fontWeight: isActive ? 600 : 500,
              color:      isDone
                ? '#22c55e'
                : isError
                ? '#fca5a5'
                : isActive
                ? '#e8ede9'
                : '#5a6b60',
              transition: 'color 0.2s ease',
            }}
          >
            {step.title}
          </span>

          {isActive && (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              style={{
                fontSize:  '10px',
                color:     '#006747',
                fontWeight:600,
              }}
            >
              Running
            </motion.span>
          )}
        </div>

        {/* Active sub-detail */}
        <AnimatePresence>
          {isActive && step.description && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <p
                style={{
                  margin:     '3px 0 0',
                  fontSize:   '10px',
                  color:      '#5a6b60',
                  lineHeight: 1.5,
                }}
              >
                {step.description}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result on done */}
        {isDone && step.result && (
          <p
            style={{
              margin:    '2px 0 0',
              fontSize:  '10px',
              color:     '#3a4a40',
              lineHeight: 1.4,
            }}
          >
            {step.result.length > 100 ? `${step.result.slice(0, 100)}…` : step.result}
          </p>
        )}

        {/* Error on error */}
        {isError && (
          <p
            style={{
              margin:    '2px 0 0',
              fontSize:  '10px',
              color:     '#fca5a5',
              lineHeight: 1.4,
            }}
          >
            Step failed
          </p>
        )}
      </div>
    </motion.div>
  )
}

function StatusIcon({ step }: { step: AutoStep }) {
  const size = 16

  if (step.status === 'done') {
    return <CheckCircle size={size} style={{ color: '#22c55e' }} />
  }
  if (step.status === 'error') {
    return <XCircle size={size} style={{ color: '#ef4444' }} />
  }
  if (step.status === 'active') {
    return (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        style={{ display: 'flex' }}
      >
        <Loader2 size={size} style={{ color: '#006747' }} />
      </motion.div>
    )
  }
  return <Circle size={size} style={{ color: '#2a3a32' }} />
}
