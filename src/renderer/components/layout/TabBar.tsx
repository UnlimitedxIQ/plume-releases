import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, BookOpen, Code2, Pen, GraduationCap, Brain, MessageSquare } from 'lucide-react'
import { useProjectStore } from '../../stores/project-store'
import { PROJECT_TYPES, BASE_SYSTEM_PROMPT } from '../../lib/constants'
import { ipc } from '../../lib/ipc'
import type { ProjectTypeId } from '../../lib/constants'
import GridControls from '../workspace/GridControls'

const TYPE_ICONS: Record<ProjectTypeId, React.ElementType> = {
  research: BookOpen,
  coding:   Code2,
  writing:  Pen,
  canvas:   GraduationCap,
  study:    Brain,
  general:  MessageSquare,
}

export default function TabBar() {
  const { tabs: allTabs, activeTabId, setActiveTab, removeTab, addTab, updateTab } = useProjectStore()
  const tabs = allTabs.filter(t => !t.parked)
  const [hoveredTabId, setHoveredTabId] = useState<string | null>(null)
  const [renamingTabId, setRenamingTabId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const renameInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (renamingTabId && renameInputRef.current) {
      renameInputRef.current.focus()
      renameInputRef.current.select()
    }
  }, [renamingTabId])

  function handleClose(e: React.MouseEvent, tabId: string) {
    e.stopPropagation()
    removeTab(tabId)
    // Park the terminal session — keeps session ID for --resume on reopen
    const api = (window as unknown as { api: Record<string, (...a: unknown[]) => void> }).api
    if (api.terminalPark) api.terminalPark(tabId)
  }

  function startRename(e: React.MouseEvent, tabId: string, currentName: string) {
    e.stopPropagation()
    setRenamingTabId(tabId)
    setRenameValue(currentName)
  }

  function commitRename() {
    if (renamingTabId) {
      const trimmed = renameValue.trim()
      if (trimmed) {
        updateTab(renamingTabId, { name: trimmed })
      }
      setRenamingTabId(null)
    }
  }

  function cancelRename() {
    setRenamingTabId(null)
  }

  function handleRenameKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      commitRename()
    } else if (e.key === 'Escape') {
      cancelRename()
    }
  }

  function handleAddTab() {
    const tabId = addTab('general', 'New Chat')
    // Start a headless Claude CLI process for this tab immediately
    ipc.providerStartSession({ tabId, systemPrompt: BASE_SYSTEM_PROMPT })
  }

  return (
    <>
      <div
        className="flex items-center shrink-0"
        style={{
          background:   '#0c1510',
          borderBottom: '1px solid #1a2420',
          height:       '40px',
          paddingLeft:  '8px',
          paddingRight: '8px',
          gap:          '2px',
          overflowX:    'auto',
          overflowY:    'hidden',
          scrollbarWidth: 'none',
        }}
      >
        {/* Tab list */}
        <div className="flex items-center flex-1 min-w-0 gap-0.5">
          <AnimatePresence initial={false}>
            {tabs.map((tab) => {
              const Icon = TYPE_ICONS[tab.projectType] ?? MessageSquare
              const active = tab.id === activeTabId
              const hovered = hoveredTabId === tab.id
              const typeColor = PROJECT_TYPES[tab.projectType]?.color ?? '#8a9b90'

              return (
                <motion.div
                  key={tab.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9, x: -8 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.85, x: -8 }}
                  transition={{ duration: 0.15 }}
                  onClick={() => setActiveTab(tab.id)}
                  onMouseEnter={() => setHoveredTabId(tab.id)}
                  onMouseLeave={() => setHoveredTabId(null)}
                  role="tab"
                  style={{
                    display:       'flex',
                    alignItems:    'center',
                    gap:           '6px',
                    padding:       '0 10px',
                    height:        '32px',
                    borderRadius:  '6px 6px 0 0',
                    cursor:        'pointer',
                    maxWidth:      '160px',
                    minWidth:      '80px',
                    flexShrink:    0,
                    position:      'relative',
                    transition:    'all 0.15s ease',
                    background:    active
                      ? '#111916'
                      : hovered
                        ? 'rgba(26, 36, 32, 0.6)'
                        : 'transparent',
                    borderBottom:  active ? `2px solid ${typeColor}` : '2px solid transparent',
                    color:         active ? '#e8ede9' : '#5a6b60',
                  }}
                >
                  <Icon
                    size={12}
                    style={{
                      flexShrink: 0,
                      color: active ? typeColor : 'currentColor',
                    }}
                  />
                  {renamingTabId === tab.id ? (
                    <input
                      ref={renameInputRef}
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={handleRenameKeyDown}
                      onBlur={commitRename}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        flex:       1,
                        fontSize:   '12px',
                        fontWeight: 600,
                        background: 'rgba(0,103,71,0.15)',
                        border:     '1px solid #006747',
                        borderRadius: '3px',
                        color:      '#e8ede9',
                        outline:    'none',
                        padding:    '0 3px',
                        minWidth:   0,
                        height:     '20px',
                        fontFamily: 'inherit',
                      }}
                    />
                  ) : (
                    <span
                      title="Click to rename"
                      onClick={(e) => startRename(e, tab.id, tab.name)}
                      style={{
                        fontSize:     '12px',
                        fontWeight:   active ? 600 : 400,
                        overflow:     'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace:   'nowrap',
                        flex:         1,
                        cursor:       'text',
                      }}
                    >
                      {tab.name}
                    </span>
                  )}

                  {/* Close button (show on hover or when active) */}
                  {(hovered || active) && (
                    <button
                      onClick={(e) => handleClose(e, tab.id)}
                      style={{
                        display:       'flex',
                        alignItems:    'center',
                        justifyContent:'center',
                        width:         '16px',
                        height:        '16px',
                        borderRadius:  '3px',
                        border:        'none',
                        cursor:        'pointer',
                        background:    'transparent',
                        color:         '#5a6b60',
                        flexShrink:    0,
                        padding:       0,
                        transition:    'all 0.1s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.2)'
                        e.currentTarget.style.color = '#ef4444'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = '#5a6b60'
                      }}
                    >
                      <X size={10} />
                    </button>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Add new tab */}
          <button
            onClick={handleAddTab}
            title="New chat"
            style={{
              display:       'flex',
              alignItems:    'center',
              justifyContent:'center',
              width:         '28px',
              height:        '28px',
              borderRadius:  '6px',
              border:        'none',
              cursor:        'pointer',
              background:    'transparent',
              color:         '#5a6b60',
              flexShrink:    0,
              transition:    'all 0.15s ease',
              marginLeft:    '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(26, 36, 32, 0.8)'
              e.currentTarget.style.color = '#FEE123'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#5a6b60'
            }}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Right: Grid controls */}
        <div className="shrink-0 pl-2 border-l" style={{ borderColor: '#1a2420' }}>
          <GridControls />
        </div>
      </div>

    </>
  )
}
