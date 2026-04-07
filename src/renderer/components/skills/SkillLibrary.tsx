import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Store, Search, Zap, Plug, Plus, Check, ChevronDown, ChevronUp,
  FileText, Palette, BookOpen, TrendingUp, Code2, BarChart3,
  Mail, DollarSign, HardDrive, GitBranch, Monitor, Share2,
  Image, Play, Calendar, FolderOpen, GraduationCap, MessageCircle,
  Package, Shield,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

interface SkillPack {
  id: string
  name: string
  description: string
  icon: string
  color: string
  skills: string[]
  installed: boolean
  preInstalled: boolean
}

interface McpServer {
  id: string
  name: string
  description: string
  icon: string
  category: 'data' | 'productivity' | 'development' | 'ai'
  installed: boolean
  requiresAccess?: string
}

// ── Icon map ───────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap, BookOpen, Code2, TrendingUp, Zap, Palette,
  BarChart3, MessageCircle, HardDrive, FileText, Mail,
  DollarSign, GitBranch, Monitor, Share2, Image, Play,
  Calendar, FolderOpen, Package, Shield, Search, Store,
}

function getIcon(name: string): React.ElementType {
  return ICON_MAP[name] ?? Zap
}

// ── Data ───────────────────────────────────────────────────────────────────

const INITIAL_PACKS: SkillPack[] = [
  // Pre-installed
  {
    id: 'student-essentials', name: 'Student Essentials',
    description: 'Canvas integration, study tools, and AI writing assistance',
    icon: 'GraduationCap', color: '#FEE123',
    skills: ['Canvas Integration', 'Humanize Writing', 'Study Flashcards'],
    installed: true, preInstalled: true,
  },
  {
    id: 'academic-writing', name: 'Academic Writing',
    description: 'UO writing standards, citations, research papers, and presentations',
    icon: 'BookOpen', color: '#3b82f6',
    skills: ['UO Business Writing', 'UO Resume Guide', 'UO Research Paper', 'Article Writing', 'UO Presentation'],
    installed: true, preInstalled: true,
  },
  {
    id: 'code-toolkit', name: 'Code Toolkit',
    description: 'Coding standards, patterns, and test-driven development',
    icon: 'Code2', color: '#22c55e',
    skills: ['Coding Standards', 'Python Patterns', 'Frontend Patterns', 'Backend Patterns', 'TDD Workflow'],
    installed: true, preInstalled: true,
  },
  // Marketplace
  {
    id: 'business-finance', name: 'Business & Finance',
    description: 'Financial analysis, market research, competitive intelligence',
    icon: 'TrendingUp', color: '#f59e0b',
    skills: ['Financial Analysis', 'Financial Analyst', 'Market Research', 'Competitive Teardown', 'Pricing Strategy'],
    installed: false, preInstalled: false,
  },
  {
    id: 'entrepreneurship', name: 'Entrepreneurship',
    description: 'MVP building, customer acquisition, launch strategy',
    icon: 'Zap', color: '#ec4899',
    skills: ['MVP Builder', 'First Customers', 'Launch Strategy', 'Investor Materials', 'Investor Outreach'],
    installed: false, preInstalled: false,
  },
  {
    id: 'design-creative', name: 'Design & Creative',
    description: 'UI/UX, 3D web, premium design, Canva integration',
    icon: 'Palette', color: '#a855f7',
    skills: ['UO UI/UX Skills', 'Frontend Design', '3D Immersive', 'Overkill Web Design', 'Canva Presentation'],
    installed: false, preInstalled: false,
  },
  {
    id: 'devops-infra', name: 'DevOps & Infrastructure',
    description: 'Docker, CI/CD, databases, API design, security',
    icon: 'HardDrive', color: '#14b8a6',
    skills: ['Docker Patterns', 'Deployment Patterns', 'Database Migrations', 'PostgreSQL Patterns', 'API Design', 'Security Review'],
    installed: false, preInstalled: false,
  },
  {
    id: 'data-analytics', name: 'Data & Analytics',
    description: 'Data visualization, testing, and interactive tutorials',
    icon: 'BarChart3', color: '#6366f1',
    skills: ['Data Visualization', 'Python Testing', 'E2E Testing', 'Codebase to Course'],
    installed: false, preInstalled: false,
  },
  {
    id: 'content-marketing', name: 'Content & Marketing',
    description: 'Copywriting, social media, email outreach, landing pages',
    icon: 'MessageCircle', color: '#f97316',
    skills: ['Copywriting', 'Content Engine', 'Cold Email', 'Marketing Psychology', 'Landing Page Generator'],
    installed: false, preInstalled: false,
  },
]

