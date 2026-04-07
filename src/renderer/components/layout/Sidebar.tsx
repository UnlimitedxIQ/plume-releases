import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  GraduationCap,
  BookOpen,
  Store,
  Pen,
  Lock,
  Settings,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  X,
  Code2,
  Brain,
  Palette,
  ClipboardCheck,
} from 'lucide-react'
import { useAppStore } from '../../stores/app-store'
import { useProjectStore } from '../../stores/project-store'
import type { ViewId } from '../../lib/constants'
import type { ProjectTypeId } from '../../lib/constants'

interface NavItem {
  id:    ViewId
  label: string
  Icon:  React.ElementType
}

const NAV_ITEMS: NavItem[] = [
  { id: 'chat',        label: 'Chat',          Icon: MessageSquare  },
  { id: 'canvas',      label: 'Canvas',        Icon: GraduationCap  },
  { id: 'teacher',     label: 'Teacher',       Icon: ClipboardCheck },
  { id: 'library',     label: 'Library',       Icon: BookOpen       },
  { id: 'marketplace', label: 'MarketPlace',   Icon: Store          },
  { id: 'style',       label: 'Writing Style', Icon: Pen            },
  { id: 'vault',       label: 'Vault',         Icon: Lock           },
  { id: 'settings',    label: 'Settings',      Icon: Settings       },
]

// Views that require instructor/TA enrollment to appear
const INSTRUCTOR_ONLY_VIEWS: ReadonlySet<ViewId> = new Set(['teacher'])

const PROJECT_ICONS: Record<ProjectTypeId, React.ElementType> = {
  research: BookOpen,
  coding:   Code2,
  writing:  Pen,
  canvas:   GraduationCap,
  study:    Brain,
  general:  MessageSquare,
}

export default function Sidebar() {
  const { currentView, setCurrentView, sidebarCollapsed, toggleSidebar, isInstructor } = useAppStore()

  const visibleNavItems = useMemo(
    () => NAV_ITEMS.filter(({ id }) => !INSTRUCTOR_ONLY_VIEWS.has(id) || isInstructor),
    [isInstructor]
  )

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 56 : 200 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col shrink-0 h-full overflow-hidden"
      style={{
        background:   '#0c1510',
        borderRight:  '1px solid #1a2420',
        position:     'relative',
        zIndex:       40,
      }}
    >
      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-0.5 pt-3 px-1.5 overflow-hidden">
        {visibleNavItems.map(({ id, label, Icon }) => {
          const active = currentView === id
          return (
            <button
              key={id}
              onClick={() => setCurrentView(id)}
              title={sidebarCollapsed ? label : undefined}
              style={{
                display:       'flex',
                alignItems:    'center',
                gap:           '10px',
                padding:       '8px 10px',
                borderRadius:  '8px',
                border:        'none',
                cursor:        'pointer',
                width:         '100%',
                textAlign:     'left',
                transition:    'all 0.15s ease',
                background:    active ? 'rgba(21, 71, 51, 0.35)' : 'transparent',
                borderLeft:    active ? '2px solid #006747' : '2px solid transparent',
                color:         active ? '#e8ede9' : '#5a6b60',
                whiteSpace:    'nowrap',
                overflow:      'hidden',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'rgba(26, 36, 32, 0.8)'
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
              <Icon
                size={16}
                style={{
                  color:     active ? '#FEE123' : 'currentColor',
                  flexShrink:0,
                  transition:'color 0.15s ease',
                }}
              />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      fontSize:     '13px',
                      fontWeight:   active ? 600 : 400,
                      overflow:     'hidden',
                      display:      'block',
                    }}
                  >
                    {label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          )
        })}
      </nav>

      {/* Parked Projects */}
      <ParkedProjects collapsed={sidebarCollapsed} />

      {/* Bottom: UO watermark + collapse toggle */}
      <div className="pb-3 px-1.5 flex flex-col gap-2">
        {/* Watermark "O" */}
        {!sidebarCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-2 py-1"
          >
            <span
              style={{
                fontSize:     '28px',
                fontWeight:   900,
                color:        'rgba(21, 71, 51, 0.4)',
                lineHeight:   1,
                display:      'block',
                userSelect:   'none',
              }}
            >
              O
            </span>
          </motion.div>
        )}

        {/* Collapse Toggle */}
        <button
          onClick={toggleSidebar}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            display:       'flex',
            alignItems:    'center',
            justifyContent:sidebarCollapsed ? 'center' : 'flex-start',
            gap:           '10px',
            padding:       '8px 10px',
            borderRadius:  '8px',
            border:        'none',
            cursor:        'pointer',
            background:    'transparent',
            color:         '#5a6b60',
            width:         '100%',
            transition:    'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(26, 36, 32, 0.8)'
            e.currentTarget.style.color = '#8a9b90'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#5a6b60'
          }}
        >
          {sidebarCollapsed
            ? <ChevronRight size={16} />
            : (
              <>
                <ChevronLeft size={16} style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>Collapse</span>
              </>
            )
          }
        </button>
      </div>
    </motion.aside>
  )
}

