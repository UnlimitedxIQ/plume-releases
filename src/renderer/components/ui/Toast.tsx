import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

// ── Toast Types ────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'info'

export interface Toast {
  id:       string
  message:  string
  variant:  ToastVariant
  duration: number
}

// ── Toast Manager (singleton) ─────────────────────────────────────────────

type Listener = (toasts: Toast[]) => void

let toasts:    Toast[]   = []
let listeners: Listener[] = []

function notify() {
  listeners.forEach((l) => l([...toasts]))
}

export const toastManager = {
  show(message: string, variant: ToastVariant = 'info', duration = 4000): string {
    const id = crypto.randomUUID()
    toasts = [...toasts, { id, message, variant, duration }]
    notify()
    return id
  },
  success(message: string, duration?: number) {
    return toastManager.show(message, 'success', duration)
  },
  error(message: string, duration?: number) {
    return toastManager.show(message, 'error', duration ?? 6000)
  },
  info(message: string, duration?: number) {
    return toastManager.show(message, 'info', duration)
  },
  dismiss(id: string) {
    toasts = toasts.filter((t) => t.id !== id)
    notify()
  },
}

// ── Hook ──────────────────────────────────────────────────────────────────

function useToasts(): Toast[] {
  const [state, setState] = useState<Toast[]>([...toasts])

  useEffect(() => {
    listeners.push(setState)
    return () => {
      listeners = listeners.filter((l) => l !== setState)
    }
  }, [])

  return state
}

// ── Toast Container ────────────────────────────────────────────────────────

export function ToastContainer() {
  const toastList = useToasts()

  return (
    <div
      style={{
        position:   'fixed',
        bottom:     '20px',
        right:      '20px',
        zIndex:     1000,
        display:    'flex',
        flexDirection:'column-reverse',
        gap:        '8px',
        pointerEvents:'none',
      }}
    >
      <AnimatePresence initial={false}>
        {toastList.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={() => toastManager.dismiss(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── Toast Item ────────────────────────────────────────────────────────────

const VARIANT_CONFIG: Record<ToastVariant, {
  bg:     string
  border: string
  color:  string
  Icon:   React.ElementType
}> = {
  success: {
    bg:     'rgba(17,25,22,0.96)',
    border: 'rgba(34,197,94,0.35)',
    color:  '#22c55e',
    Icon:   CheckCircle2,
  },
  error: {
    bg:     'rgba(17,25,22,0.96)',
    border: 'rgba(239,68,68,0.35)',
    color:  '#ef4444',
    Icon:   AlertCircle,
  },
  info: {
    bg:     'rgba(17,25,22,0.96)',
    border: 'rgba(59,130,246,0.35)',
    color:  '#60a5fa',
    Icon:   Info,
  },
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast:     Toast
  onDismiss: () => void
}) {
  const config = VARIANT_CONFIG[toast.variant]
  const { bg, border, color, Icon } = config
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    timerRef.current = setTimeout(() => onDismiss(), toast.duration)
    return () => clearTimeout(timerRef.current)
  }, [toast.duration, onDismiss])

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.9 }}
      animate={{ opacity: 1, x: 0,  scale: 1   }}
      exit={{ opacity: 0, x: 40, scale: 0.9 }}
      transition={{ duration: 0.22, ease: [0.34, 1.56, 0.64, 1] }}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           '10px',
        padding:       '10px 14px',
        borderRadius:  '10px',
        background:    bg,
        border:        `1px solid ${border}`,
        boxShadow:     '0 8px 24px rgba(0,0,0,0.5)',
        backdropFilter:'blur(8px)',
        WebkitBackdropFilter:'blur(8px)',
        maxWidth:      '320px',
        pointerEvents: 'all',
      }}
    >
      <Icon size={15} style={{ color, flexShrink: 0 }} />
      <span style={{ flex: 1, fontSize: '13px', color: '#e8ede9', lineHeight: 1.4 }}>
        {toast.message}
      </span>
      <button
        onClick={onDismiss}
        style={{
          background:  'transparent',
          border:      'none',
          cursor:      'pointer',
          color:       '#5a6b60',
          padding:     0,
          display:     'flex',
          flexShrink:  0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#8a9b90' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = '#5a6b60' }}
      >
        <X size={13} />
      </button>
    </motion.div>
  )
}
