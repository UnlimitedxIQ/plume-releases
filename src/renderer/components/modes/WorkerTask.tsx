import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wrench,
  CheckCircle,
  XCircle,
  MessageSquare,
  AlertTriangle,
  FileCode,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { WorkerTask as WorkerTaskType, WorkerLogEntry, WorkerType } from '../../types/agent'
import { WORKERS } from '../../lib/constants'
import DiffViewer from './DiffViewer'

interface WorkerTaskProps {
  task:       WorkerTaskType
  workerType: WorkerType
}

const MAX_PREVIEW = 120

export default function WorkerTask({ task, workerType }: WorkerTaskProps) {
  const [expandedDiff, setExpandedDiff] = useState<string | null>(null)
  const workerColor = WORKERS[workerType].color

  const logRef = (el: HTMLDivElement | null) => {
    if (el) el.scrollTop = el.scrollHeight
  }

  return (
    <div
      style={{
        background:   '#0e1612',
        border:       `1px solid ${workerColor}30`,
        borderRadius: '8px',
        overflow:     'hidden',
      }}
    >
      {/* Task header */}
      <div
        style={{
          padding:        '10px 12px',
          borderBottom:   `1px solid ${workerColor}20`,
          display:        'flex',
          alignItems:     'center',
          gap:            '8px',
          background:     `${workerColor}08`,
        }}
      >
        {/* Status indicator */}
        <StatusDot task={task} workerColor={workerColor} />

        <span
          style={{
            flex:       1,
            fontSize:   '12px',
            fontWeight: 600,
            color:      '#e8ede9',
            lineHeight: 1.3,
          }}
        >
          {task.title}
        </span>

        {task.status === 'done' && (
          <CheckCircle size={14} style={{ color: workerColor, flexShrink: 0 }} />
        )}
        {task.status === 'error' && (
          <XCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
        )}
      </div>

      {/* Progress bar */}
      {(task.status === 'active' || task.status === 'done') && (
        <div
          style={{
            height:     '2px',
            background: '#1a2420',
          }}
        >
          <motion.div
            animate={{ width: `${task.progress}%` }}
            transition={{ ease: 'easeOut', duration: 0.4 }}
            style={{
              height:     '100%',
              background: workerColor,
            }}
          />
        </div>
      )}

      {/* Activity log */}
      {task.activityLog.length > 0 && (
        <div
          ref={logRef}
          style={{
            maxHeight: '220px',
            overflowY: 'auto',
            padding:   '8px 0',
          }}
        >
          {task.activityLog.map((entry) => (
            <LogEntryRow
              key={entry.id}
              entry={entry}
              workerColor={workerColor}
              expandedDiff={expandedDiff}
              onToggleDiff={(id) =>
                setExpandedDiff((prev) => (prev === id ? null : id))
              }
            />
          ))}
        </div>
      )}

      {/* Error message */}
      {task.status === 'error' && task.error && (
        <div
          style={{
            padding:    '8px 12px',
            borderTop:  '1px solid rgba(239,68,68,0.2)',
            color:      '#fca5a5',
            fontSize:   '11px',
            background: 'rgba(239,68,68,0.05)',
          }}
        >
          {task.error}
        </div>
      )}

      {/* Done result summary */}
      {task.status === 'done' && task.result && (
        <div
          style={{
            padding:    '8px 12px',
            borderTop:  `1px solid ${workerColor}20`,
            color:      '#8a9b90',
            fontSize:   '11px',
          }}
        >
          {task.result.length > MAX_PREVIEW
            ? `${task.result.slice(0, MAX_PREVIEW)}…`
            : task.result}
        </div>
      )}
    </div>
  )
}

// ── Status dot ─────────────────────────────────────────────────────────────

