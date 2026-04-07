import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  Variant
  size?:     Size
  loading?:  boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

const VARIANT_STYLES: Record<Variant, React.CSSProperties> = {
  primary:   {
    background:  'linear-gradient(135deg, #154733, #006747)',
    color:       '#FEE123',
    border:      '1px solid transparent',
  },
  secondary: {
    background:  '#1a2420',
    color:       '#e8ede9',
    border:      '1px solid #2a3a32',
  },
  accent:    {
    background:  '#FEE123',
    color:       '#0a0f0d',
    border:      '1px solid transparent',
  },
  ghost:     {
    background:  'transparent',
    color:       '#8a9b90',
    border:      '1px solid transparent',
  },
  danger:    {
    background:  'rgba(239,68,68,0.12)',
    color:       '#ef4444',
    border:      '1px solid rgba(239,68,68,0.3)',
  },
}

const SIZE_STYLES: Record<Size, React.CSSProperties> = {
  sm: { padding: '5px 12px', fontSize: '12px', borderRadius: '6px', height: '30px' },
  md: { padding: '8px 16px', fontSize: '13px', borderRadius: '8px', height: '36px' },
  lg: { padding: '11px 22px', fontSize: '14px', borderRadius: '10px', height: '44px' },
}

export default function Button({
  variant   = 'secondary',
  size      = 'md',
  loading   = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      style={{
        display:        'inline-flex',
        alignItems:     'center',
        justifyContent: 'center',
        gap:            '6px',
        fontWeight:     600,
        cursor:         isDisabled ? 'not-allowed' : 'pointer',
        transition:     'all 0.15s ease',
        opacity:        isDisabled ? 0.55 : 1,
        width:          fullWidth ? '100%' : undefined,
        border:         'none',
        outline:        'none',
        fontFamily:     'inherit',
        whiteSpace:     'nowrap',
        flexShrink:     0,
        ...VARIANT_STYLES[variant],
        ...SIZE_STYLES[size],
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === 'lg' ? 16 : 13} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
      ) : leftIcon ? (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{leftIcon}</span>
      ) : null}
      {children}
      {!loading && rightIcon && (
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{rightIcon}</span>
      )}
    </button>
  )
}
