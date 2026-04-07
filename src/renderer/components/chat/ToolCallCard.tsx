import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wrench, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from 'lucide-react'
import type { ToolCall, ToolCallStatus } from '../../types/chat'

interface ToolCallCardProps {
  toolCall: ToolCall
}

const STATUS_CONFIG: Record<ToolCallStatus, {
  label:    string
  color:    string
  bgColor:  string
  Icon:     React.ElementType
}> = {
  pending: {
    label:   'Pending',
    color:   '#8a9b90',
    bgColor: 'rgba(138,155,144,0.1)',
    Icon:    Clock,
  },
  running: {
    label:   'Running',
    color:   '#FEE123',
    bgColor: 'rgba(254,225,35,0.1)',
    Icon:    Clock,
  },
  success: {
    label:   'Done',
    color:   '#22c55e',
    bgColor: 'rgba(34,197,94,0.1)',
    Icon:    CheckCircle,
  },
  error: {
    label:   'Error',
    color:   '#ef4444',
    bgColor: 'rgba(239,68,68,0.1)',
    Icon:    XCircle,
  },
}

export default function ToolCallCard({ toolCall }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false)
  const config = STATUS_CONFIG[toolCall.status]
  const { label, color, bgColor, Icon } = config

  const inputStr  = JSON.stringify(toolCall.input, null, 2)
  const outputStr = toolCall.output ?? ''

  return (
    <div
      style={{
        background:   '#111916',
        border:       `1px solid ${color}33`,
        borderRadius: '8px',
        overflow:     'hidden',
        fontSize:     '12px',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            '8px',
          width:          '100%',
          padding:        '8px 12px',
          background:     bgColor,
          border:         'none',
          cursor:         'pointer',
          textAlign:      'left',
        }}
      >
        <Wrench size={12} style={{ color, flexShrink: 0 }} />
        <span
          style={{
            flex:         1,
            fontWeight:   600,
            color:        '#e8ede9',
            fontFamily:   "'JetBrains Mono', monospace",
          }}
        >
          {toolCall.name}
        </span>
        <div
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '4px',
            color,
            flexShrink:   0,
          }}
        >
          <Icon size={11} />
          <span>{label}</span>
        </div>
        <div style={{ color: '#5a6b60', marginLeft: '4px', flexShrink: 0 }}>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '10px 12px', borderTop: '1px solid #1a2420' }}>
              {/* Input */}
              {inputStr && inputStr !== '{}' && (
                <div className="mb-3">
                  <div
                    style={{
                      fontSize:    '10px',
                      fontWeight:  600,
                      color:       '#5a6b60',
                      marginBottom:'4px',
                      letterSpacing:'0.05em',
                      textTransform:'uppercase',
                    }}
                  >
                    Input
                  </div>
                  <pre
                    style={{
                      background:  '#0d1a15',
                      border:      '1px solid #1a2420',
                      borderRadius:'6px',
                      padding:     '8px',
                      color:       '#8a9b90',
                      fontSize:    '11px',
                      fontFamily:  "'JetBrains Mono', monospace",
                      overflowX:   'auto',
                      margin:      0,
                      lineHeight:  1.5,
                    }}
                  >
                    {inputStr}
                  </pre>
                </div>
              )}

              {/* Output */}
              {outputStr && (
                <div>
                  <div
                    style={{
                      fontSize:    '10px',
                      fontWeight:  600,
                      color:       '#5a6b60',
                      marginBottom:'4px',
                      letterSpacing:'0.05em',
                      textTransform:'uppercase',
                    }}
                  >
                    Output
                  </div>
                  <pre
                    style={{
                      background:  '#0d1a15',
                      border:      `1px solid ${toolCall.isError ? '#7f1d1d' : '#1a2420'}`,
                      borderRadius:'6px',
                      padding:     '8px',
                      color:       toolCall.isError ? '#ef4444' : '#8a9b90',
                      fontSize:    '11px',
                      fontFamily:  "'JetBrains Mono', monospace",
                      overflowX:   'auto',
                      margin:      0,
                      lineHeight:  1.5,
                      maxHeight:   '200px',
                      overflowY:   'auto',
                    }}
                  >
                    {outputStr}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
