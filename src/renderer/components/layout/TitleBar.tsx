import { useState, useEffect } from 'react'
import { Minus, Square, X, Maximize2, Zap, MessageSquare } from 'lucide-react'
import { ipc } from '../../lib/ipc'

export default function TitleBar() {
  const [maximized, setMaximized] = useState(false)
  const [provider, setProvider] = useState<string>('claude')
  const [providerConnected, setProviderConnected] = useState(false)

  useEffect(() => {
    ipc.isMaximized().then(setMaximized).catch(() => {})
    ipc.getActiveProvider().then(setProvider).catch(() => {})
    ipc.getProvidersAuth().then(auth => {
      const active = auth.active === 'codex' ? auth.codex : auth.claude
      setProviderConnected(active?.loggedIn ?? false)
    }).catch(() => {})
  }, [])

  function handleMinimize() {
    ipc.minimize()
  }

  function handleMaximize() {
    ipc.maximize()
    setMaximized((m) => !m)
  }

  function handleClose() {
    ipc.close()
  }

  return (
    <div
      className="drag-region flex items-center justify-between shrink-0 select-none"
      style={{
        height:          '40px',
        background:      '#0a0f0d',
        borderBottom:    '1px solid #1a2420',
        paddingLeft:     '12px',
        paddingRight:    '0',
        zIndex:          50,
      }}
    >
      {/* Left: Logo + App name */}
      <div className="no-drag flex items-center gap-2.5 pointer-events-none">
        {/* UO "O" Logo */}
        <div
          style={{
            width:        '22px',
            height:       '22px',
            borderRadius: '50%',
            background:   'linear-gradient(135deg, #154733, #006747)',
            display:      'flex',
            alignItems:   'center',
            justifyContent:'center',
            fontSize:     '10px',
            fontWeight:   900,
            color:        '#FEE123',
            flexShrink:   0,
            boxShadow:    '0 0 8px rgba(0,103,71,0.4)',
          }}
        >
          O
        </div>
        <span
          style={{
            fontSize:    '12px',
            fontWeight:  600,
            color:       '#8a9b90',
            letterSpacing:'0.04em',
          }}
        >
          Plume
        </span>
      </div>

      {/* Center: provider badge */}
      <div className="flex-1 flex items-center justify-center">
        {providerConnected && (
          <div
            className="no-drag"
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '3px 10px', borderRadius: '12px',
              background: 'rgba(21,71,51,0.3)', border: '1px solid #1a2420',
              fontSize: '10px', fontWeight: 600, color: '#8a9b90',
              pointerEvents: 'none',
            }}
          >
            {provider === 'codex'
              ? <MessageSquare size={10} style={{ color: '#22c55e' }} />
              : <Zap size={10} style={{ color: '#FEE123' }} />
            }
            {provider === 'codex' ? 'ChatGPT' : 'Claude'}
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e' }} />
          </div>
        )}
      </div>

      {/* Right: Window controls */}
      <div className="no-drag flex items-center h-full">
        <WindowButton
          onClick={handleMinimize}
          label="Minimize"
          hoverColor="#1a2420"
        >
          <Minus size={12} />
        </WindowButton>
        <WindowButton
          onClick={handleMaximize}
          label={maximized ? 'Restore' : 'Maximize'}
          hoverColor="#1a2420"
        >
          {maximized ? <Square size={11} /> : <Maximize2 size={11} />}
        </WindowButton>
        <WindowButton
          onClick={handleClose}
          label="Close"
          hoverColor="#7f1d1d"
          hoverIconColor="#ef4444"
        >
          <X size={12} />
        </WindowButton>
      </div>
    </div>
  )
}

interface WindowButtonProps {
  onClick:         () => void
  label:           string
  children:        React.ReactNode
  hoverColor?:     string
  hoverIconColor?: string
}

function WindowButton({
  onClick,
  label,
  children,
  hoverColor     = '#1a2420',
  hoverIconColor = '#e8ede9',
}: WindowButtonProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      aria-label={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width:           '46px',
        height:          '40px',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        background:      hovered ? hoverColor : 'transparent',
        color:           hovered ? hoverIconColor : '#5a6b60',
        border:          'none',
        cursor:          'pointer',
        transition:      'all 0.15s ease',
        flexShrink:      0,
      }}
    >
      {children}
    </button>
  )
}
