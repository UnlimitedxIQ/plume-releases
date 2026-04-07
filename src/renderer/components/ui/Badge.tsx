type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'yellow' | 'green' | 'muted'

interface BadgeProps {
  variant?:  BadgeVariant
  children:  React.ReactNode
  size?:     'sm' | 'md'
  dot?:      boolean
}

const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: '#1a2420', color: '#8a9b90', border: '1px solid #2a3a32' },
  success: { background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' },
  warning: { background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' },
  danger:  { background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)' },
  info:    { background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)' },
  yellow:  { background: 'rgba(254,225,35,0.1)', color: '#FEE123', border: '1px solid rgba(254,225,35,0.25)' },
  green:   { background: 'rgba(0,103,71,0.15)', color: '#34d399', border: '1px solid rgba(0,103,71,0.3)' },
  muted:   { background: 'rgba(90,107,96,0.1)', color: '#5a6b60', border: '1px solid rgba(90,107,96,0.2)' },
}

const SIZE_STYLES: Record<'sm' | 'md', React.CSSProperties> = {
  sm: { fontSize: '10px', padding: '2px 7px', borderRadius: '5px' },
  md: { fontSize: '12px', padding: '3px 10px', borderRadius: '6px' },
}

export default function Badge({ variant = 'default', size = 'sm', dot, children }: BadgeProps) {
  return (
    <span
      style={{
        display:    'inline-flex',
        alignItems: 'center',
        gap:        dot ? '4px' : undefined,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
      }}
    >
      {dot && (
        <span
          style={{
            width:        '5px',
            height:       '5px',
            borderRadius: '50%',
            background:   'currentColor',
            flexShrink:   0,
          }}
        />
      )}
      {children}
    </span>
  )
}
