import { formatDueDate } from '../../lib/format'
import type { DueDateStatus } from '../../lib/format'

interface CanvasBadgeProps {
  dueAt: string | null | undefined
}

const STATUS_STYLES: Record<DueDateStatus, { bg: string; color: string; border: string }> = {
  overdue:   { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', border: 'rgba(239,68,68,0.3)'  },
  today:     { bg: 'rgba(249,115,22,0.12)', color: '#f97316', border: 'rgba(249,115,22,0.3)' },
  'this-week':{ bg: 'rgba(234,179,8,0.12)', color: '#eab308', border: 'rgba(234,179,8,0.3)'  },
  later:     { bg: 'rgba(0,103,71,0.15)',   color: '#22c55e', border: 'rgba(0,103,71,0.35)'  },
  'no-date': { bg: 'rgba(90,107,96,0.12)',  color: '#5a6b60', border: 'rgba(90,107,96,0.25)' },
}

export default function CanvasBadge({ dueAt }: CanvasBadgeProps) {
  const { label, status } = formatDueDate(dueAt)
  const style = STATUS_STYLES[status]

  return (
    <span
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        padding:      '2px 7px',
        borderRadius: '5px',
        fontSize:     '10px',
        fontWeight:   600,
        background:   style.bg,
        color:        style.color,
        border:       `1px solid ${style.border}`,
        whiteSpace:   'nowrap',
      }}
    >
      {status === 'overdue' && '⚠ '}
      {label}
    </span>
  )
}
