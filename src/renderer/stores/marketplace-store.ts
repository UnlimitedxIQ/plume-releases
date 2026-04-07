import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { INITIAL_PACKS, INITIAL_MCPS, fetchMarketplaceCatalog } from '../components/skills/skill-data'
import type { SkillPack, McpServer } from '../components/skills/skill-data'

interface MarketplaceState {
  packs: SkillPack[]
  mcps: McpServer[]
  catalogFetched: boolean

  installPack: (packId: string) => void
  uninstallPack: (packId: string) => void
  installMcp: (mcpId: string) => void
  uninstallMcp: (mcpId: string) => void
  refreshCatalog: () => Promise<void>

  getInstalledPacks: () => SkillPack[]
  getMarketplacePacks: () => SkillPack[]
  getInstalledMcps: () => McpServer[]
  getMarketplaceMcps: () => McpServer[]
  getAllInstalledSkillNames: () => string[]
}

export const useMarketplaceStore = create<MarketplaceState>()(
  persist(
    (set, get) => ({
      packs: INITIAL_PACKS,
      mcps: INITIAL_MCPS,
      catalogFetched: false,

      installPack: (packId) => {
        set(s => ({
          packs: s.packs.map(p => p.id === packId ? { ...p, installed: true } : p),
        }))
      },

      uninstallPack: (packId) => {
        set(s => ({
          packs: s.packs.map(p =>
            p.id === packId && !p.preInstalled ? { ...p, installed: false } : p
          ),
        }))
      },

      installMcp: (mcpId) => {
        set(s => ({
          mcps: s.mcps.map(m => m.id === mcpId ? { ...m, installed: true } : m),
        }))
      },

      uninstallMcp: (mcpId) => {
        set(s => ({
          mcps: s.mcps.map(m =>
            m.id === mcpId && !m.preInstalled ? { ...m, installed: false } : m
          ),
        }))
      },

      // Fetch catalog from GitHub, merge with local installed state
      refreshCatalog: async () => {
        const catalog = await fetchMarketplaceCatalog()
        if (!catalog) return // Network failed, keep local data

        const currentPacks = get().packs
        const currentMcps = get().mcps

        // Preserve installed state from current data
        const installedPackIds = new Set(currentPacks.filter(p => p.installed).map(p => p.id))
        const installedMcpIds = new Set(currentMcps.filter(m => m.installed).map(m => m.id))

        const mergedPacks = catalog.packs.map(p => ({
          ...p,
          installed: p.preInstalled || installedPackIds.has(p.id),
        }))

        const mergedMcps = catalog.mcps.map(m => ({
          ...m,
          installed: m.preInstalled || installedMcpIds.has(m.id),
        }))

        set({ packs: mergedPacks, mcps: mergedMcps, catalogFetched: true })
      },

      getInstalledPacks: () => get().packs.filter(p => p.installed),
      getMarketplacePacks: () => get().packs.filter(p => !p.installed),
      getInstalledMcps: () => get().mcps.filter(m => m.installed),
      getMarketplaceMcps: () => get().mcps.filter(m => !m.installed),
      getAllInstalledSkillNames: () => {
        const installed = get().packs.filter(p => p.installed)
        return installed.flatMap(p => p.skills)
      },
    }),
    {
      name: 'plume-marketplace',
      partialize: (s) => ({
        packs: s.packs,
        mcps: s.mcps,
        catalogFetched: s.catalogFetched,
      }),
    }
  )
)
