import { readdirSync, readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'

const CLAUDE_DIR = join(homedir(), '.claude')
const SKILLS_DIR = join(CLAUDE_DIR, 'skills')
const PLUGINS_DIR = join(CLAUDE_DIR, 'plugins')

export interface ScannedSkill {
  id:          string
  name:        string
  description: string
  origin:      string
  path:        string
  category:    'skill' | 'plugin-skill'
}

export interface ScannedMcp {
  id:          string
  name:        string
  command:     string
  pluginName:  string
  path:        string
}

/**
 * Scan ~/.claude/skills/ for all installed skills.
 * Each skill is a folder with a SKILL.md containing YAML frontmatter.
 */
export function scanSkills(): ScannedSkill[] {
  const skills: ScannedSkill[] = []

  if (!existsSync(SKILLS_DIR)) return skills

  for (const entry of readdirSync(SKILLS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue

    const skillMd = join(SKILLS_DIR, entry.name, 'SKILL.md')
    if (!existsSync(skillMd)) continue

    try {
      const content = readFileSync(skillMd, 'utf-8')
      const frontmatter = parseFrontmatter(content)

      skills.push({
        id:          entry.name,
        name:        frontmatter.name || entry.name,
        description: frontmatter.description || '',
        origin:      frontmatter.origin || 'local',
        path:        skillMd,
        category:    'skill',
      })
    } catch {
      // Skip unreadable skills
    }
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Scan ~/.claude/plugins/ for installed plugin skills and MCPs.
 */
export function scanPluginSkills(): ScannedSkill[] {
  const skills: ScannedSkill[] = []
  const installedPath = join(PLUGINS_DIR, 'installed_plugins.json')

  if (!existsSync(installedPath)) return skills

  try {
    const installed = JSON.parse(readFileSync(installedPath, 'utf-8'))
    const plugins = installed.plugins || {}

    for (const [pluginKey, entries] of Object.entries(plugins)) {
      if (!Array.isArray(entries) || entries.length === 0) continue
      const entry = entries[0] as { installPath?: string }
      if (!entry.installPath) continue

      // Look for skills in the plugin's install path
      const skillsDir = join(entry.installPath, 'skills')
      if (!existsSync(skillsDir)) continue

      for (const skillEntry of readdirSync(skillsDir, { withFileTypes: true })) {
        if (!skillEntry.isDirectory()) continue
        const skillMd = join(skillsDir, skillEntry.name, 'SKILL.md')
        if (!existsSync(skillMd)) continue

        try {
          const content = readFileSync(skillMd, 'utf-8')
          const fm = parseFrontmatter(content)

          skills.push({
            id:          `${pluginKey}:${skillEntry.name}`,
            name:        fm.name || skillEntry.name,
            description: fm.description || '',
            origin:      pluginKey,
            path:        skillMd,
            category:    'plugin-skill',
          })
        } catch {}
      }
    }
  } catch {}

  return skills.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Scan for MCP servers from plugin .mcp.json files.
 */
export function scanMcpServers(): ScannedMcp[] {
  const mcps: ScannedMcp[] = []
  const cacheDir = join(PLUGINS_DIR, 'cache')

  if (!existsSync(cacheDir)) return mcps

  // Walk plugin cache looking for .mcp.json files
  try {
    for (const marketplace of readdirSync(cacheDir, { withFileTypes: true })) {
      if (!marketplace.isDirectory()) continue
      const mpDir = join(cacheDir, marketplace.name)

      for (const plugin of readdirSync(mpDir, { withFileTypes: true })) {
        if (!plugin.isDirectory()) continue
        const pluginDir = join(mpDir, plugin.name)

        // Check each version directory
        for (const version of readdirSync(pluginDir, { withFileTypes: true })) {
          if (!version.isDirectory()) continue
          const mcpJson = join(pluginDir, version.name, '.mcp.json')

          if (existsSync(mcpJson)) {
            try {
              const config = JSON.parse(readFileSync(mcpJson, 'utf-8'))
              const servers = config.mcpServers || {}

              for (const [name, server] of Object.entries(servers)) {
                const s = server as { command?: string }
                mcps.push({
                  id:         `${plugin.name}:${name}`,
                  name,
                  command:    s.command || '',
                  pluginName: plugin.name,
                  path:       mcpJson,
                })
              }
            } catch {}
          }
        }
      }
    }
  } catch {}

  return mcps
}

/**
 * Get all skills + plugin skills combined.
 */
export function scanAll(): { skills: ScannedSkill[]; mcps: ScannedMcp[] } {
  const skills = [...scanSkills(), ...scanPluginSkills()]
  const mcps = scanMcpServers()
  return { skills, mcps }
}

// ── YAML frontmatter parser (simple, no dependencies) ─────────────────

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/)
  if (!match) return {}

  const result: Record<string, string> = {}
  let currentKey = ''
  let currentValue = ''

  for (const line of match[1].split('\n')) {
    // Handle multi-line values (indented continuation or >)
    if (currentKey && (line.startsWith('  ') || line.startsWith('\t'))) {
      currentValue += ' ' + line.trim()
      continue
    }

    // Save previous key-value
    if (currentKey) {
      result[currentKey] = currentValue.trim()
    }

    // Parse new key: value
    const kv = line.match(/^(\w[\w-]*):\s*(.*)/)
    if (kv) {
      currentKey = kv[1]
      currentValue = kv[2].replace(/^["'>]\s*/, '').replace(/["']$/, '')
    } else {
      currentKey = ''
      currentValue = ''
    }
  }

  // Save last key
  if (currentKey) {
    result[currentKey] = currentValue.trim()
  }

  return result
}