const INITIAL_MCPS: McpServer[] = [
  // Pre-installed
  { id: 'canvas-lms', name: 'Canvas LMS', description: 'Assignments, rubrics, due dates', icon: 'GraduationCap', category: 'data', installed: true },
  { id: 'google-calendar', name: 'Google Calendar', description: 'Schedule and events', icon: 'Calendar', category: 'productivity', installed: true },
  { id: 'web-search', name: 'Web Search', description: 'Search current information', icon: 'Search', category: 'data', installed: true },
  { id: 'filesystem', name: 'Local Files', description: 'Read and write local files', icon: 'FolderOpen', category: 'development', installed: true },
  { id: 'git', name: 'Git', description: 'Repository management', icon: 'GitBranch', category: 'development', installed: true },
  // Marketplace
  { id: 'bloomberg', name: 'Bloomberg Terminal', description: 'Financial data and market analytics', icon: 'TrendingUp', category: 'data', installed: false, requiresAccess: 'Requires UO Finance access' },
  { id: 'capital-iq', name: 'Capital IQ', description: 'Business research and company data', icon: 'BarChart3', category: 'data', installed: false, requiresAccess: 'Requires UO Finance access' },
  { id: 'pitchbook', name: 'PitchBook', description: 'VC and PE deal data', icon: 'DollarSign', category: 'data', installed: false, requiresAccess: 'Requires UO Finance access' },
  { id: 'uo-library', name: 'UO Library', description: 'Academic databases and journals', icon: 'BookOpen', category: 'data', installed: false },
  { id: 'notion', name: 'Notion', description: 'Pages and databases', icon: 'FileText', category: 'productivity', installed: false },
  { id: 'gmail', name: 'Gmail', description: 'Email management', icon: 'Mail', category: 'productivity', installed: false },
  { id: 'google-drive', name: 'Google Drive', description: 'Docs, Sheets, Slides', icon: 'HardDrive', category: 'productivity', installed: false },
  { id: 'youtube-transcript', name: 'YouTube Transcript', description: 'Video transcripts with timestamps', icon: 'Play', category: 'data', installed: false },
  { id: 'github', name: 'GitHub', description: 'Repos, PRs, code search', icon: 'GitBranch', category: 'development', installed: false },
  { id: 'playwright', name: 'Playwright', description: 'Browser automation', icon: 'Monitor', category: 'development', installed: false },
  { id: 'mermaid', name: 'Mermaid Diagrams', description: 'Flowcharts and diagrams', icon: 'Share2', category: 'development', installed: false },
  { id: 'image-gen', name: 'Image Generator', description: 'AI image generation', icon: 'Image', category: 'ai', installed: false },
  { id: 'canva', name: 'Canva', description: 'Design platform', icon: 'Palette', category: 'ai', installed: false },
]

const CATEGORY_LABELS: Record<string, string> = {
  data: 'Data', productivity: 'Productivity', development: 'Dev', ai: 'AI',
}

// ── Colors ─────────────────────────────────────────────────────────────────

