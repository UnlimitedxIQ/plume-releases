import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ipc } from '../../lib/ipc'
import { useAppStore } from '../../stores/app-store'
import ApiKeyStep from './ApiKeyStep'
import CanvasStep from './CanvasStep'
import StyleStep from './StyleStep'

type OnboardingStep = 'welcome' | 'apikey' | 'canvas' | 'style' | 'complete'

const STEPS: { id: OnboardingStep; label: string }[] = [
  { id: 'welcome', label: 'Welcome'     },
  { id: 'apikey',  label: 'API Key'     },
  { id: 'canvas',  label: 'Canvas'      },
  { id: 'style',   label: 'Your Style'  },
]

export default function OnboardingFlow() {
  const [step, setStep] = useState<OnboardingStep>('welcome')
  const { setOnboardingComplete, setApiKeySet, setCanvasConnected, setIsInstructor } = useAppStore()

  const stepIndex = STEPS.findIndex((s) => s.id === step)

  async function handleComplete() {
    await ipc.setOnboardingComplete()
    setOnboardingComplete(true)
  }

  const slideVariants = {
    enter:  { opacity: 0, x: 32  },
    center: { opacity: 1, x: 0   },
    exit:   { opacity: 0, x: -32 },
  }

  return (
    <div
      className="flex flex-col items-center justify-center h-full"
      style={{
        background: 'linear-gradient(160deg, #0a0f0d 0%, #0f1e16 50%, #0a0f0d 100%)',
        padding:    '24px',
      }}
    >
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.34, 1.3, 0.64, 1] }}
        style={{
          width:        '520px',
          maxWidth:     '100%',
          background:   '#111916',
          border:       '1px solid #2a3a32',
          borderRadius: '20px',
          overflow:     'hidden',
          boxShadow:    '0 32px 80px rgba(0,0,0,0.7)',
        }}
      >
        {/* Step dots */}
        {step !== 'welcome' && step !== 'complete' && (
          <div
            style={{
              display:        'flex',
              justifyContent: 'center',
              gap:            '6px',
              padding:        '16px 20px 0',
            }}
          >
            {STEPS.slice(1).map((s) => {
              const idx    = STEPS.findIndex((x) => x.id === s.id)
              const isDone = idx < stepIndex
              const active = idx === stepIndex
              return (
                <motion.div
                  key={s.id}
                  animate={{
                    width:     active ? 24 : 8,
                    background:isDone ? '#006747' : active ? '#FEE123' : '#2a3a32',
                  }}
                  transition={{ duration: 0.3 }}
                  style={{
                    height:       '6px',
                    borderRadius: '3px',
                  }}
                />
              )
            })}
          </div>
        )}

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.22 }}
          >
            {step === 'welcome' && (
              <WelcomeStep onNext={() => setStep('apikey')} />
            )}
            {step === 'apikey' && (
              <ApiKeyStep
                onNext={() => { setApiKeySet(true); setStep('canvas') }}
                onSkip={() => setStep('canvas')}
              />
            )}
            {step === 'canvas' && (
              <CanvasStep
                onNext={() => {
                  setCanvasConnected(true)
                  ipc.checkCanvasIsInstructor().then(setIsInstructor).catch(() => {})
                  setStep('style')
                }}
                onSkip={() => setStep('style')}
              />
            )}
            {step === 'style' && (
              <StyleStep
                onNext={() => setStep('complete')}
                onSkip={() => setStep('complete')}
              />
            )}
            {step === 'complete' && (
              <CompleteStep onDone={handleComplete} />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ── Welcome ───────────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ padding: '40px 32px', textAlign: 'center' }}>
      <div
        style={{
          width:        '72px',
          height:       '72px',
          borderRadius: '50%',
          background:   'linear-gradient(135deg, #154733, #006747)',
          display:      'flex',
          alignItems:   'center',
          justifyContent:'center',
          fontSize:     '28px',
          fontWeight:   900,
          color:        '#FEE123',
          margin:       '0 auto 20px',
          boxShadow:    '0 0 40px rgba(0,103,71,0.5)',
        }}
      >
        O
      </div>

      <h1
        style={{
          fontSize:    '26px',
          fontWeight:  800,
          color:       '#e8ede9',
          marginBottom:'10px',
          letterSpacing:'-0.02em',
        }}
      >
        Welcome to Plume
      </h1>
      <p
        style={{
          fontSize:   '14px',
          color:      '#8a9b90',
          lineHeight: 1.7,
          marginBottom:'28px',
        }}
      >
        Your AI study companion, built for University of Oregon students.
        Get help with assignments, research, coding, and more — right on your desktop.
      </p>

      <button
        onClick={onNext}
        style={{
          width:        '100%',
          padding:      '13px',
          borderRadius: '10px',
          border:       'none',
          background:   'linear-gradient(135deg, #154733, #006747)',
          color:        '#FEE123',
          fontWeight:   700,
          fontSize:     '15px',
          cursor:       'pointer',
          boxShadow:    '0 4px 20px rgba(0,103,71,0.4)',
          transition:   'all 0.2s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,103,71,0.6)' }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,103,71,0.4)' }}
      >
        Get Started →
      </button>
    </div>
  )
}

// ── Complete ──────────────────────────────────────────────────────────────

function CompleteStep({ onDone }: { onDone: () => void }) {
  return (
    <div style={{ padding: '40px 32px', textAlign: 'center' }}>
      <div style={{ fontSize: '56px', marginBottom: '16px' }}>🦆</div>
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#e8ede9', marginBottom: '8px' }}>
        You're all set!
      </h2>
      <p style={{ fontSize: '14px', color: '#8a9b90', lineHeight: 1.7, marginBottom: '28px' }}>
        Plume is ready to help. Start a new session from the workspace,
        or explore your Canvas assignments.
      </p>
      <button
        onClick={onDone}
        style={{
          width:        '100%',
          padding:      '13px',
          borderRadius: '10px',
          border:       'none',
          background:   'linear-gradient(135deg, #154733, #006747)',
          color:        '#FEE123',
          fontWeight:   700,
          fontSize:     '15px',
          cursor:       'pointer',
          boxShadow:    '0 4px 20px rgba(0,103,71,0.4)',
        }}
      >
        Open Plume
      </button>
    </div>
  )
}
