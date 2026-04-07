import { motion } from 'framer-motion'
import { BookOpen, Code2, Pen, GraduationCap, Brain, MessageSquare } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { PROJECT_TYPES } from '../../lib/constants'
import type { ProjectTypeId } from '../../lib/constants'

const TYPE_ICONS: Record<ProjectTypeId, React.ElementType> = {
  research: BookOpen,
  coding:   Code2,
  writing:  Pen,
  canvas:   GraduationCap,
  study:    Brain,
  general:  MessageSquare,
}

interface NewProjectModalProps {
  onClose: () => void
}

export default function NewProjectModal({ onClose }: NewProjectModalProps) {
  const { addTab } = useProjectStore()

  function handleSelect(typeId: ProjectTypeId) {
    addTab(typeId)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex:     100,
        background: 'rgba(10, 15, 13, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 8 }}
        transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
        style={{
          background:   '#111916',
          border:       '1px solid #2a3a32',
          borderRadius: '16px',
          padding:      '28px',
          width:        '540px',
          maxWidth:     '95vw',
          boxShadow:    '0 32px 80px rgba(0,0,0,0.7)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6">
          <h2
            className="text-lg font-bold mb-1"
            style={{ color: '#e8ede9' }}
          >
            New Session
          </h2>
          <p style={{ color: '#5a6b60', fontSize: '13px' }}>
            Choose a session type to get started.
          </p>
        </div>

        {/* Project type grid */}
        <div
          style={{
            display:             'grid',
            gridTemplateColumns: '1fr 1fr',
            gap:                 '10px',
          }}
        >
          {(Object.values(PROJECT_TYPES) as typeof PROJECT_TYPES[ProjectTypeId][]).map((def) => {
            const Icon = TYPE_ICONS[def.id as ProjectTypeId]
            return (
              <TypeCard
                key={def.id}
                id={def.id as ProjectTypeId}
                label={def.label}
                description={def.description}
                color={def.color}
                Icon={Icon}
                onSelect={handleSelect}
              />
            )
          })}
        </div>

        {/* Cancel */}
        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border:     'none',
              color:      '#5a6b60',
              fontSize:   '13px',
              cursor:     'pointer',
              padding:    '4px 12px',
              borderRadius:'4px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#8a9b90' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#5a6b60' }}
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface TypeCardProps {
  id:          ProjectTypeId
  label:       string
  description: string
  color:       string
  Icon:        React.ElementType
  onSelect:    (id: ProjectTypeId) => void
}

function TypeCard({ id, label, description, color, Icon, onSelect }: TypeCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(id)}
      style={{
        display:       'flex',
        flexDirection: 'column',
        alignItems:    'flex-start',
        gap:           '10px',
        padding:       '16px',
        borderRadius:  '12px',
        border:        '1px solid #2a3a32',
        background:    '#0c1510',
        cursor:        'pointer',
        textAlign:     'left',
        transition:    'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.boxShadow = `0 0 20px ${color}22`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#2a3a32'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Icon badge */}
      <div
        style={{
          width:        '36px',
          height:       '36px',
          borderRadius: '8px',
          display:      'flex',
          alignItems:   'center',
          justifyContent:'center',
          background:   `${color}22`,
          color,
          flexShrink:   0,
        }}
      >
        <Icon size={18} />
      </div>

      {/* Text */}
      <div>
        <div
          style={{
            fontSize:   '13px',
            fontWeight: 600,
            color:      '#e8ede9',
            marginBottom:'4px',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: '12px',
            color:    '#5a6b60',
            lineHeight: 1.45,
          }}
        >
          {description}
        </div>
      </div>
    </motion.button>
  )
}
