import type { ProjectTypeId } from '../lib/constants'

// ── Project Tab ────────────────────────────────────────────────────────────

export interface Tab {
  id:               string
  projectType:      ProjectTypeId
  name:             string
  enabledSkillIds:  string[]
  /** Custom system prompt override (if any) */
  systemPromptOverride?: string
  createdAt:        number
  /** When true, tab is "parked" in the sidebar instead of the tab bar */
  parked:           boolean
}

// ── Grid Layout ────────────────────────────────────────────────────────────

export type GridLayout = 'single' | 'split' | 'triple' | 'quad' | 'full'

export interface GridConfig {
  layout:  GridLayout
  /** Which tab occupies each grid cell (index = cell index) */
  cells:   (string | null)[]
}

// ── Tab Factory ────────────────────────────────────────────────────────────

import { PROJECT_TYPES } from '../lib/constants'

export function createTab(
  projectType: ProjectTypeId,
  overrideName?: string
): Tab {
  const def = PROJECT_TYPES[projectType]
  return {
    id:              crypto.randomUUID(),
    projectType,
    name:            overrideName ?? def.label,
    enabledSkillIds: [...def.defaultSkills],
    createdAt:       Date.now(),
    parked:          false,
  }
}

// ── Grid Layout → CSS ──────────────────────────────────────────────────────

export function gridLayoutToCSS(layout: GridLayout): {
  gridTemplateColumns: string
  gridTemplateRows:    string
  maxCells:            number
} {
  switch (layout) {
    case 'single':
      return { gridTemplateColumns: '1fr', gridTemplateRows: '1fr', maxCells: 1 }
    case 'split':
      return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr', maxCells: 2 }
    case 'triple':
      return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', maxCells: 3 }
    case 'quad':
      return { gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', maxCells: 4 }
    case 'full':
      return { gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr', maxCells: 6 }
  }
}
