import { useState } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:       string
  error?:       string
  hint?:        string
  leftIcon?:    React.ReactNode
  rightIcon?:   React.ReactNode
  fullWidth?:   boolean
}

export default function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  fullWidth = true,
  style,
  ...props
}: InputProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ width: fullWidth ? '100%' : undefined }}>
      {label && (
        <label
          style={{
            display:      'block',
            fontSize:     '12px',
            fontWeight:   600,
            color:        '#8a9b90',
            marginBottom: '6px',
          }}
        >
          {label}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {leftIcon && (
          <div
            style={{
              position:      'absolute',
              left:          '10px',
              top:           '50%',
              transform:     'translateY(-50%)',
              color:         '#5a6b60',
              pointerEvents: 'none',
              display:       'flex',
              alignItems:    'center',
            }}
          >
            {leftIcon}
          </div>
        )}

        <input
          onFocus={(e) => { setFocused(true); props.onFocus?.(e) }}
          onBlur={(e)  => { setFocused(false); props.onBlur?.(e) }}
          style={{
            width:        fullWidth ? '100%' : undefined,
            background:   '#0c1510',
            border:       `1px solid ${
              error   ? '#ef4444'
              : focused ? '#006747'
              : '#2a3a32'
            }`,
            borderRadius: '8px',
            padding:      `9px ${rightIcon ? '36px' : '12px'} 9px ${leftIcon ? '36px' : '12px'}`,
            color:        '#e8ede9',
            fontSize:     '13px',
            outline:      'none',
            transition:   'border-color 0.2s ease, box-shadow 0.2s ease',
            boxShadow:    focused ? '0 0 0 3px rgba(0,103,71,0.12)' : 'none',
            fontFamily:   'inherit',
            ...style,
          }}
          {...props}
        />

        {rightIcon && (
          <div
            style={{
              position:  'absolute',
              right:     '10px',
              top:       '50%',
              transform: 'translateY(-50%)',
              color:     '#5a6b60',
              display:   'flex',
              alignItems:'center',
            }}
          >
            {rightIcon}
          </div>
        )}
      </div>

      {error && (
        <p style={{ marginTop: '5px', fontSize: '11px', color: '#ef4444' }}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p style={{ marginTop: '5px', fontSize: '11px', color: '#5a6b60' }}>
          {hint}
        </p>
      )}
    </div>
  )
}
