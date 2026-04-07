import { useRef, useLayoutEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Crown, Zap } from 'lucide-react'
import type { AgentMode } from '../../types/agent'
import { AGENT_MODES } from '../../lib/constants'

interface ModeConfig {
  id:          AgentMode
  label:       string
  description: string
  Icon:        React.ElementType
}

const MODES: ModeConfig[] = [
  {
    id:          'standard',
    label:       AGENT_MODES.standard.label,
    description: AGENT_MODES.standard.description,
    Icon:        MessageSquare,
  },
  {
    id:          'ceo',
    label:       AGENT_MODES.ceo.label,
    description: AGENT_MODES.ceo.description,
    Icon:        Crown,
  },
  {
    id:          'auto',
    label:       AGENT_MODES.auto.label,
    description: AGENT_MODES.auto.description,
    Icon:        Zap,
  },
]

interface ModeSelectorProps {
  activeMode: AgentMode
  onChange:   (mode: AgentMode) => void
}

export default function ModeSelector({ activeMode, onChange }: ModeSelectorProps) {
  const containerRef                = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setStyle]  = useState({ left: 0, width: 0 })
  const [tooltip, setTooltip]       = useState<AgentMode | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const btn = container.querySelector<HTMLButtonElement>(`[data-mode="${activeMode}"]`)
    if (!btn) return
    const cRect = container.getBoundingClientRect()
    const bRect = btn.getBoundingClientRect()
    setStyle({ left: bRect.left - cRect.left, width: bRect.width })
  }, [activeMode])

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label="Agent mode"
      style={{
        position:   'relative',
        display:    'inline-flex',
        alignItems: 'center',
        background: '#0c1510',
        borderRadius:'8px',
        border:     '1px solid #2a3a32',
        padding:    '2px',
        gap:        '1px',
      }}
    >
      {/* Sliding yellow indicator */}
      <motion.div
        animate={indicatorStyle}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{
          position:     'absolute',
          top:          '2px',
          bottom:       '2px',
          borderRadius: '6px',
          background:   '#FEE123',
          zIndex:       0,
          pointerEvents:'none',
        }}
      />

      {MODES.map(({ id, label, description, Icon }) => {
        const active = id === activeMode
        return (
          <div key={id} style={{ position: 'relative' }}>
            <button
              role="tab"
              aria-selected={active}
              data-mode={id}
              onClick={() => onChange(id)}
              onMouseEnter={() => !active && setTooltip(id)}
              onMouseLeave={() => setTooltip(null)}
              style={{
                position:    'relative',
                zIndex:      1,
                display:     'flex',
                alignItems:  'center',
                gap:         '5px',
                padding:     '5px 11px',
                borderRadius:'6px',
                border:      'none',
                background:  'transparent',
                cursor:      'pointer',
                fontSize:    '11px',
                fontWeight:  active ? 700 : 500,
                color:       active ? '#0a0f0d' : '#5a6b60',
                whiteSpace:  'nowrap',
                transition:  'color 0.15s ease',
                lineHeight:  1,
              }}
            >
              <Icon
                size={12}
                style={{
                  flexShrink: 0,
                  color:      active ? '#0a0f0d' : '#5a6b60',
                  transition: 'color 0.15s ease',
                }}
              />
              {label}
            </button>

            {/* Tooltip on hover for non-active modes */}
            {tooltip === id && !active && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
                style={{
                  position:    'absolute',
                  top:         'calc(100% + 6px)',
                  left:        '50%',
                  transform:   'translateX(-50%)',
                  background:  '#1a2420',
                  border:      '1px solid #2a3a32',
                  borderRadius:'6px',
                  padding:     '5px 9px',
                  fontSize:    '10px',
                  color:       '#8a9b90',
                  whiteSpace:  'nowrap',
                  zIndex:      50,
                  pointerEvents:'none',
                  boxShadow:   '0 4px 12px rgba(0,0,0,0.4)',
                }}
              >
                {description}
                {/* Arrow */}
                <div
                  style={{
                    position:    'absolute',
                    top:         '-4px',
                    left:        '50%',
                    transform:   'translateX(-50%) rotate(45deg)',
                    width:       '7px',
                    height:      '7px',
                    background:  '#1a2420',
                    borderLeft:  '1px solid #2a3a32',
                    borderTop:   '1px solid #2a3a32',
                  }}
                />
              </motion.div>
            )}
          </div>
        )
      })}
    </div>
  )
}
