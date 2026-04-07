import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '../../stores/app-store'
import TitleBar from './TitleBar'
import Sidebar from './Sidebar'
import WorkspaceGrid from '../workspace/WorkspaceGrid'
import CanvasSetup from '../canvas/CanvasSetup'
import CanvasDashboard from '../canvas/CanvasDashboard'
import MyLibrary from '../skills/MyLibrary'
import MarketPlace from '../skills/MarketPlace'
import StyleWizard from '../writing-style/StyleWizard'
import VaultPage from '../vault/VaultPage'
import SettingsPage from '../settings/SettingsPage'
import TeacherMode from '../teacher/TeacherMode'
import { useCanvasStore } from '../../stores/canvas-store'

const contentVariants = {
  initial: { opacity: 0, x: 8 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -8 },
}

export default function AppShell() {
  const { currentView, canvasConnected } = useAppStore()

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: '#0a0f0d' }}
    >
      <TitleBar />

      <div className="flex flex-1 min-h-0">
        <Sidebar />

        <main className="flex-1 flex flex-col min-w-0 min-h-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              variants={contentVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.18, ease: 'easeInOut' }}
              className="flex-1 flex flex-col min-h-0"
            >
              {currentView === 'chat'        && <WorkspaceGrid />}
              {currentView === 'canvas'      && <CanvasView connected={canvasConnected} />}
              {currentView === 'teacher'     && <TeacherMode />}
              {currentView === 'library'     && <MyLibrary />}
              {currentView === 'marketplace' && <MarketPlace />}
              {currentView === 'style'       && <StyleWizard />}
              {currentView === 'vault'       && <VaultPage />}
              {currentView === 'settings'    && <SettingsPage />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}

function CanvasView({ connected }: { connected: boolean }) {
  const { courses, coursesLoading, fetchCourses } = useCanvasStore()

  // Auto-fetch courses when connected but none loaded
  if (connected && courses.length === 0 && !coursesLoading) {
    fetchCourses()
  }

  if (!connected) {
    return <CanvasSetup />
  }

  // Show loading while fetching courses
  if (coursesLoading && courses.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div
          className="w-8 h-8 border-2 rounded-full animate-spin"
          style={{ borderColor: '#154733', borderTopColor: '#FEE123' }}
        />
      </div>
    )
  }

  if (courses.length === 0) {
    return <CanvasSetup />
  }

  return <CanvasDashboard />
}

