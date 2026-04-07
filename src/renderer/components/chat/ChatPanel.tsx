import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useChatStore } from '../../stores/chat-store'
import { getMessageText } from '../../types/chat'
import MessageBubble from './MessageBubble'
import StreamingText from './StreamingText'

interface ChatPanelProps {
  tabId: string
}

export default function ChatPanel({ tabId }: ChatPanelProps) {
  const messages      = useChatStore((s) => s.messages[tabId]) ?? []
  const isLoading     = useChatStore((s) => s.loading[tabId]) ?? false
  const streamingText = useChatStore((s) => s.streamingText[tabId]) ?? ''
  const scrollRef     = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new content
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [messages.length, streamingText])

  const isEmpty = messages.length === 0 && !isLoading

  return (
    <div
      ref={scrollRef}
      className="flex-1 min-h-0 overflow-y-auto selectable"
      style={{ padding: '16px 20px' }}
    >
      {isEmpty ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-4 max-w-3xl mx-auto">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              // Skip streaming message placeholder (it's rendered below)
              if (msg.streaming && getMessageText(msg) === '') return null
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MessageBubble message={msg} />
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Streaming text */}
          {isLoading && streamingText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div
                style={{
                  padding:      '12px 16px',
                  borderRadius: '12px',
                  background:   '#1a2420',
                  border:       '1px solid #2a3a32',
                  maxWidth:     '85%',
                  alignSelf:    'flex-start',
                }}
              >
                <StreamingText text={streamingText} />
              </div>
            </motion.div>
          )}

          {/* Loading indicator (no text yet) */}
          {isLoading && !streamingText && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2"
            >
              <ThinkingDots />
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-5"
      style={{ minHeight: '200px' }}
    >
      {/* Duck emoji placeholder for UO duck icon */}
      <div
        style={{
          fontSize:   '48px',
          lineHeight: 1,
          filter:     'drop-shadow(0 0 20px rgba(254,225,35,0.3))',
        }}
      >
        🦆
      </div>
      <div className="text-center">
        <p
          style={{
            fontSize:   '15px',
            fontWeight: 600,
            color:      '#8a9b90',
            marginBottom:'6px',
          }}
        >
          Start a conversation
        </p>
        <p style={{ fontSize: '13px', color: '#5a6b60' }}>
          Ask anything — assignments, concepts, code, writing help.
        </p>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2 justify-center max-w-sm">
        {[
          'Explain this concept',
          'Help me outline a paper',
          'Debug my code',
          'Summarize this article',
        ].map((s) => (
          <div
            key={s}
            style={{
              padding:      '5px 12px',
              borderRadius: '20px',
              border:       '1px solid #2a3a32',
              color:        '#5a6b60',
              fontSize:     '12px',
              background:   'transparent',
            }}
          >
            {s}
          </div>
        ))}
      </div>
    </div>
  )
}

function ThinkingDots() {
  return (
    <div
      style={{
        padding:      '12px 16px',
        borderRadius: '12px',
        background:   '#1a2420',
        border:       '1px solid #2a3a32',
        display:      'flex',
        gap:          '5px',
        alignItems:   'center',
      }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{
            duration: 1.2,
            repeat:   Infinity,
            delay:    i * 0.2,
          }}
          style={{
            width:        '6px',
            height:       '6px',
            borderRadius: '50%',
            background:   '#006747',
            display:      'block',
          }}
        />
      ))}
    </div>
  )
}
