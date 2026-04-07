import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Tab, GridLayout } from '../types/project'
import type { ProjectTypeId } from '../lib/constants'
import { createTab } from '../types/project'

interface ProjectState {
  // ── Tabs ──────────────────────────────────────────────────────────────
  tabs:        Tab[]
  activeTabId: string | null

  // ── Grid ──────────────────────────────────────────────────────────────
  gridLayout: GridLayout

  // ── Tab Actions ───────────────────────────────────────────────────────
  addTab:       (projectType: ProjectTypeId, name?: string) => string
  removeTab:    (tabId: string) => void
  parkTab:      (tabId: string) => void
  unparkTab:    (tabId: string) => void
  deleteTab:    (tabId: string) => void
  setActiveTab: (tabId: string) => void
  updateTab:    (tabId: string, patch: Partial<Pick<Tab, 'name' | 'enabledSkillIds' | 'systemPromptOverride'>>) => void

  // ── Skill Toggle Actions ───────────────────────────────────────────────
  enableSkill:  (tabId: string, skillId: string) => void
  disableSkill: (tabId: string, skillId: string) => void
  toggleSkill:  (tabId: string, skillId: string) => void

  // ── Grid Actions ──────────────────────────────────────────────────────
  setGridLayout: (layout: GridLayout) => void

  // ── Selectors ─────────────────────────────────────────────────────────
  activeTab:     () => Tab | undefined
  getTab:        (tabId: string) => Tab | undefined
  getOpenTabs:   () => Tab[]
  getParkedTabs: () => Tab[]
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      tabs:        [],
      activeTabId: null,
      gridLayout:  'single',

      // ── Tab Actions ─────────────────────────────────────────────────
      addTab: (projectType, name) => {
        const tab = createTab(projectType, name)
        set((s) => ({
          tabs:        [...s.tabs, tab],
          activeTabId: tab.id,
        }))
        return tab.id
      },

      // Close tab = park it in sidebar (preserves conversation)
      removeTab: (tabId) => {
        set((s) => {
          const tabs = s.tabs.map(t => t.id === tabId ? { ...t, parked: true } : t)
          const openTabs = tabs.filter(t => !t.parked)
          const activeTabId =
            s.activeTabId === tabId
              ? (openTabs[openTabs.length - 1]?.id ?? null)
              : s.activeTabId
          return { tabs, activeTabId }
        })
      },

      // Explicitly park a tab
      parkTab: (tabId) => {
        set((s) => {
          const tabs = s.tabs.map(t => t.id === tabId ? { ...t, parked: true } : t)
          const openTabs = tabs.filter(t => !t.parked)
          const activeTabId =
            s.activeTabId === tabId
              ? (openTabs[openTabs.length - 1]?.id ?? null)
              : s.activeTabId
          return { tabs, activeTabId }
        })
      },

      // Reopen a parked tab
      unparkTab: (tabId) => {
        set((s) => ({
          tabs: s.tabs.map(t => t.id === tabId ? { ...t, parked: false } : t),
          activeTabId: tabId,
        }))
      },

      // Permanently delete (remove from sidebar too)
      deleteTab: (tabId) => {
        set((s) => {
          const tabs = s.tabs.filter(t => t.id !== tabId)
          const activeTabId =
            s.activeTabId === tabId
              ? (tabs.filter(t => !t.parked)[0]?.id ?? null)
              : s.activeTabId
          return { tabs, activeTabId }
        })
      },

      setActiveTab: (tabId) => set({ activeTabId: tabId }),

      updateTab: (tabId, patch) => {
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id === tabId ? { ...t, ...patch } : t
          ),
        }))
      },

      // ── Skill Toggle Actions ───────────────────────────────────────
      enableSkill: (tabId, skillId) => {
        set((s) => ({
          tabs: s.tabs.map((t) => {
            if (t.id !== tabId) return t
            if (t.enabledSkillIds.includes(skillId)) return t
            return { ...t, enabledSkillIds: [...t.enabledSkillIds, skillId] }
          }),
        }))
      },

      disableSkill: (tabId, skillId) => {
        set((s) => ({
          tabs: s.tabs.map((t) =>
            t.id !== tabId
              ? t
              : { ...t, enabledSkillIds: t.enabledSkillIds.filter((id) => id !== skillId) }
          ),
        }))
      },

      toggleSkill: (tabId, skillId) => {
        const tab = get().tabs.find((t) => t.id === tabId)
        if (!tab) return
        if (tab.enabledSkillIds.includes(skillId)) {
          get().disableSkill(tabId, skillId)
        } else {
          get().enableSkill(tabId, skillId)
        }
      },

      // ── Grid Actions ───────────────────────────────────────────────
      setGridLayout: (layout) => set({ gridLayout: layout }),

      // ── Selectors ─────────────────────────────────────────────────
      activeTab: () => {
        const { tabs, activeTabId } = get()
        return tabs.find((t) => t.id === activeTabId && !t.parked)
      },

      getTab: (tabId) => get().tabs.find((t) => t.id === tabId),

      // Get only open (non-parked) tabs
      getOpenTabs: () => get().tabs.filter(t => !t.parked),

      // Get parked tabs for sidebar
      getParkedTabs: () => get().tabs.filter(t => t.parked),
    }),
    {
      name: 'plume-projects',
      partialize: (s) => ({
        tabs:        s.tabs,
        activeTabId: s.activeTabId,
        gridLayout:  s.gridLayout,
      }),
    }
  )
)
