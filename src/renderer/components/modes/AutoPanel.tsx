import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Play, Square, CheckCircle, FileText, Loader2,
  Circle, AlertTriangle
} from 'lucide-react'
import type { AutoState, AutoStep } from '../../types/agent'

interface AutoPanelProps {
  autoState:     AutoState
  onStartBuilding: () => void
  onInterrupt:   (text: string) => void
  onCancel:      () => void
}

export default function AutoPanel({
  autoState,
  onStartBuilding,
  onInterrupt,
  onCancel,
}: AutoPanelProps) {
  const { phase, plan, planTitle, progress } = autoState
  const isBuilding = phase === 'executing'
  const isDone     = phase === 'done'
  const isSpec     = phase === 'spec' || phase === 'planning'

  return (
    <div
      style={{
        display:       'flex',
        flexDirection: 'column',
        height:        '100%',
        background:    '#0c1510',
      }}
    >
      {/* Header */}
      <div
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          '10px',
          padding:      '12px 16px',
          borderBottom: '1px solid #1a2420',
          flexShrink:   0,
          background:   'linear-gradient(135deg, #0e1f17 0%, #0c1510 100%)',
        }}
      >
        <div
          style={{
            width:        '28px',
            height:       '28px',
            borderRadius: '6px',
            background:   'linear-gradient(135deg, #154733, #006747)',
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
            flexShrink:   0,
          }}
        >
          {isBuilding ? (
            <Loader2 size={14} style={{ color: '#FEE123', animation: 'spin 1s linear infinite' }} />
          ) : isDone ? (
            <CheckCircle size={14} style={{ color: '#22c55e' }} />
          ) : (
            <FileText size={14} style={{ color: '#FEE123' }} />
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#e8ede9' }}>
            {isBuilding ? 'Building...' : isDone ? 'Build Complete' : 'Master Plan'}
          </div>
          <div style={{ fontSize: '10px', color: '#5a6b60', marginTop: '1px' }}>
            {isBuilding
              ? `Step ${autoState.currentStepIndex + 1} of ${plan.length}`
              : isDone
                ? 'All steps completed'
                : 'Chat on the left to refine — click Start Building when ready'}
          </div>
        </div>

        {/* Action buttons */}
        {isSpec && (
          <button
            onClick={onStartBuilding}
            disabled={plan.length === 0}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '6px',
              padding:      '7px 14px',
              background:   plan.length > 0 ? '#FEE123' : '#1a2420',
              border:       'none',
              borderRadius: '8px',
              cursor:       plan.length > 0 ? 'pointer' : 'not-allowed',
              fontSize:     '12px',
              fontWeight:   700,
              color:        plan.length > 0 ? '#0a0f0d' : '#3a4a40',
              transition:   'all 0.15s ease',
            }}
          >
            <Play size={12} />
            Start Building
          </button>
        )}

        {isBuilding && (
          <button
            onClick={onCancel}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '5px',
              padding:      '6px 10px',
              background:   'rgba(239,68,68,0.1)',
              border:       '1px solid rgba(239,68,68,0.3)',
              borderRadius: '6px',
              cursor:       'pointer',
              fontSize:     '11px',
              fontWeight:   600,
              color:        '#fca5a5',
            }}
          >
            <Square size={10} />
            Stop
          </button>
        )}
      </div>

      {/* Progress bar (building/done) */}
      <AnimatePresence>
        {(isBuilding || isDone) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ padding: '0 16px', flexShrink: 0 }}
          >
            <div
              style={{
                height:       '3px',
                background:   '#1a2420',
                borderRadius: '2px',
                overflow:     'hidden',
                marginTop:    '8px',
              }}
            >
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.5 }}
                style={{
                  height:     '100%',
                  background: isDone
                    ? '#22c55e'
                    : 'linear-gradient(90deg, #006747, #FEE123)',
                  borderRadius: '2px',
                }}
              />
            </div>
            <div
              style={{
                display:        'flex',
                justifyContent: 'flex-end',
                marginTop:      '4px',
                fontSize:       '10px',
                fontWeight:     700,
                color:          isDone ? '#22c55e' : '#FEE123',
              }}
            >
              {progress}%
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plan content area */}
      <div
        style={{
          flex:       1,
          overflowY:  'auto',
          padding:    '16px',
        }}
      >
        {/* Spec phase: live PRD document */}
        {isSpec && (
          <MasterPlanDocument plan={plan} planTitle={planTitle} />
        )}

        {/* Building/done phase: step list with progress */}
        {(isBuilding || isDone) && (
          <StepExecutionList
            steps={plan}
            currentStepIndex={autoState.currentStepIndex}
          />
        )}
      </div>

      {/* Done banner */}
      <AnimatePresence>
        {isDone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              margin:       '0 16px 16px',
              display:      'flex',
              alignItems:   'center',
              gap:          '10px',
              padding:      '12px 14px',
              background:   'rgba(34,197,94,0.08)',
              border:       '1px solid rgba(34,197,94,0.25)',
              borderRadius: '8px',
              flexShrink:   0,
            }}
          >
            <CheckCircle size={16} style={{ color: '#22c55e', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#e8ede9' }}>
                Build complete
              </div>
              <div style={{ fontSize: '10px', color: '#5a6b60', marginTop: '2px' }}>
                All steps finished successfully. Review the output in chat.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Master Plan Document (Spec Phase) ─────────────────────────────────────

function MasterPlanDocument({
  plan,
  planTitle,
}: {
  plan: AutoStep[]
  planTitle: string
}) {
  if (plan.length === 0) {
    return (
      <div
        style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          justifyContent:'center',
          height:        '100%',
          gap:           '12px',
          padding:       '40px 20px',
        }}
      >
        <FileText size={40} style={{ color: '#2a3a32' }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#5a6b60', margin: '0 0 6px' }}>
            No plan yet
          </p>
          <p style={{ fontSize: '12px', color: '#3a4a40', margin: 0, maxWidth: '280px' }}>
            Start chatting on the left. As you describe your project, Plume will
            build a Master Plan here with requirements and steps.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Plan title */}
      <div>
        <div
          style={{
            fontSize:      '10px',
            fontWeight:    700,
            color:         '#FEE123',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom:  '6px',
          }}
        >
          Master Plan
        </div>
        <h2
          style={{
            margin:   0,
            fontSize: '18px',
            fontWeight: 700,
            color:    '#e8ede9',
          }}
        >
          {planTitle || 'Untitled Project'}
        </h2>
      </div>

      {/* Steps as PRD sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {plan.map((step, i) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display:      'flex',
              gap:          '10px',
              padding:      '10px 12px',
              background:   '#111916',
              border:       '1px solid #1a2420',
              borderRadius: '8px',
            }}
          >
            <span
              style={{
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                width:          '22px',
                height:         '22px',
                borderRadius:   '6px',
                background:     '#154733',
                color:          '#FEE123',
                fontSize:       '10px',
                fontWeight:     700,
                flexShrink:     0,
              }}
            >
              {i + 1}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#e8ede9' }}>
                {step.title}
              </div>
              {step.description && (
                <div style={{ fontSize: '11px', color: '#5a6b60', marginTop: '3px', lineHeight: 1.4 }}>
                  {step.description}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Hint */}
      <div
        style={{
          fontSize:   '11px',
          color:      '#3a4a40',
          textAlign:  'center',
          padding:    '8px 0',
          fontStyle:  'italic',
        }}
      >
        Keep chatting to refine the plan. Click "Start Building" when ready.
      </div>
    </div>
  )
}

// ── Step Execution List (Building Phase) ──────────────────────────────────

function StepExecutionList({
  steps,
  currentStepIndex,
}: {
  steps: AutoStep[]
  currentStepIndex: number
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {steps.map((step, i) => {
        const isActive   = i === currentStepIndex
        const isDone     = step.status === 'done'
        const isError    = step.status === 'error'
        const isPending  = step.status === 'pending'

        return (
          <motion.div
            key={step.id}
            layout
            style={{
              display:      'flex',
              gap:          '10px',
              padding:      isActive ? '12px' : '8px 12px',
              background:   isActive
                ? 'rgba(0,103,71,0.1)'
                : isDone
                  ? 'rgba(34,197,94,0.04)'
                  : '#111916',
              border:       isActive
                ? '1px solid rgba(0,103,71,0.3)'
                : '1px solid #1a2420',
              borderRadius: '8px',
              transition:   'all 0.2s ease',
            }}
          >
            {/* Status icon */}
            <div style={{ flexShrink: 0, marginTop: '2px' }}>
              {isDone && <CheckCircle size={16} style={{ color: '#22c55e' }} />}
              {isActive && (
                <Loader2
                  size={16}
                  style={{ color: '#FEE123', animation: 'spin 1s linear infinite' }}
                />
              )}
              {isError && <AlertTriangle size={16} style={{ color: '#ef4444' }} />}
              {isPending && <Circle size={16} style={{ color: '#2a3a32' }} />}
            </div>

            {/* Content */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize:   '13px',
                  fontWeight: isActive ? 700 : isDone ? 500 : 400,
                  color:      isDone
                    ? '#8a9b90'
                    : isActive
                      ? '#e8ede9'
                      : isPending
                        ? '#5a6b60'
                        : '#e8ede9',
                  textDecoration: isDone ? 'none' : 'none',
                }}
              >
                {step.title}
              </div>

              {/* Show description when active */}
              <AnimatePresence>
                {isActive && step.description && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{
                      fontSize:   '11px',
                      color:      '#8a9b90',
                      marginTop:  '4px',
                      lineHeight: 1.4,
                    }}
                  >
                    {step.description}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Show result when done */}
              {isDone && step.result && (
                <div
                  style={{
                    fontSize:   '10px',
                    color:      '#5a6b60',
                    marginTop:  '3px',
                  }}
                >
                  {step.result}
                </div>
              )}

              {/* Show error */}
              {isError && step.result && (
                <div
                  style={{
                    fontSize:   '10px',
                    color:      '#fca5a5',
                    marginTop:  '3px',
                  }}
                >
                  {step.result}
                </div>
              )}
            </div>

            {/* Step number */}
            <span
              style={{
                fontSize:   '10px',
                fontWeight: 600,
                color:      '#3a4a40',
                flexShrink: 0,
              }}
            >
              {i + 1}/{steps.length}
            </span>
          </motion.div>
        )
      })}
    </div>
  )
}
