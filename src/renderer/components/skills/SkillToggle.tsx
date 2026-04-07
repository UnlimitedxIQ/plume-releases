import { motion } from 'framer-motion'

interface SkillToggleProps {
  enabled:  boolean
  onChange: () => void
  size?:    'sm' | 'md'
}

export default function SkillToggle({ enabled, onChange, size = 'sm' }: SkillToggleProps) {
  const trackW  = size === 'sm' ? 32 : 40
  const trackH  = size === 'sm' ? 18 : 22
  const dotSize = size === 'sm' ? 12 : 16
  const travel  = trackW - dotSize - (trackH - dotSize)

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      role="switch"
      aria-checked={enabled}
      style={{
        position:      'relative',
        width:         `${trackW}px`,
        height:        `${trackH}px`,
        borderRadius:  '9999px',
        border:        'none',
        cursor:        'pointer',
        padding:       0,
        background:    enabled
          ? 'linear-gradient(135deg, #154733, #006747)'
          : '#2a3a32',
        transition:    'background 0.25s ease',
        flexShrink:    0,
        boxShadow:     enabled ? '0 0 8px rgba(0,103,71,0.4)' : 'none',
      }}
    >
      <motion.div
        animate={{ x: enabled ? travel : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position:      'absolute',
          top:           `${(trackH - dotSize) / 2}px`,
          width:         `${dotSize}px`,
          height:        `${dotSize}px`,
          borderRadius:  '50%',
          background:    enabled ? '#FEE123' : '#5a6b60',
          boxShadow:     '0 1px 3px rgba(0,0,0,0.4)',
        }}
      />
    </button>
  )
}
