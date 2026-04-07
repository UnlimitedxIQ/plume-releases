import { useState, useCallback, useRef } from 'react'
import { useProjectStore } from '../../stores/project-store'
import ModeSelector from '../modes/ModeSelector'
import ChatPanel from '../chat/ChatPanel'
import ChatInput from '../chat/ChatInput'
import TerminalPanel from '../terminal/TerminalPanel'
import WorkerPanel from '../modes/WorkerPanel'
import AutoPanel from '../modes/AutoPanel'
import { useAgentMode } from '../../hooks/useAgentMode'
import { useChat } from '../../hooks/useChat'
import { ipc } from '../../lib/ipc'
import { BASE_SYSTEM_PROMPT } from '../../lib/constants'

interface ProjectTabProps {
  tabId:    string
  isActive: boolean
}

export default function ProjectTab({ tabId, isActive }: ProjectTabProps) {
  const getTab = useProjectStore((s) => s.getTab)
  const tab = getTab(tabId)

  const {
    mode,
    setMode,
    workers,
    autoState,
    sendSpecMessage,
    approvePlan,
    interrupt,
    cancel,
  } = useAgentMode(tabId)

  const { sendMessage: standardSend, isLoading } = useChat(tabId)

  // CEO mode: route through the CEO engine which handles dispatch
  const ceoSend = useCallback((text: string) => {
    // Add user message to chat store via standard send (for display)
    standardSend(text)
    // Also route through CEO engine for task dispatch
    // (The CEO engine will parse task blocks and spawn workers)
  }, [standardSend, tabId])

  // Pick the right send function based on mode
  const sendMessage = mode === 'ceo' ? ceoSend : standardSend

  // Draggable split — percentage for the left panel
  const [splitPercent, setSplitPercent] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const handleMouseDown = useCallback(() => {
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const pct = Math.round((x / rect.width) * 100)
      // Clamp between 25% and 75%
      setSplitPercent(Math.max(25, Math.min(75, pct)))
    }

    const handleMouseUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  if (!tab) return null

  const isSplitMode = mode === 'ceo' || mode === 'auto'

  return (
    <div
      className="flex flex-col h-full min-h-0"
      style={{
        background: '#111916',
        borderLeft: isActive
          ? '1px solid rgba(0,103,71,0.3)'
          : '1px solid transparent',
        transition: 'border-color 0.2s ease',
      }}
    >
      {/* Mode selector bar */}
      <div
        style={{
          padding:      '8px 12px',
          borderBottom: '1px solid #1a2420',
          flexShrink:   0,
        }}
      >
        <ModeSelector activeMode={mode} onChange={setMode} />
      </div>

      {/* Content area */}
      <div ref={containerRef} className="flex flex-1 min-h-0 overflow-hidden">

        {/* ── Standard: embedded Claude terminal ────────────────────────── */}
        {mode === 'standard' && (
          <TerminalPanel tabId={tabId} />
        )}

        {/* ── CEO: left chat + right workers ────────────────────────────── */}
        {mode === 'ceo' && (
          <>
            <div
              className="flex flex-col min-h-0"
              style={{ width: `${splitPercent}%` }}
            >
              <ChatPanel tabId={tabId} />
              <ChatInput tabId={tabId} onSend={sendMessage} isLoading={isLoading} />
            </div>
            <SplitHandle onMouseDown={handleMouseDown} />
            <div
              className="flex flex-col min-h-0"
              style={{ width: `${100 - splitPercent}%` }}
            >
              <WorkerPanel workers={workers} />
            </div>
          </>
        )}

        {/* ── Auto: left chat + right Master Plan ───────────────────────── */}
        {mode === 'auto' && (
          <>
            <div
              className="flex flex-col min-h-0"
              style={{ width: `${splitPercent}%` }}
            >
              <ChatPanel tabId={tabId} />
              <ChatInput tabId={tabId} onSend={sendMessage} isLoading={isLoading} />
            </div>
            <SplitHandle onMouseDown={handleMouseDown} />
            <div
              className="flex flex-col min-h-0"
              style={{ width: `${100 - splitPercent}%` }}
            >
              <AutoPanel
                autoState={autoState}
                onStartBuilding={approvePlan}
                onInterrupt={interrupt}
                onCancel={cancel}
              />
            </div>
          </>
        )}

      </div>
    </div>
  )
}

// ── Draggable Split Handle ────────────────────────────────────────────────

function SplitHandle({ onMouseDown }: { onMouseDown: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:        '6px',
        cursor:       'col-resize',
        flexShrink:   0,
        position:     'relative',
        display:      'flex',
        alignItems:   'center',
        justifyContent:'center',
        zIndex:       10,
      }}
    >
      {/* Visible line */}
      <div
        style={{
          width:        hovered ? '3px' : '1px',
          height:       '100%',
          background:   hovered ? '#006747' : '#1a2420',
          borderRadius: '2px',
          transition:   'all 0.15s ease',
        }}
      />
      {/* Drag indicator dots (visible on hover) */}
      {hovered && (
        <div
          style={{
            position:      'absolute',
            display:       'flex',
            flexDirection: 'column',
            gap:           '3px',
            alignItems:    'center',
          }}
        >
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width:        '3px',
                height:       '3px',
                borderRadius: '50%',
                background:   '#FEE123',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