function StatusDot({
  task,
  workerColor,
}: {
  task: WorkerTaskType
  workerColor: string
}) {
  if (task.status === 'active') {
    return (
      <motion.div
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
        style={{
          width:        '7px',
          height:       '7px',
          borderRadius: '50%',
          background:   workerColor,
          flexShrink:   0,
        }}
      />
    )
  }
  if (task.status === 'done') {
    return (
      <div
        style={{
          width:        '7px',
          height:       '7px',
          borderRadius: '50%',
          background:   workerColor,
          flexShrink:   0,
        }}
      />
    )
  }
  if (task.status === 'error') {
    return (
      <div
        style={{
          width:        '7px',
          height:       '7px',
          borderRadius: '50%',
          background:   '#ef4444',
          flexShrink:   0,
        }}
      />
    )
  }
  return (
    <div
      style={{
        width:        '7px',
        height:       '7px',
        borderRadius: '50%',
        background:   '#2a3a32',
        flexShrink:   0,
      }}
    />
  )
}

// ── Log entry row ──────────────────────────────────────────────────────────

function LogEntryRow({
  entry,
  workerColor,
  expandedDiff,
  onToggleDiff,
}: {
  entry:        WorkerLogEntry
  workerColor:  string
  expandedDiff: string | null
  onToggleDiff: (id: string) => void
}) {
  const isDiffOpen = expandedDiff === entry.id

  const icon = (() => {
    switch (entry.type) {
      case 'tool_call':   return <Wrench size={11}        style={{ color: workerColor }} />
      case 'tool_result': return entry.isError
        ? <XCircle size={11}      style={{ color: '#ef4444' }} />
        : <CheckCircle size={11}  style={{ color: '#22c55e' }} />
      case 'text':        return <MessageSquare size={11} style={{ color: '#8a9b90' }} />
      case 'error':       return <AlertTriangle size={11} style={{ color: '#f59e0b' }} />
      case 'file_diff':   return <FileCode size={11}      style={{ color: '#60a5fa' }} />
    }
  })()

  const label = (() => {
    switch (entry.type) {
      case 'tool_call':
        return `${entry.toolName ?? 'tool'} — Running…`
      case 'tool_result':
        return entry.isError
          ? truncate(entry.content, 80)
          : truncate(entry.content, 80)
      case 'text':
        return truncate(entry.content, 90)
      case 'error':
        return truncate(entry.content, 90)
      case 'file_diff':
        return entry.filePath ?? 'file'
    }
  })()

  return (
    <div>
      <button
        onClick={entry.type === 'file_diff' ? () => onToggleDiff(entry.id) : undefined}
        style={{
          display:        'flex',
          alignItems:     'flex-start',
          gap:            '7px',
          padding:        '4px 12px',
          width:          '100%',
          background:     'transparent',
          border:         'none',
          cursor:         entry.type === 'file_diff' ? 'pointer' : 'default',
          textAlign:      'left',
        }}
      >
        <span style={{ flexShrink: 0, marginTop: '1px' }}>{icon}</span>
        <span
          style={{
            flex:      1,
            fontSize:  '10px',
            color:     '#5a6b60',
            lineHeight: 1.4,
            fontFamily: entry.type === 'tool_call' || entry.type === 'file_diff'
              ? "'JetBrains Mono', monospace"
              : 'inherit',
          }}
        >
          {label}
        </span>
        {entry.type === 'file_diff' && (
          isDiffOpen
            ? <ChevronUp size={10} style={{ color: '#5a6b60', flexShrink: 0 }} />
            : <ChevronDown size={10} style={{ color: '#5a6b60', flexShrink: 0 }} />
        )}
      </button>

      {/* Expandable diff */}
      <AnimatePresence>
        {entry.type === 'file_diff' && isDiffOpen && entry.diff && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ margin: '0 12px 6px', borderRadius: '6px', overflow: 'hidden' }}>
              <DiffViewer diff={entry.diff} filePath={entry.filePath} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function truncate(str: string, max: number): string {
  return str.length > max ? `${str.slice(0, max)}…` : str
}
