interface SpinnerProps {
  size?:  number
  color?: string
}

export default function Spinner({ size = 20, color = '#006747' }: SpinnerProps) {
  const thickness = Math.max(2, Math.round(size / 8))

  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        width:        `${size}px`,
        height:       `${size}px`,
        borderRadius: '50%',
        border:       `${thickness}px solid rgba(0,103,71,0.2)`,
        borderTopColor:color,
        animation:    'spin 0.9s linear infinite',
        flexShrink:   0,
      }}
    />
  )
}
