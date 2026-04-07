import { Check, ListChecks, Cpu, Scale, ClipboardList, Send } from 'lucide-react'
import type { GradingStep } from '../../types/grading'

const STEPS: Array<{ id: GradingStep; label: string; Icon: React.ElementType }> = [
  { id: 'assignment-select', label: 'Select',    Icon: ListChecks    },
  { id: 'provisional',       label: 'Score',     Icon: Cpu           },
  { id: 'calibration',       label: 'Calibrate', Icon: Scale         },
  { id: 'review',            label: 'Review',    Icon: ClipboardList },
  { id: 'publish',           label: 'Publish',   Icon: Send          },
]

// Recalibration is an internal step shown as part of Calibrate
const STEP_ORDER: GradingStep[] = ['assignment-select', 'provisional', 'calibration', 'recalibration', 'review', 'publish']

function stepIndex(step: GradingStep): number {
  // Map recalibration to calibration's index for display
  if (step === 'recalibration') return 2
  return STEPS.findIndex((s) => s.id === step)
}

interface StepIndicatorProps {
  currentStep: GradingStep
}

export default function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIdx = stepIndex(currentStep)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '12px 0' }}>
      {STEPS.map((step, i) => {
        const isPast    = i < currentIdx
        const isCurrent = i === currentIdx
        const isFuture  = i > currentIdx
        const StepIcon  = step.Icon

        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {/* Step pill */}
            <div
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '6px',
                padding:      '6px 12px',
                borderRadius: '8px',
                background:   isCurrent ? 'rgba(254, 225, 35, 0.12)' : isPast ? 'rgba(34, 197, 94, 0.08)' : '#111916',
                border:       `1px solid ${isCurrent ? 'rgba(254, 225, 35, 0.3)' : isPast ? 'rgba(34, 197, 94, 0.2)' : '#2a3a32'}`,
                transition:   'all 0.2s ease',
              }}
            >
              {isPast ? (
                <Check size={13} style={{ color: '#22c55e' }} />
              ) : (
                <StepIcon size={13} style={{ color: isCurrent ? '#FEE123' : '#5a6b60' }} />
              )}
              <span
                style={{
                  fontSize:   '12px',
                  fontWeight: isCurrent ? 600 : 400,
                  color:      isCurrent ? '#FEE123' : isPast ? '#22c55e' : '#5a6b60',
                }}
              >
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div
                style={{
                  width:      '16px',
                  height:     '1px',
                  background: isPast ? '#22c55e' : '#2a3a32',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
