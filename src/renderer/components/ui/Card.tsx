import { motion } from 'framer-motion'

interface CardProps {
  children:    React.ReactNode
  hoverable?:  boolean
  padding?:    string
  style?:      React.CSSProperties
  onClick?:    () => void
  className?:  string
}

const cardBaseStyle = (padding: string, hoverable: boolean, style?: React.CSSProperties): React.CSSProperties => ({
  background:   '#111916',
  border:       '1px solid #2a3a32',
  borderRadius: '12px',
  padding,
  cursor:       hoverable ? 'pointer' : undefined,
  transition:   'all 0.15s ease',
  ...style,
})

export default function Card({
  children,
  hoverable = false,
  padding   = '16px',
  style,
  onClick,
  className,
}: CardProps) {
  if (hoverable) {
    return (
      <motion.div
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ duration: 0.15 }}
        className={className}
        onClick={onClick}
        style={cardBaseStyle(padding, true, style)}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#374f44'
          e.currentTarget.style.boxShadow   = '0 4px 20px rgba(0,0,0,0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#2a3a32'
          e.currentTarget.style.boxShadow   = 'none'
        }}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div
      className={className}
      onClick={onClick}
      style={cardBaseStyle(padding, false, style)}
    >
      {children}
    </div>
  )
}
