import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StyleProfile } from '../types/style'
import { createBlankProfile } from '../types/style'

interface StyleState {
  // ── Profiles ──────────────────────────────────────────────────────────
  profiles:        StyleProfile[]
  activeProfileId: string | null

  // ── Actions ───────────────────────────────────────────────────────────
  addProfile:       (profile: StyleProfile) => void
  updateProfile:    (id: string, patch: Partial<StyleProfile>) => void
  deleteProfile:    (id: string) => void
  setActiveProfile: (id: string | null) => void
  createBlank:      (name: string) => StyleProfile

  // ── Selectors ─────────────────────────────────────────────────────────
  activeProfile: () => StyleProfile | undefined
  getProfile:    (id: string) => StyleProfile | undefined
}

export const useStyleStore = create<StyleState>()(
  persist(
    (set, get) => ({
      profiles:        [],
      activeProfileId: null,

      addProfile: (profile) => {
        set((s) => ({
          profiles:        [...s.profiles, profile],
          activeProfileId: s.activeProfileId ?? profile.id,
        }))
      },

      updateProfile: (id, patch) => {
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p
          ),
        }))
      },

      deleteProfile: (id) => {
        set((s) => {
          const profiles = s.profiles.filter((p) => p.id !== id)
          const activeProfileId =
            s.activeProfileId === id
              ? (profiles[0]?.id ?? null)
              : s.activeProfileId
          return { profiles, activeProfileId }
        })
      },

      setActiveProfile: (id) => set({ activeProfileId: id }),

      createBlank: (name) => {
        const profile = createBlankProfile(name)
        get().addProfile(profile)
        return profile
      },

      // ── Selectors ──────────────────────────────────────────────────
      activeProfile: () => {
        const { profiles, activeProfileId } = get()
        return profiles.find((p) => p.id === activeProfileId)
      },

      getProfile: (id) => get().profiles.find((p) => p.id === id),
    }),
    {
      name: 'plume-style',
      partialize: (s) => ({
        profiles:        s.profiles,
        activeProfileId: s.activeProfileId,
      }),
    }
  )
)
