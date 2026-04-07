import { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import { BASE_SYSTEM_PROMPT } from '../../lib/constants'

interface TerminalPanelProps {
  tabId: string
}

const PLUME_THEME = {
  background:  '#0a0f0d',
  foreground:  '#e8ede9',
  cursor:      '#FEE123',
  cursorAccent:'#0a0f0d',
  selectionBackground: 'rgba(0, 103, 71, 0.3)',
  selectionForeground: '#e8ede9',
  black:       '#0a0f0d',
  red:         '#ef4444',
  green:       '#22c55e',
  yellow:      '#FEE123',
  blue:        '#3b82f6',
  magenta:     '#a855f7',
  cyan:        '#06b6d4',
  white:       '#e8ede9',
  brightBlack: '#5a6b60',
  brightRed:   '#f87171',
  brightGreen: '#4ade80',
  brightYellow:'#FEF08A',
  brightBlue:  '#60a5fa',
  brightMagenta:'#c084fc',
  brightCyan:  '#22d3ee',
  brightWhite: '#ffffff',
}

export default function TerminalPanel({ tabId }: TerminalPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitRef = useRef<FitAddon | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!containerRef.current) return
    // If terminal already exists for this mount, skip
    if (termRef.current) return

    const api = (window as unknown as { api: Record<string, (...args: unknown[]) => unknown> }).api

    const term = new Terminal({
      theme: PLUME_THEME,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      cursorStyle: 'bar',
      scrollback: 10000,
      convertEol: true,
      cols: 80,
    })

    const fit = new FitAddon()
    term.loadAddon(fit)
    term.open(containerRef.current)
    // Only fit rows to container height, keep cols at 80 to match conhost
    const dims = fit.proposeDimensions()
    if (dims) {
      term.resize(80, dims.rows)
    }

    termRef.current = term
    fitRef.current = fit

    // Relay keystrokes to main process
    term.onData((data: string) => {
      api.terminalWrite({ tabId, data })
    })

    // Receive live output from main process
    const unsubData = api.onTerminalData(tabId, (data: string) => {
      setLoading(false)
      term.write(data)
    }) as () => void

    const unsubExit = api.onTerminalExit(tabId, (info: { code: number }) => {
      setLoading(false)
      term.write(`\r\n\x1b[33m[Session ended with code ${info.code}]\x1b[0m\r\n`)
    }) as () => void

    // Check if session already exists — if so, replay buffer
    // If not, start a new one with the measured terminal dimensions
    ;(async () => {
      const hasSession = await api.terminalHasSession(tabId) as boolean
      if (hasSession) {
        const buffer = await api.terminalGetBuffer(tabId) as string
        if (buffer) {
          term.write(buffer)
        }
        setLoading(false)
      } else {
        // Measure actual terminal dimensions from xterm.js
        const dims = fit.proposeDimensions()
        const cols = dims?.cols ?? 120
        const rows = dims?.rows ?? 30
        api.terminalStart({ tabId, systemPrompt: BASE_SYSTEM_PROMPT, cols, rows })
      }
    })()

    // Handle resize — only adjust rows, keep cols at 80
    const observer = new ResizeObserver(() => {
      const dims = fit.proposeDimensions()
      if (dims) {
        term.resize(80, dims.rows)
      }
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      unsubData()
      unsubExit()
      term.dispose()
      termRef.current = null
      fitRef.current = null
    }
  }, [tabId])

  return (
    <div style={{ flex: 1, minHeight: 0, position: 'relative', background: '#0a0f0d' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#0a0f0d',
        }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            background: 'linear-gradient(135deg, #154733, #006747)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FEE123', fontSize: '22px', fontWeight: 900,
            marginBottom: '16px',
          }}>
            P
          </div>
          <LoadingDots />
          <p style={{ fontSize: '12px', color: '#5a6b60', marginTop: '12px' }}>
            Starting Claude...
          </p>
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          width: '100%', height: '100%',
          padding: '4px 0 0 4px',
          overflow: 'hidden',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.3s ease',
        }}
      />
    </div>
  )
}

function LoadingDots() {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: '6px', height: '6px', borderRadius: '50%',
            background: '#FEE123',
            animation: `plume-dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes plume-dot-pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  )
}
