import { useEffect, useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from './stores/app-store'
import { ipc } from './lib/ipc'
import AppShell from './components/layout/AppShell'
import OnboardingFlow from './components/onboarding/OnboardingFlow'

export default function App() {
  const {
    onboardingComplete,
    setOnboardingComplete,
    setApiKeySet,
    setCanvasConnected,
    setIsInstructor,
  } = useAppStore()

  const [initializing, setInitializing] = useState(true)

  // Secret: Ctrl+Shift+T toggles Teacher Mode access
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        const current = useAppStore.getState().isInstructor
        setIsInstructor(!current)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setIsInstructor])

  // Sync persisted state with actual main-process state on mount
  useEffect(() => {
    async function init() {
      try {
        const [complete, hasKey, hasCanvas] = await Promise.all([
          ipc.getOnboardingComplete(),
          ipc.hasApiKey(),
          ipc.hasCanvasToken(),
        ])
        setOnboardingComplete(complete)
        setApiKeySet(hasKey)
        setCanvasConnected(hasCanvas)
        // Check instructor role if Canvas is connected (unlocks Teacher Mode)
        if (hasCanvas) {
          ipc.checkCanvasIsInstructor().then(setIsInstructor).catch(() => {})
        }
      } catch {
        // IPC not available in test environments — keep store defaults
      } finally {
        setInitializing(false)
      }
    }
    init()
  }, [setOnboardingComplete, setApiKeySet, setCanvasConnected, setIsInstructor])

  if (initializing) {
    return (
      <div
        className="flex items-center justify-center h-full"
        style={{ background: '#0a0f0d' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center gap-4"
        >
          {/* UO "O" Logo */}
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black"
            style={{
              background: 'linear-gradient(135deg, #154733, #006747)',
              color:      '#FEE123',
              boxShadow:  '0 0 40px rgba(0, 103, 71, 0.5)',
            }}
          >
            O
          </div>
          <div
            className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: '#154733', borderTopColor: '#FEE123' }}
          />
        </motion.div>
      </div>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {!onboardingComplete ? (
        <motion.div
          key="onboarding"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <OnboardingFlow />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <AppShell />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
