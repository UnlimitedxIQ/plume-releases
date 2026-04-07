import { useState, useRef, useEffect, useCallback } from 'react'
import { Paperclip, Send, X, FileText } from 'lucide-react'
import { ipc } from '../../lib/ipc'
import type { PickedFile } from '../../lib/ipc'
import { formatFileSize } from '../../lib/format'

interface ChatInputProps {
  tabId:     string
  onSend:    (text: string, attachments: PickedFile[]) => void
  isLoading: boolean
}

export default function ChatInput({ tabId: _tabId, onSend, isLoading }: ChatInputProps) {
  const [text,        setText]        = useState('')
  const [attachments, setAttachments] = useState<PickedFile[]>([])
  const [focused,     setFocused]     = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [text])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
    // Shift+Enter: allow default behavior (newline insertion)
  }

  const submit = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return
    onSend(trimmed, attachments)
    setText('')
    setAttachments([])
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, attachments, isLoading, onSend])

  async function handlePickFiles() {
    try {
      const files = await ipc.pickFiles()
      setAttachments((prev) => {
        const existing = new Set(prev.map((f) => f.path))
        const newFiles = files.filter((f) => !existing.has(f.path))
        return [...prev, ...newFiles]
      })
    } catch {
      // User cancelled or error — silently ignore
    }
  }

  function removeAttachment(path: string) {
    setAttachments((prev) => prev.filter((f) => f.path !== path))
  }

  const canSend = text.trim().length > 0 && !isLoading

  return (
    <div
      style={{
        padding:     '10px 16px 14px',
        borderTop:   '1px solid #1a2420',
        background:  '#0c1510',
        flexShrink:  0,
      }}
    >
      {/* Attachment chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {attachments.map((file) => (
            <div
              key={file.path}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '5px',
                padding:      '3px 8px 3px 6px',
                borderRadius: '6px',
                background:   '#1a2420',
                border:       '1px solid #2a3a32',
                fontSize:     '11px',
                color:        '#8a9b90',
              }}
            >
              <FileText size={11} style={{ color: '#006747', flexShrink: 0 }} />
              <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {file.name}
              </span>
              <span style={{ color: '#5a6b60' }}>{formatFileSize(file.size)}</span>
              <button
                onClick={() => removeAttachment(file.path)}
                style={{
                  background:    'transparent',
                  border:        'none',
                  cursor:        'pointer',
                  color:         '#5a6b60',
                  padding:       0,
                  display:       'flex',
                  alignItems:    'center',
                  flexShrink:    0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = '#5a6b60' }}
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        style={{
          display:      'flex',
          alignItems:   'flex-end',
          gap:          '8px',
          background:   '#111916',
          border:       `1px solid ${focused ? '#006747' : '#2a3a32'}`,
          borderRadius: '12px',
          padding:      '8px 10px',
          transition:   'border-color 0.2s ease, box-shadow 0.2s ease',
          boxShadow:    focused ? '0 0 0 3px rgba(0,103,71,0.12)' : 'none',
        }}
      >
        {/* File attach */}
        <button
          onClick={handlePickFiles}
          disabled={isLoading}
          title="Attach files"
          style={{
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            width:         '30px',
            height:        '30px',
            borderRadius:  '6px',
            border:        'none',
            background:    'transparent',
            cursor:        isLoading ? 'not-allowed' : 'pointer',
            color:         isLoading ? '#2a3a32' : '#5a6b60',
            flexShrink:    0,
            transition:    'color 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (!isLoading) e.currentTarget.style.color = '#8a9b90'
          }}
          onMouseLeave={(e) => {
            if (!isLoading) e.currentTarget.style.color = '#5a6b60'
          }}
        >
          <Paperclip size={15} />
        </button>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={isLoading}
          placeholder={isLoading ? 'Generating…' : 'Message Plume  (Enter to send, Shift+Enter for newline)'}
          rows={1}
          className="selectable"
          style={{
            flex:       1,
            background: 'transparent',
            border:     'none',
            outline:    'none',
            resize:     'none',
            color:      isLoading ? '#5a6b60' : '#e8ede9',
            fontSize:   '14px',
            lineHeight: '1.5',
            minHeight:  '30px',
            maxHeight:  '200px',
            padding:    '3px 0',
            fontFamily: 'inherit',
            cursor:     isLoading ? 'not-allowed' : 'text',
          }}
        />

        {/* Send button */}
        <button
          onClick={submit}
          disabled={!canSend}
          title="Send (Ctrl+Enter)"
          style={{
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            width:         '30px',
            height:        '30px',
            borderRadius:  '7px',
            border:        'none',
            cursor:        canSend ? 'pointer' : 'not-allowed',
            background:    canSend ? '#154733' : '#1a2420',
            color:         canSend ? '#FEE123' : '#2a3a32',
            flexShrink:    0,
            transition:    'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (canSend) {
              e.currentTarget.style.background = '#006747'
              e.currentTarget.style.boxShadow = '0 0 12px rgba(0,103,71,0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (canSend) {
              e.currentTarget.style.background = '#154733'
              e.currentTarget.style.boxShadow = 'none'
            }
          }}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  )
}