const C = {
  bg: '#0a0f0d',
  surface: '#111916',
  surfaceLight: '#1a2420',
  border: '#1e2d26',
  borderLight: '#2a3a32',
  green: '#006747',
  greenDark: '#154733',
  yellow: '#FEE123',
  text: '#e8ede9',
  textSec: '#8a9b90',
  textMuted: '#5a6b60',
}

// ── Main component ─────────────────────────────────────────────────────────

type MainTab = 'library' | 'marketplace'

export default function SkillLibrary() {
  const [tab, setTab] = useState<MainTab>('library')
  const [search, setSearch] = useState('')
  const [packs, setPacks] = useState<SkillPack[]>(INITIAL_PACKS)
  const [mcps, setMcps] = useState<McpServer[]>(INITIAL_MCPS)

  const q = search.toLowerCase()
  const matches = (name: string, desc: string) =>
    !q || name.toLowerCase().includes(q) || desc.toLowerCase().includes(q)

  const installPack = (id: string) =>
    setPacks(prev => prev.map(p => p.id === id ? { ...p, installed: true } : p))

  const installMcp = (id: string) =>
    setMcps(prev => prev.map(m => m.id === id ? { ...m, installed: true } : m))

  // Derive installed skills from installed packs
  const installedSkillNames = new Set(
    packs.filter(p => p.installed).flatMap(p => p.skills)
  )

  // Skills for library view: all skills from installed packs with their pack info
  const librarySkills: Array<{ name: string; packId: string; packName: string; packColor: string; packIcon: string }> = packs
    .filter(p => p.installed)
    .flatMap(p => p.skills.map(s => ({ name: s, packId: p.id, packName: p.name, packColor: p.color, packIcon: p.icon })))
    .filter(s => matches(s.name, s.packName))

  // MCPs
  const installedMcps = mcps.filter(m => m.installed && matches(m.name, m.description))
  const marketMcps = mcps.filter(m => !m.installed && matches(m.name, m.description))

  // Marketplace packs
  const marketPacks = packs.filter(p => !p.installed && matches(p.name, p.description))
  const installedPacks = packs.filter(p => p.installed && matches(p.name, p.description))

  // Individual skills in marketplace: skills not in any installed pack, not matching any installed pack
  const allMarketSkillNames = packs
    .filter(p => !p.installed)
    .flatMap(p => p.skills)
  const uniqueMarketSkills = [...new Set(allMarketSkillNames)].filter(s =>
    !installedSkillNames.has(s) && matches(s, '')
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: C.bg }}>
      {/* ── Header ── */}
      <div style={{ padding: '14px 20px 10px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(254,225,35,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Store size={15} style={{ color: C.yellow }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>MarketPlace</span>
        </div>

        {/* Search bar */}
        <div style={{
          maxWidth: 520, margin: '0 auto 12px',
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 14px',
          background: C.surface,
          border: `1px solid ${C.borderLight}`,
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        }}>
          <Search size={15} style={{ color: C.textMuted, flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search skills and MCPs..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: C.text, fontSize: 13, fontFamily: 'inherit',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{ background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <PillTab label="My Library" active={tab === 'library'} onClick={() => setTab('library')} />
          <PillTab label="Marketplace" active={tab === 'marketplace'} onClick={() => setTab('marketplace')} />
        </div>
      </div>

      {/* ── Content: 50/50 split ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, padding: '12px', gap: 10 }}>
        <AnimatePresence mode="wait">
          {tab === 'library' ? (
            <motion.div
              key="library"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', flex: 1, gap: 10, minHeight: 0 }}
            >
              {/* Left: Skills */}
              <Column label="SKILLS" icon={<Zap size={12} />} count={librarySkills.length}>
                {librarySkills.length === 0 ? (
                  <EmptyState msg="No skills installed" action="Browse Marketplace" onAction={() => setTab('marketplace')} />
                ) : (
                  <TwoColGrid>
                    {librarySkills.map((s, i) => (
                      <LibSkillCard key={`${s.packId}-${s.name}`} name={s.name} packName={s.packName} packColor={s.packColor} packIcon={s.packIcon} index={i} />
                    ))}
                  </TwoColGrid>
                )}
              </Column>

              {/* Right: MCPs */}
              <Column label="MCP SERVERS" icon={<Plug size={12} />} count={installedMcps.length}>
                {installedMcps.length === 0 ? (
                  <EmptyState msg="No MCPs connected" action="Browse Marketplace" onAction={() => setTab('marketplace')} />
                ) : (
                  <TwoColGrid>
                    {installedMcps.map((m, i) => (
                      <LibMcpCard key={m.id} mcp={m} index={i} />
                    ))}
                  </TwoColGrid>
                )}
              </Column>
            </motion.div>
          ) : (
            <motion.div
              key="marketplace"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{ display: 'flex', flex: 1, gap: 10, minHeight: 0 }}
            >
              {/* Left: Packs + Individual Skills */}
              <Column label="SKILLS" icon={<Package size={12} />} count={marketPacks.length + uniqueMarketSkills.length}>
                {/* Featured Packs section */}
                {(installedPacks.length > 0 || marketPacks.length > 0) && (
                  <div style={{ marginBottom: 16 }}>
                    <SectionLabel text="FEATURED PACKS" />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {/* Show installed packs first (grayed), then market packs */}
                      {installedPacks.map((p, i) => (
                        <PackCard key={p.id} pack={p} index={i} onInstall={() => installPack(p.id)} />
                      ))}
                      {marketPacks.map((p, i) => (
                        <PackCard key={p.id} pack={p} index={installedPacks.length + i} onInstall={() => installPack(p.id)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Individual Skills section */}
                {uniqueMarketSkills.length > 0 && (
                  <div>
                    <SectionLabel text="INDIVIDUAL SKILLS" />
                    <TwoColGrid>
                      {uniqueMarketSkills.map((name, i) => (
                        <MktSkillCard key={name} name={name} index={i} />
                      ))}
                    </TwoColGrid>
                  </div>
                )}

                {marketPacks.length === 0 && uniqueMarketSkills.length === 0 && installedPacks.length === 0 && (
                  <EmptyState msg="No skills found" />
                )}
              </Column>

              {/* Right: MCPs */}
              <Column label="MCP SERVERS" icon={<Plug size={12} />} count={marketMcps.length}>
                {marketMcps.length === 0 ? (
                  <EmptyState msg="All MCPs installed!" />
                ) : (
                  <TwoColGrid>
                    {marketMcps.map((m, i) => (
                      <MktMcpCard key={m.id} mcp={m} index={i} onAdd={() => installMcp(m.id)} />
                    ))}
                  </TwoColGrid>
                )}
              </Column>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Column wrapper ─────────────────────────────────────────────────────────

function Column({ label, icon, count, children }: {
  label: string
  icon: React.ReactNode
  count: number
  children: React.ReactNode
}) {
  return (
    <div style={{
      width: '50%', display: 'flex', flexDirection: 'column',
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, overflow: 'hidden', minHeight: 0,
    }}>
      <div style={{ padding: '10px 14px 8px', borderBottom: `1px solid ${C.border}`, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ color: C.textMuted }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: '0.08em' }}>{label}</span>
        <span style={{
          fontSize: 9, fontWeight: 700, color: C.greenDark,
          background: C.yellow, borderRadius: 10, padding: '1px 6px', marginLeft: 2,
        }}>{count}</span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
        {children}
      </div>
    </div>
  )
}

// ── Layout helpers ─────────────────────────────────────────────────────────

function TwoColGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7 }}>
      {children}
    </div>
  )
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 700, color: C.textMuted, letterSpacing: '0.1em', marginBottom: 7 }}>
      {text}
    </div>
  )
}

// ── Pill tab ───────────────────────────────────────────────────────────────

function PillTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{
        padding: '6px 18px', borderRadius: 20, border: 'none',
        background: active ? C.yellow : 'transparent',
        color: active ? C.greenDark : C.textMuted,
        fontSize: 12, fontWeight: active ? 700 : 500,
        cursor: 'pointer', transition: 'background 0.15s ease, color 0.15s ease',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </motion.button>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ msg, action, onAction }: { msg: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ padding: '28px 16px', textAlign: 'center' }}>
      <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>{msg}</p>
      {action && onAction && (
        <button onClick={onAction} style={{
          marginTop: 10, padding: '5px 14px', borderRadius: 7,
          border: `1px solid ${C.green}`, background: 'transparent',
          color: C.yellow, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
        }}>{action}</button>
      )}
    </div>
  )
}

