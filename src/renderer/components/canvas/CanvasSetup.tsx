import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react'
import { ipc } from '../../lib/ipc'
import { useAppStore } from '../../stores/app-store'
import { useCanvasStore } from '../../stores/canvas-store'

type SetupStep = 1 | 2 | 3

const STEPS = [
  { label: 'Instructions' },
  { label: 'Connect'      },
  { label: 'Done'         },
]

interface CanvasSetupProps {
  onComplete?: () => void
}

export default function CanvasSetup({ onComplete }: CanvasSetupProps) {
  const [step,    setStep]    = useState<SetupStep>(1)
  const [token,   setToken]   = useState('')
  const [testing, setTesting] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [courses, setCourses] = useState<{ id: number; name: string; code: string }[]>([])

  const setCanvasConnected = useAppStore((s) => s.setCanvasConnected)
  const setIsInstructor    = useAppStore((s) => s.setIsInstructor)
  const fetchCourses       = useCanvasStore((s) => s.fetchCourses)

  async function handleTest() {
    const trimmed = token.trim()
    if (!trimmed) {
      setError('Please paste your Canvas access token.')
      return
    }
    setTesting(true)
    setError(null)
    try {
      const result = await ipc.testCanvasConnection(trimmed)
      if (!result.success) {
        setError(result.error ?? 'Connection failed. Check your token and try again.')
        return
      }
      await ipc.setCanvasToken(trimmed)
      await fetchCourses()
      const loaded = await ipc.getCanvasCourses()
      setCourses(loaded)
      setCanvasConnected(true)
      // Check if user has instructor/TA enrollments to unlock Teacher Mode
      ipc.checkCanvasIsInstructor().then(setIsInstructor).catch(() => {})
      setStep(3)
      onComplete?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An unexpected error occurred.')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div
      className="flex-1 flex items-center justify-center"
      style={{ background: '#0a0f0d', padding: '40px 20px' }}
    >
      <div
        style={{
          width:        '480px',
          maxWidth:     '95vw',
          background:   '#111916',
          border:       '1px solid #2a3a32',
          borderRadius: '16px',
          overflow:     'hidden',
        }}
      >
        {/* Step indicators */}
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            padding:      '16px 20px',
            borderBottom: '1px solid #1a2420',
            gap:          '0',
          }}
        >
          {STEPS.map((s, i) => {
            const num       = (i + 1) as SetupStep
            const isActive  = step === num
            const isDone    = step > num

            return (
              <div key={i} className="flex items-center" style={{ flex: i < STEPS.length - 1 ? 1 : 'none' }}>
                <div className="flex items-center gap-2">
                  <div
                    style={{
                      width:        '24px',
                      height:       '24px',
                      borderRadius: '50%',
                      display:      'flex',
                      alignItems:   'center',
                      justifyContent:'center',
                      fontSize:     '11px',
                      fontWeight:   700,
                      background:   isDone ? '#006747' : isActive ? 'rgba(0,103,71,0.3)' : '#1a2420',
                      border:       `1px solid ${isDone ? '#006747' : isActive ? '#006747' : '#2a3a32'}`,
                      color:        isDone ? '#FEE123' : isActive ? '#FEE123' : '#5a6b60',
                      transition:   'all 0.3s ease',
                      flexShrink:   0,
                    }}
                  >
                    {isDone ? <CheckCircle2 size={12} /> : num}
                  </div>
                  <span
                    style={{
                      fontSize: '12px',
                      color:    isActive ? '#e8ede9' : '#5a6b60',
                      fontWeight:isActive ? 600 : 400,
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      flex:        1,
                      height:      '1px',
                      background:  isDone ? '#006747' : '#1a2420',
                      margin:      '0 10px',
                      transition:  'background 0.3s ease',
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step content */}
        <div style={{ padding: '24px' }}>
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  style={{
                    fontSize:    '32px',
                    marginBottom:'12px',
                    textAlign:   'center',
                  }}
                >
                  🎓
                </div>
                <h2
                  style={{
                    fontSize:    '16px',
                    fontWeight:  700,
                    color:       '#e8ede9',
                    marginBottom:'8px',
                    textAlign:   'center',
                  }}
                >
                  Connect Canvas
                </h2>
                <p
                  style={{
                    fontSize:   '13px',
                    color:      '#8a9b90',
                    lineHeight: 1.6,
                    marginBottom:'16px',
                    textAlign:  'center',
                  }}
                >
                  Connect your Canvas account to see assignments, due dates, and
                  rubrics directly inside Plume.
                </p>

                <div
                  style={{
                    background:   '#0c1510',
                    border:       '1px solid #2a3a32',
                    borderRadius: '10px',
                    padding:      '14px',
                    marginBottom: '16px',
                  }}
                >
                  <p
                    style={{
                      fontSize:   '12px',
                      fontWeight: 600,
                      color:      '#e8ede9',
                      marginBottom:'8px',
                    }}
                  >
                    How to get your access token:
                  </p>
                  <ol
                    style={{
                      paddingLeft:'16px',
                      fontSize:   '12px',
                      color:      '#8a9b90',
                      lineHeight: 1.8,
                    }}
                  >
                    <li>Log in to Canvas at canvas.uoregon.edu</li>
                    <li>Go to Account → Settings</li>
                    <li>Scroll to "Approved Integrations"</li>
                    <li>Click "+ New Access Token"</li>
                    <li>Name it "Plume" and generate</li>
                  </ol>
                </div>

                <a
                  href="https://canvas.uoregon.edu/profile/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display:        'flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    gap:            '6px',
                    padding:        '8px',
                    borderRadius:   '8px',
                    border:         '1px solid #2a3a32',
                    background:     'transparent',
                    color:          '#8a9b90',
                    fontSize:       '12px',
                    textDecoration: 'none',
                    marginBottom:   '16px',
                    transition:     'all 0.15s ease',
                  }}
                >
                  <ExternalLink size={12} />
                  Open Canvas Settings
                </a>

                <button
                  onClick={() => setStep(2)}
                  style={{
                    width:        '100%',
                    padding:      '10px',
                    borderRadius: '8px',
                    border:       '1px solid #006747',
                    background:   'rgba(0,103,71,0.15)',
                    color:        '#FEE123',
                    fontWeight:   600,
                    fontSize:     '13px',
                    cursor:       'pointer',
                    transition:   'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,103,71,0.3)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(0,103,71,0.15)' }}
                >
                  I have my token →
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.2 }}
              >
                <h2
                  style={{
                    fontSize:    '15px',
                    fontWeight:  700,
                    color:       '#e8ede9',
                    marginBottom:'6px',
                  }}
                >
                  Paste your access token
                </h2>
                <p style={{ fontSize: '12px', color: '#5a6b60', marginBottom: '14px' }}>
                  Your token is stored locally and never sent to any server except canvas.uoregon.edu.
                </p>

                <textarea
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Paste your Canvas access token here…"
                  rows={3}
                  className="selectable"
                  style={{
                    width:        '100%',
                    background:   '#0c1510',
                    border:       '1px solid #2a3a32',
                    borderRadius: '8px',
                    padding:      '10px 12px',
                    color:        '#e8ede9',
                    fontSize:     '13px',
                    fontFamily:   "'JetBrains Mono', monospace",
                    resize:       'none',
                    outline:      'none',
                    marginBottom: '10px',
                    transition:   'border-color 0.2s ease',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#006747' }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = '#2a3a32' }}
                />

                {error && (
                  <div
                    style={{
                      display:      'flex',
                      alignItems:   'flex-start',
                      gap:          '6px',
                      padding:      '8px 10px',
                      borderRadius: '6px',
                      background:   'rgba(239,68,68,0.1)',
                      border:       '1px solid rgba(239,68,68,0.25)',
                      color:        '#ef4444',
                      fontSize:     '12px',
                      marginBottom: '10px',
                    }}
                  >
                    <AlertCircle size={13} style={{ flexShrink: 0, marginTop: '1px' }} />
                    {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setStep(1)}
                    style={{
                      padding:    '10px 16px',
                      borderRadius:'8px',
                      border:     '1px solid #2a3a32',
                      background: 'transparent',
                      color:      '#5a6b60',
                      fontSize:   '13px',
                      cursor:     'pointer',
                    }}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleTest}
                    disabled={testing || !token.trim()}
                    style={{
                      flex:       1,
                      padding:    '10px',
                      borderRadius:'8px',
                      border:     '1px solid #006747',
                      background: testing ? 'rgba(0,103,71,0.1)' : 'rgba(0,103,71,0.2)',
                      color:      testing ? '#5a6b60' : '#FEE123',
                      fontWeight: 600,
                      fontSize:   '13px',
                      cursor:     testing ? 'not-allowed' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {testing ? 'Testing connection…' : 'Test Connection'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                className="text-center"
              >
                <div
                  style={{
                    fontSize:     '40px',
                    marginBottom: '12px',
                    filter:       'drop-shadow(0 0 20px rgba(254,225,35,0.4))',
                  }}
                >
                  ✓
                </div>
                <h2
                  style={{
                    fontSize:    '16px',
                    fontWeight:  700,
                    color:       '#e8ede9',
                    marginBottom:'6px',
                  }}
                >
                  Canvas connected!
                </h2>
                <p style={{ fontSize: '13px', color: '#8a9b90', marginBottom: '16px' }}>
                  Found {courses.length} course{courses.length !== 1 ? 's' : ''}.
                </p>
                {courses.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding:      '6px 10px',
                      borderRadius: '6px',
                      background:   '#0c1510',
                      border:       '1px solid #1a2420',
                      fontSize:     '12px',
                      color:        '#8a9b90',
                      marginBottom: '4px',
                      textAlign:    'left',
                    }}
                  >
                    {c.name}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