// ── Parked Projects Section ───────────────────────────────────────────────

function ParkedProjects({ collapsed }: { collapsed: boolean }) {
  const tabs = useProjectStore(s => s.tabs)
  const parkedTabs = useMemo(() => tabs.filter(t => t.parked), [tabs])
  const unparkTab = useProjectStore(s => s.unparkTab)
  const deleteTab = useProjectStore(s => s.deleteTab)
  const setCurrentView = useAppStore(s => s.setCurrentView)

  if (parkedTabs.length === 0) return null

  function handleOpen(tabId: string) {
    unparkTab(tabId)
    setCurrentView('chat')
  }

  return (
    <div style={{ borderTop: '1px solid #1a2420', padding: '8px 6px' }}>
      {!collapsed && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '4px 6px 6px', marginBottom: '2px',
        }}>
          <FolderOpen size={10} style={{ color: '#5a6b60' }} />
          <span style={{ fontSize: '9px', fontWeight: 700, color: '#5a6b60', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Projects
          </span>
          <span style={{
            fontSize: '8px', fontWeight: 700, color: '#154733',
            background: '#FEE123', borderRadius: '8px', padding: '0 5px', lineHeight: '1.5',
          }}>
            {parkedTabs.length}
          </span>
        </div>
      )}
      <AnimatePresence>
        {parkedTabs.map(tab => {
          const Icon = PROJECT_ICONS[tab.projectType] ?? MessageSquare
          return (
            <ParkedProjectItem
              key={tab.id}
              name={tab.name}
              icon={Icon}
              collapsed={collapsed}
              onOpen={() => handleOpen(tab.id)}
              onDelete={() => deleteTab(tab.id)}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}

function ParkedProjectItem({
  name,
  icon: Icon,
  collapsed,
  onOpen,
  onDelete,
}: {
  name: string
  icon: React.ElementType
  collapsed: boolean
  onOpen: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onOpen}
      title={collapsed ? name : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 8px',
        borderRadius: '6px',
        cursor: 'pointer',
        background: hovered ? 'rgba(26, 36, 32, 0.8)' : 'transparent',
        transition: 'all 0.15s ease',
      }}
    >
      <Icon size={13} style={{ color: '#5a6b60', flexShrink: 0 }} />
      {!collapsed && (
        <>
          <span style={{
            fontSize: '11px', color: '#8a9b90', flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {name}
          </span>
          {hovered && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete() }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '16px', height: '16px', borderRadius: '4px',
                border: 'none', background: 'rgba(239,68,68,0.15)',
                color: '#ef4444', cursor: 'pointer', padding: 0, flexShrink: 0,
              }}
            >
              <X size={9} />
            </button>
          )}
        </>
      )}
    </motion.div>
  )
}
