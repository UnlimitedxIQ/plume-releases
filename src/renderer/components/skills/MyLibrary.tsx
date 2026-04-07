import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Search, Zap, Plug, FolderOpen } from 'lucide-react'

const C = {
  bg:          '#0a0f0d',
  surface:     '#111916',
  surfaceLight:'#1a2420',
  border:      '#2a3a32',
  borderLight: '#2a3a32',
  text:        '#e8ede9',
  textSecondary:'#8a9b90',
  textMuted:   '#5a6b60',
  yellow:      '#FEE123',
  greenDark:   '#154733',
  green:       '#22c55e',
}

interface ScannedSkill {
  id:          string
  name:        string
  description: string
  origin:      string
  path:        string
  category:    'skill' | 'plugin-skill'
}

interface ScannedMcp {
  id:          string
  name:        string
  command:     string
  pluginName:  string
  path:        string
}

export default function MyLibrary() {
  const [search, setSearch] = useState('')
  const [skills, setSkills] = useState<ScannedSkill[]>([])
  const [mcps, setMcps] = useState<ScannedMcp[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const api = (window as unknown as { api: Record<string, (...a: unknown[]) => Promise<unknown>> }).api
    if (api.scanClaudeSkills) {
      api.scanClaudeSkills().then((result: unknown) => {
        const r = result as { skills: ScannedSkill[]; mcps: ScannedMcp[] }
        setSkills(r.skills)
        setMcps(r.mcps)
        setLoading(false)
      }).catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const q = search.toLowerCase()
  const filteredSkills = skills.filter(
    (s) => !q || s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  )
  const filteredMcps = mcps.filter(
    (m) => !q || m.name.toLowerCase().includes(q) || m.pluginName.toLowerCase().includes(q)
  )

  // Group skills by origin
  const grouped = new Map<string, ScannedSkill[]>()
  for (const skill of filteredSkills) {
    const key = skill.origin || 'local'
    const arr = grouped.get(key) || []
    arr.push(skill)
    grouped.set(key, arr)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: C.bg }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px 12px', borderBottom: `1px solid ${C.border}`,
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'rgba(254,225,35,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BookOpen size={15} style={{ color: C.yellow }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
            Claude Skills & MCPs
          </span>
          <span style={{ fontSize: 11, color: C.textMuted }}>
            {skills.length} skills &middot; {mcps.length} MCPs
          </span>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '7px 12px', background: C.surface,
          border: `1px solid ${C.borderLight}`, borderRadius: 10, width: 210,
        }}>
          <Search size={13} style={{ color: C.textMuted }} />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: C.text, fontSize: 12, fontFamily: 'inherit',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{
              background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 0, fontSize: 14,
            }}>
              ×
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: '#154733', borderTopColor: '#FEE123' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', flex: 1, minHeight: 0, padding: 12, gap: 10 }}>
          {/* Left: Skills */}
          <Column label="SKILLS" icon={<Zap size={12} />} count={filteredSkills.length}>
            {filteredSkills.length === 0 ? (
              <EmptyState msg="No skills found in ~/.claude/skills/" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Array.from(grouped.entries()).map(([origin, groupSkills]) => (
                  <SkillGroup key={origin} origin={origin} skills={groupSkills} />
                ))}
              </div>
            )}
          </Column>

          {/* Right: MCPs */}
          <Column label="MCP SERVERS" icon={<Plug size={12} />} count={filteredMcps.length}>
            {filteredMcps.length === 0 ? (
              <EmptyState msg="No MCP servers found" />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7 }}>
                {filteredMcps.map((mcp, i) => (
                  <McpCard key={mcp.id} mcp={mcp} index={i} />
                ))}
              </div>
            )}
          </Column>
        </div>
      )}
    </div>
  )
}

function Column({ label, icon, count, children }: {
  label: string; icon: React.ReactNode; count: number; children: React.ReactNode
}) {
  return (
    <div style={{
      width: '50%', display: 'flex', flexDirection: 'column',
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, overflow: 'hidden', minHeight: 0,
    }}>
      <div style={{
        padding: '10px 14px 8px', borderBottom: `1px solid ${C.border}`,
        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ color: C.textMuted }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: '0.08em' }}>{label}</span>
        <span style={{
          fontSize: 9, fontWeight: 700, color: C.greenDark, background: C.yellow,
          borderRadius: 10, padding: '1px 6px',
        }}>{count}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>{children}</div>
    </div>
  )
}

function SkillGroup({ origin, skills }: { origin: string; skills: ScannedSkill[] }) {
  const color = origin === 'local' || origin === 'ECC' ? '#22c55e' : '#3b82f6'
  const label = origin === 'ECC' ? 'Claude Skills' : origin === 'local' ? 'Local' : origin

  return (
    <div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '5px 8px', background: `${color}14`,
        borderLeft: `3px solid ${color}`, borderRadius: '0 6px 6px 0', marginBottom: 7,
      }}>
        <FolderOpen size={11} style={{ color }} />
        <span style={{ fontSize: 9, fontWeight: 700, color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </span>
        <span style={{ fontSize: 8, color, opacity: 0.7, marginLeft: 'auto' }}>{skills.length}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7 }}>
        {skills.map((skill, i) => (
          <SkillCard key={skill.id} skill={skill} color={color} index={i} />
        ))}
      </div>
    </div>
  )
}

function SkillCard({ skill, color, index }: { skill: ScannedSkill; color: string; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.015 }}
      style={{
        padding: '9px 10px', background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${C.border}`, borderLeft: `3px solid ${color}`,
        borderRadius: 9,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 3 }}>{skill.name}</div>
      {skill.description && (
        <div style={{
          fontSize: 10, color: C.textMuted, lineHeight: 1.4,
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
        }}>
          {skill.description}
        </div>
      )}
    </motion.div>
  )
}

function McpCard({ mcp, index }: { mcp: ScannedMcp; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      style={{
        padding: '9px 10px', background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${C.border}`, borderLeft: `3px solid #a855f7`,
        borderRadius: 9,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 2 }}>{mcp.name}</div>
      <div style={{ fontSize: 10, color: C.textMuted }}>{mcp.pluginName}</div>
    </motion.div>
  )
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ padding: '40px 16px', textAlign: 'center' }}>
      <BookOpen size={18} style={{ color: C.textMuted, margin: '0 auto 12px' }} />
      <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>{msg}</p>
    </div>
  )
}
