import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  open:         boolean
  onClose:      () => void
  title?:       string
  children:     React.ReactNode
  maxWidth?:    number
  showClose?:   boolean
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth  = 480,
  showClose = true,
}: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            position:         'fixed',
            inset:            0,
            zIndex:           200,
            display:          'flex',
            alignItems:       'center',
            justifyContent:   'center',
            padding:          '20px',
            background:       'rgba(10, 15, 13, 0.8)',
            backdropFilter:   'blur(8px)',
            WebkitBackdropFilter:'blur(8px)',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 8 }}
            transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              width:        `${maxWidth}px`,
              maxWidth:     '100%',
              background:   '#111916',
              border:       '1px solid #2a3a32',
              borderRadius: '16px',
              boxShadow:    '0 24px 64px rgba(0,0,0,0.7)',
              overflow:     'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || showClose) && (
              <div
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'space-between',
                  padding:        '14px 18px',
                  borderBottom:   '1px solid #1a2420',
                }}
              >
                {title && (
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#e8ede9' }}>
                    {title}
                  </h2>
                )}
                {showClose && (
                  <button
                    onClick={onClose}
                    style={{
                      marginLeft:    'auto',
                      display:       'flex',
                      alignItems:    'center',
                      justifyContent:'center',
                      width:         '26px',
                      height:        '26px',
                      borderRadius:  '6px',
                      border:        'none',
                      background:    'transparent',
                      color:         '#5a6b60',
                      cursor:        'pointer',
                      transition:    'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#1a2420'
                      e.currentTarget.style.color = '#e8ede9'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = '#5a6b60'
                    }}
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
