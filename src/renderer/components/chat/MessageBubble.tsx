import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import { Copy, Check } from 'lucide-react'
import type { Message } from '../../types/chat'
import { getMessageText } from '../../types/chat'
import ToolCallCard from './ToolCallCard'
import { relativeTime } from '../../lib/format'

interface MessageBubbleProps {
  message: Message
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const text   = getMessageText(message)

  return (
    <div
      style={{
        display:       'flex',
        flexDirection: 'column',
        alignItems:    isUser ? 'flex-end' : 'flex-start',
        gap:           '4px',
      }}
    >
      {/* Role label */}
      <div
        style={{
          fontSize:    '11px',
          color:       '#5a6b60',
          paddingLeft: isUser ? 0 : '4px',
          paddingRight:isUser ? '4px' : 0,
        }}
      >
        {isUser ? 'You' : 'Plume'}
        {' · '}
        {relativeTime(message.timestamp)}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth:    '85%',
          padding:     '11px 15px',
          borderRadius:isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
          background:  isUser
            ? 'linear-gradient(135deg, rgba(21,71,51,0.5), rgba(0,103,71,0.35))'
            : '#1a2420',
          border:      isUser ? '1px solid rgba(0,103,71,0.4)' : '1px solid #2a3a32',
          color:       '#e8ede9',
        }}
      >
        {isUser ? (
          <p
            className="selectable"
            style={{ fontSize: '14px', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}
          >
            {text}
          </p>
        ) : (
          <div className="prose-uo selectable">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeHighlight]}
              components={{
                code({ className, children, ...props }) {
                  const isBlock = /language-/.test(className ?? '')
                  if (!isBlock) {
                    return <code className={className} {...props}>{children}</code>
                  }
                  return (
                    <CodeBlock className={className ?? ''}>
                      {String(children).replace(/\n$/, '')}
                    </CodeBlock>
                  )
                },
              }}
            >
              {text}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* Tool calls */}
      {message.toolCalls && message.toolCalls.length > 0 && (
        <div
          style={{
            display:   'flex',
            flexDirection:'column',
            gap:       '6px',
            width:     '85%',
            alignSelf: 'flex-start',
          }}
        >
          {message.toolCalls.map((tc) => (
            <ToolCallCard key={tc.id} toolCall={tc} />
          ))}
        </div>
      )}

      {/* Error */}
      {message.error && (
        <div
          style={{
            padding:      '8px 12px',
            borderRadius: '8px',
            background:   'rgba(239,68,68,0.1)',
            border:       '1px solid rgba(239,68,68,0.25)',
            color:        '#ef4444',
            fontSize:     '12px',
            maxWidth:     '85%',
          }}
        >
          {message.error}
        </div>
      )}
    </div>
  )
}

// ── Code Block with copy button ────────────────────────────────────────────

function CodeBlock({ children, className }: { children: string; className: string }) {
  const [copied, setCopied] = useState(false)
  const lang = className.replace('language-', '') || 'code'

  async function handleCopy() {
    await navigator.clipboard.writeText(children)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        position:     'relative',
        margin:       '8px 0',
        borderRadius: '10px',
        overflow:     'hidden',
        border:       '1px solid #2a3a32',
      }}
    >
      {/* Header */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '6px 12px',
          background:     '#0d1a15',
          borderBottom:   '1px solid #1a2420',
        }}
      >
        <span style={{ fontSize: '11px', color: '#5a6b60', fontFamily: 'inherit' }}>
          {lang}
        </span>
        <button
          onClick={handleCopy}
          style={{
            display:       'flex',
            alignItems:    'center',
            gap:           '4px',
            background:    'transparent',
            border:        'none',
            cursor:        'pointer',
            color:         copied ? '#22c55e' : '#5a6b60',
            fontSize:      '11px',
            padding:       '2px 6px',
            borderRadius:  '4px',
            transition:    'color 0.15s ease',
          }}
          onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = '#8a9b90' }}
          onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = '#5a6b60' }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {/* Code */}
      <pre
        style={{
          margin:     0,
          padding:    '14px 16px',
          background: '#0d1a15',
          overflowX:  'auto',
          fontSize:   '13px',
          lineHeight: 1.6,
          fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
        }}
      >
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}