// ── Library: Skill card ────────────────────────────────────────────────────

function LibSkillCard({ name, packName, packColor, packIcon, index }: {
  name: string
  packName: string
  packColor: string
  packIcon: string
  index: number
}) {
  const [hovered, setHovered] = useState(false)
  const Icon = getIcon(packIcon)

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        padding: '10px',
        background: hovered ? C.surfaceLight : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? C.borderLight : C.border}`,
        borderLeft: `3px solid ${packColor}`,
        borderRadius: 9,
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6, flexShrink: 0,
          background: `${packColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={13} style={{ color: packColor }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3, flex: 1, minWidth: 0 }}>
          {name}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 8, fontWeight: 600, color: packColor,
          background: `${packColor}18`,
          border: `1px solid ${packColor}30`,
          borderRadius: 4, padding: '1px 5px',
          maxWidth: '70%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {packName}
        </span>
        <Check size={12} style={{ color: '#22c55e', flexShrink: 0 }} />
      </div>
    </motion.div>
  )
}

// ── Library: MCP card ──────────────────────────────────────────────────────

function LibMcpCard({ mcp, index }: { mcp: McpServer; index: number }) {
  const [hovered, setHovered] = useState(false)
  const Icon = getIcon(mcp.icon)
  const catColor = mcp.category === 'data' ? '#3b82f6'
    : mcp.category === 'productivity' ? '#f59e0b'
    : mcp.category === 'development' ? '#22c55e'
    : '#a855f7'

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        padding: '10px',
        background: hovered ? C.surfaceLight : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? C.borderLight : C.border}`,
        borderLeft: `3px solid ${catColor}`,
        borderRadius: 9,
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6, flexShrink: 0,
          background: `${catColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={13} style={{ color: catColor }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {mcp.name}
          </div>
          <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {mcp.description}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 8, fontWeight: 600,
          color: catColor, background: `${catColor}18`,
          border: `1px solid ${catColor}30`,
          borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase',
        }}>
          {CATEGORY_LABELS[mcp.category]}
        </span>
        <Check size={12} style={{ color: '#22c55e' }} />
      </div>
    </motion.div>
  )
}

