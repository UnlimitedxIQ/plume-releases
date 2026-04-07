import { Square, Columns2, Grid2x2, LayoutGrid } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import type { GridLayout } from '../../types/project'

interface LayoutOption {
  id:    GridLayout
  Icon:  React.ElementType
  label: string
}

const LAYOUT_OPTIONS: LayoutOption[] = [
  { id: 'single', Icon: Square,     label: 'Single' },
  { id: 'split',  Icon: Columns2,   label: 'Split'  },
  { id: 'quad',   Icon: Grid2x2,    label: 'Quad'   },
  { id: 'full',   Icon: LayoutGrid, label: 'Full'   },
]

export default function GridControls() {
  const { gridLayout, setGridLayout } = useProjectStore()

  return (
    <div
      className="flex items-center gap-0.5"
      style={{ padding: '0 4px' }}
    >
      {LAYOUT_OPTIONS.map(({ id, Icon, label }) => {
        const active = gridLayout === id
        return (
          <button
            key={id}
            onClick={() => setGridLayout(id)}
            title={label}
            style={{
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              width:         '26px',
              height:        '26px',
              borderRadius:  '5px',
              border:        'none',
              cursor:        'pointer',
              background:    active ? 'rgba(0, 103, 71, 0.25)' : 'transparent',
              color:         active ? '#FEE123' : '#5a6b60',
              transition:    'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.background = 'rgba(26,36,32,0.8)'
                e.currentTarget.style.color = '#8a9b90'
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#5a6b60'
              }
            }}
          >
            <Icon size={12} />
          </button>
        )
      })}
    </div>
  )
}
