import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ViewId } from '../lib/constants'

interface AppState {
  // ── Navigation ────────────────────────────────────────────────────────
  currentView: ViewId
  setCurrentView: (view: ViewId) => void

  // ── Sidebar ───────────────────────────────────────────────────────────
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void

  // ── Onboarding ────────────────────────────────────────────────────────
  onboardingComplete: boolean
  setOnboardingComplete: (complete: boolean) => void

  // ── Auth & Connections ────────────────────────────────────────────────
  apiKeySet: boolean
  setApiKeySet: (set: boolean) => void

  canvasConnected: boolean
  setCanvasConnected: (connected: boolean) => void

  // ── Role Detection ────────────────────────────────────────────────────
  isInstructor: boolean
  setIsInstructor: (instructor: boolean) => void

  // ── Global Error ──────────────────────────────────────────────────────
  globalError: string | null
  setGlobalError: (error: string | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // Navigation
      currentView:    'chat',
      setCurrentView: (view) => set({ currentView: view }),

      // Sidebar
      sidebarCollapsed:    false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar:       () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      // Onboarding
      onboardingComplete:    false,
      setOnboardingComplete: (complete) => set({ onboardingComplete: complete }),

      // Auth
      apiKeySet:    false,
      setApiKeySet: (set_) => set({ apiKeySet: set_ }),

      canvasConnected:    false,
      setCanvasConnected: (connected) => set({ canvasConnected: connected }),

      // Role detection
      isInstructor:    false,
      setIsInstructor: (instructor) => set({ isInstructor: instructor }),

      // Global error
      globalError:    null,
      setGlobalError: (error) => set({ globalError: error }),
    }),
    {
      name:    'plume-app',
      partialize: (s) => ({
        currentView:       s.currentView,
        sidebarCollapsed:  s.sidebarCollapsed,
        onboardingComplete:s.onboardingComplete,
        apiKeySet:         s.apiKeySet,
        canvasConnected:   s.canvasConnected,
        isInstructor:      s.isInstructor,
      }),
    }
  )
)