// ── Marketplace: Pack card ─────────────────────────────────────────────────

function PackCard({ pack, index, onInstall }: { pack: SkillPack; index: number; onInstall: () => void }) {
  const [hovered, setHovered] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const Icon = getIcon(pack.icon)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        background: hovered ? C.surfaceLight : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? pack.color + '40' : C.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: hovered ? `0 4px 20px ${pack.color}18` : 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Color accent bar */}
        <div style={{ width: 4, background: pack.color, flexShrink: 0 }} />

        <div style={{ flex: 1, padding: '12px 12px 12px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            {/* Icon */}
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: `${pack.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} style={{ color: pack.color }} />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{pack.name}</span>
                {pack.preInstalled && (
                  <span style={{ fontSize: 8, fontWeight: 700, color: C.greenDark, background: C.yellow, borderRadius: 4, padding: '1px 5px' }}>
                    DEFAULT
                  </span>
                )}
              </div>
              <p style={{ fontSize: 11, color: C.textSec, margin: 0, lineHeight: 1.4 }}>{pack.description}</p>
            </div>

            {/* Action */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
              {pack.installed ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
                  <Check size={13} /> Installed
                </div>
              ) : (
                <motion.button
                  onClick={onInstall}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    padding: '5px 12px', borderRadius: 7, border: 'none',
                    background: C.green, color: C.text,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Install Pack
                </motion.button>
              )}
            </div>
          </div>

          {/* Footer: skill count + expand toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            <span style={{ fontSize: 10, color: C.textMuted }}>
              <span style={{ color: pack.color, fontWeight: 600 }}>{pack.skills.length}</span> skills included
            </span>
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: 'none', border: 'none', color: C.textMuted,
                fontSize: 10, cursor: 'pointer', padding: 0, fontFamily: 'inherit',
              }}
            >
              {expanded ? 'Hide' : 'Show'} skills
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          </div>

          {/* Expanded skill list */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {pack.skills.map(skill => (
                    <span key={skill} style={{
                      fontSize: 10, fontWeight: 500, color: C.textSec,
                      background: C.surfaceLight, border: `1px solid ${C.borderLight}`,
                      borderRadius: 5, padding: '2px 7px',
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// ── Marketplace: Individual skill card ────────────────────────────────────

function MktSkillCard({ name, index }: { name: string; index: number }) {
  const [added, setAdded] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        padding: '10px',
        background: hovered ? C.surfaceLight : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? C.borderLight : C.border}`,
        borderRadius: 9,
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? '0 3px 12px rgba(0,0,0,0.25)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(254,225,35,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Zap size={12} style={{ color: C.yellow }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{name}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {added ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#22c55e', fontWeight: 600 }}>
            <Check size={11} /> Added
          </span>
        ) : (
          <motion.button
            onClick={() => setAdded(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '3px 9px', borderRadius: 6, border: 'none',
              background: C.green, color: C.text,
              fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Plus size={10} /> Add
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

// ── Marketplace: MCP card ──────────────────────────────────────────────────

function MktMcpCard({ mcp, index, onAdd }: { mcp: McpServer; index: number; onAdd: () => void }) {
  const [hovered, setHovered] = useState(false)
  const [added, setAdded] = useState(false)
  const Icon = getIcon(mcp.icon)
  const catColor = mcp.category === 'data' ? '#3b82f6'
    : mcp.category === 'productivity' ? '#f59e0b'
    : mcp.category === 'development' ? '#22c55e'
    : '#a855f7'

  const handleAdd = () => { setAdded(true); onAdd() }

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        padding: '10px',
        background: hovered ? C.surfaceLight : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? C.borderLight : C.border}`,
        borderLeft: `3px solid ${catColor}`,
        borderRadius: 9,
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? '0 4px 12px rgba(0,0,0,0.25)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6, flexShrink: 0,
          background: `${catColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={13} style={{ color: catColor }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {mcp.name}
          </div>
          <div style={{ fontSize: 9, color: C.textMuted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {mcp.description}
          </div>
        </div>
      </div>

      {mcp.requiresAccess && (
        <div style={{ fontSize: 9, color: '#f59e0b', fontStyle: 'italic', marginBottom: 6, opacity: 0.8 }}>
          {mcp.requiresAccess}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 8, fontWeight: 600,
          color: catColor, background: `${catColor}18`,
          border: `1px solid ${catColor}30`,
          borderRadius: 4, padding: '1px 5px', textTransform: 'uppercase',
        }}>
          {CATEGORY_LABELS[mcp.category]}
        </span>
        {added ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#22c55e', fontWeight: 600 }}>
            <Check size={11} /> Added
          </span>
        ) : (
          <motion.button
            onClick={handleAdd}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '3px 9px', borderRadius: 6, border: 'none',
              background: C.green, color: C.text,
              fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Plus size={10} /> Add
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}
