import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, FileCode, ChevronDown, ChevronUp, Wrench } from 'lucide-react'
import { useAgentMode } from '../../hooks/useAgentMode'
import type { ExecutionLogEntry } from '../../types/agent'
import DiffViewer from './DiffViewer'

interface ExecutorPanelProps {
  tabId: string
}

export default function ExecutorPanel({ tabId }: ExecutorPanelProps) {
  const { executionLog } = useAgentMode(tabId)

  return (
    <div
      className="flex flex-col shrink-0"
      style={{
        width:       '280px',
        minWidth:    '220px',
        maxWidth:    '320px',
        background:  '#0a0f0d',
        borderLeft:  '1px solid #1a2420',
        height:      '100%',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding:      '10px 12px',
          borderBottom: '1px solid #1a2420',
          display:      'flex',
          alignItems:   'center',
          gap:          '8px',
          flexShrink:   0,
        }}
      >
        <Terminal size={13} style={{ color: '#006747' }} />
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#e8ede9' }}>
          Execution Log
        </h3>
        {executionLog.length > 0 && (
          <span
            style={{
              marginLeft:   'auto',
              fontSize:     '10px',
              color:        '#5a6b60',
              background:   '#1a2420',
              padding:      '1px 6px',
              borderRadius: '10px',
            }}
          >
            {executionLog.length}
          </span>
        )}
      </div>

      {/* Log entries */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: '6px' }}
      >
        {executionLog.length === 0 ? (
          <div
            className="flex items-center justify-center h-full"
            style={{ minHeight: '100px' }}
          >
            <p style={{ fontSize: '12px', color: '#5a6b60', textAlign: 'center' }}>
              Tool calls and outputs<br />will appear here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <AnimatePresence initial={false}>
              {executionLog.map((entry) => (
                <LogEntry key={entry.id} entry={entry} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

function LogEntry({ entry }: { entry: ExecutionLogEntry }) {
  const [expanded, setExpanded] = useState(false)

  const hasDiff    = Boolean(entry.diff)
  const hasContent = entry.content.length > 80 || hasDiff

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        background:   '#111916',
        border:       '1px solid #1a2420',
        borderRadius: '6px',
        overflow:     'hidden',
        fontSize:     '11px',
      }}
    >
      {/* Entry header */}
      <button
        onClick={() => hasContent && setExpanded((e) => !e)}
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         '6px',
          width:       '100%',
          padding:     '6px 8px',
          background:  'transparent',
          border:      'none',
          cursor:      hasContent ? 'pointer' : 'default',
          textAlign:   'left',
        }}
      >
        <EntryIcon entry={entry} />
        <span
          style={{
            flex:         1,
            color:        entry.isError ? '#ef4444' : '#8a9b90',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
            whiteSpace:   'nowrap',
            fontFamily:   entry.type === 'tool_call' || entry.type === 'tool_result'
              ? "'JetBrains Mono', monospace"
              : 'inherit',
          }}
        >
          {entry.toolName
            ? entry.toolName
            : entry.content.slice(0, 60) + (entry.content.length > 60 ? '…' : '')}
        </span>
        {hasContent && (
          <span style={{ color: '#5a6b60', flexShrink: 0 }}>
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
          </span>
        )}
      </button>

      {/* Expanded content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.15 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px solid #1a2420' }}>
              {hasDiff ? (
                <DiffViewer
                  diff={entry.diff!}
                  filePath={entry.filePath}
                />
              ) : (
                <pre
                  style={{
                    padding:    '8px',
                    margin:     0,
                    background: '#0a0f0d',
                    color:      entry.isError ? '#ef4444' : '#8a9b90',
                    fontSize:   '11px',
                    fontFamily: "'JetBrains Mono', monospace",
                    overflowX:  'auto',
                    lineHeight: 1.5,
                    maxHeight:  '200px',
                    overflowY:  'auto',
                  }}
                >
                  {entry.content}
                </pre>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function EntryIcon({ entry }: { entry: ExecutionLogEntry }) {
  const color = entry.isError ? '#ef4444' : entry.type === 'tool_result' ? '#22c55e' : '#5a6b60'

  switch (entry.type) {
    case 'tool_call':
    case 'tool_result':
      return <Wrench size={10} style={{ color, flexShrink: 0 }} />
    case 'step':
      return (
        <div
          style={{
            width:        '8px',
            height:       '8px',
            borderRadius: '50%',
            background:   '#FEE123',
            flexShrink:   0,
          }}
        />
      )
    case 'error':
      return <span style={{ color: '#ef4444', flexShrink: 0, fontSize: '10px' }}>!</span>
    default:
      return <FileCode size={10} style={{ color: '#5a6b60', flexShrink: 0 }} />
  }
}
