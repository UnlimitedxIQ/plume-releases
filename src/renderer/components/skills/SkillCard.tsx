import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Wrench, Check, Plus,
  FileText, User, Palette, BookOpen, TrendingUp,
  Code2, BarChart3, FileCode, Mail, Layers, DollarSign,
} from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import type { SkillDef } from '../../lib/ipc'
import SkillToggle from './SkillToggle'

// ── Icon map ──────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  FileText,
  User,
  Palette,
  BookOpen,
  TrendingUp,
  Code2,
  BarChart3,
  FileCode,
  Mail,
  Layers,
  DollarSign,
  Presentation: Palette, // fallback — lucide has no Presentation icon
}

function SkillIcon({ name, color }: { name?: string; color: string }) {
  const Component = name ? (ICON_MAP[name] ?? Wrench) : Wrench
  return <Component size={16} style={{ color }} />
}

// ── Props ─────────────────────────────────────────────────────────────────

interface SkillCardProps {
  skill:   SkillDef
  mode:    'library' | 'marketplace'
  /** Called when user clicks "+ Add" in marketplace mode */
  onAdd?:  (skillId: string) => void
  /** Tab context — only needed in library mode to toggle skill */
  tabId?:  string
}

// ── Component ─────────────────────────────────────────────────────────────

export default function SkillCard({ skill, mode, onAdd, tabId }: SkillCardProps) {
  const toggleSkill  = useProjectStore((s) => s.toggleSkill)
  const activeTab    = useProjectStore((s) => s.activeTab)
  const currentTabId = tabId ?? activeTab()?.id
  const enabledIds   = useProjectStore((s) =>
    currentTabId ? (s.tabs.find((t) => t.id === currentTabId)?.enabledSkillIds ?? []) : []
  )
  const enabled      = enabledIds.includes(skill.id)

  const [added, setAdded] = useState(false)

  function handleToggle() {
    if (!currentTabId) return
    toggleSkill(currentTabId, skill.id)
  }

  function handleAdd() {
    setAdded(true)
    onAdd?.(skill.id)
  }

  const iconColor = mode === 'library' && enabled ? '#FEE123' : '#8a9b90'
  const iconBg    = mode === 'library' && enabled
    ? 'rgba(0,103,71,0.25)'
    : '#1a2420'

  const borderColor = mode === 'library' && enabled
    ? 'rgba(0,103,71,0.5)'
    : '#1e2d26'

  const leftAccent = mode === 'library' && enabled
    ? '3px solid #006747'
    : '3px solid transparent'

  return (
    <motion.div
      layout
      whileHover={
        mode === 'marketplace'
          ? { y: -2, scale: 1.01, boxShadow: '0 0 20px rgba(0,103,71,0.18)' }
          : { y: -2, scale: 1.01 }
      }
      transition={{ duration: 0.15 }}
      style={{
        background:   '#111916',
        border:       `1px solid ${borderColor}`,
        borderLeft:   leftAccent,
        borderRadius: '12px',
        padding:      '14px',
        position:     'relative',
        cursor:       mode === 'library' ? 'default' : 'pointer',
        transition:   'border-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow:    mode === 'library' && enabled
          ? '0 0 16px rgba(0,103,71,0.12)'
          : 'none',
        height:       '100%',
        boxSizing:    'border-box',
      }}
    >
      {/* Top row: icon + action */}
      <div className="flex items-start justify-between mb-3">
        {/* Icon */}
        <div
          style={{
            width:          '34px',
            height:         '34px',
            borderRadius:   '8px',
            background:     iconBg,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            transition:     'background 0.2s ease',
            flexShrink:     0,
          }}
        >
          <SkillIcon name={skill.icon} color={iconColor} />
        </div>

        {/* Action */}
        {mode === 'library' ? (
          <SkillToggle enabled={enabled} onChange={handleToggle} />
        ) : (
          <AddButton added={added} onAdd={handleAdd} />
        )}
      </div>

      {/* Name */}
      <div
        style={{
          fontSize:    '13px',
          fontWeight:  700,
          color:       '#e8ede9',
          marginBottom:'4px',
          lineHeight:  1.3,
        }}
      >
        {skill.name}
      </div>

      {/* Description */}
      <p
        style={{
          fontSize:         '11px',
          color:            '#5a6b60',
          lineHeight:       1.45,
          marginBottom:     mode === 'marketplace' ? '8px' : '0',
          display:          '-webkit-box',
          WebkitLineClamp:  2,
          WebkitBoxOrient:  'vertical',
          overflow:         'hidden',
        }}
      >
        {skill.description}
      </p>

      {/* Tool count badge — marketplace only */}
      {mode === 'marketplace' && (
        <div className="flex items-center gap-1" style={{ marginTop: 'auto' }}>
          <span
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '4px',
              fontSize:     '10px',
              color:        '#5a6b60',
              background:   '#1a2420',
              border:       '1px solid #2a3a32',
              borderRadius: '4px',
              padding:      '2px 6px',
            }}
          >
            <Wrench size={9} />
            {skill.toolCount} {skill.toolCount === 1 ? 'tool' : 'tools'}
          </span>
        </div>
      )}
    </motion.div>
  )
}

// ── Add Button ────────────────────────────────────────────────────────────

function AddButton({ added, onAdd }: { added: boolean; onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      disabled={added}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            '4px',
        padding:        '4px 10px',
        borderRadius:   '6px',
        border:         'none',
        background:     added ? '#1a2420' : '#006747',
        color:          added ? '#5a6b60' : '#ffffff',
        fontSize:       '11px',
        fontWeight:     600,
        cursor:         added ? 'default' : 'pointer',
        transition:     'background 0.2s ease, color 0.2s ease',
        flexShrink:     0,
        whiteSpace:     'nowrap',
      }}
    >
      {added ? (
        <>
          <Check size={11} />
          Added
        </>
      ) : (
        <>
          <Plus size={11} />
          Add
        </>
      )}
    </button>
  )
}
