import type { ProjectTypeId } from '../lib/constants'

// ── Skill ─────────────────────────────────────────────────────────────────

export interface Skill {
  id:           string
  name:         string
  description:  string
  longDescription?: string
  icon:         string
  /** Which project types this skill is relevant for */
  projectTypes: ProjectTypeId[]
  /** Number of tools this skill provides */
  toolCount:    number
  /** Whether this skill is a built-in or user-added */
  isBuiltIn:    boolean
  /** Whether this skill requires additional config */
  requiresConfig?: boolean
  /** Badge text (e.g., "Beta", "Pro") */
  badge?: string
  /** Version string */
  version?: string
  /** Author or source */
  author?: string
}

// ── Skill Categories ──────────────────────────────────────────────────────

export type SkillCategory =
  | 'productivity'
  | 'research'
  | 'coding'
  | 'writing'
  | 'canvas'
  | 'utility'

// ── Enabled Skill Map ─────────────────────────────────────────────────────

/** Map of tabId → set of enabled skill IDs */
export type TabSkillMap = Map<string, Set<string>>

// ── Skill Tool Definition ─────────────────────────────────────────────────

export interface SkillTool {
  name:        string
  description: string
  inputSchema: {
    type:       'object'
    properties: Record<string, SkillToolProperty>
    required?:  string[]
  }
}

export interface SkillToolProperty {
  type:        'string' | 'number' | 'boolean' | 'array' | 'object'
  description: string
  enum?:       string[]
  items?:      { type: string }
}
