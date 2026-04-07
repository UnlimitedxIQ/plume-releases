// Date formatting helpers for the Plume renderer.

// ── Relative Time ─────────────────────────────────────────────────────────

const SECOND = 1_000
const MINUTE = 60 * SECOND
const HOUR   = 60 * MINUTE
const DAY    = 24 * HOUR
const WEEK   = 7  * DAY
const MONTH  = 30 * DAY
const YEAR   = 365 * DAY

/** Returns a human-readable relative time string: "just now", "5m ago", "3 days ago" */
export function relativeTime(date: Date | string | number): string {
  const d = toDate(date)
  const now = Date.now()
  const delta = now - d.getTime()

  if (delta < 30 * SECOND)  return 'just now'
  if (delta < MINUTE)       return `${Math.floor(delta / SECOND)}s ago`
  if (delta < HOUR)         return `${Math.floor(delta / MINUTE)}m ago`
  if (delta < DAY)          return `${Math.floor(delta / HOUR)}h ago`
  if (delta < 2 * DAY)      return 'yesterday'
  if (delta < WEEK)         return `${Math.floor(delta / DAY)} days ago`
  if (delta < 2 * WEEK)     return 'last week'
  if (delta < MONTH)        return `${Math.floor(delta / WEEK)} weeks ago`
  if (delta < YEAR)         return `${Math.floor(delta / MONTH)} months ago`
  return `${Math.floor(delta / YEAR)} years ago`
}

// ── Due Date Formatting ───────────────────────────────────────────────────

export type DueDateStatus = 'overdue' | 'today' | 'this-week' | 'later' | 'no-date'

export interface DueDateInfo {
  label:  string
  status: DueDateStatus
  relative: string
}

/** Returns formatted due date info for assignment badges. */
export function formatDueDate(dueAt: string | null | undefined): DueDateInfo {
  if (!dueAt) {
    return { label: 'No due date', status: 'no-date', relative: '' }
  }

  const due = new Date(dueAt)
  const now = new Date()
  const today = startOfDay(now)
  const dueDay = startOfDay(due)
  const diffMs = dueDay.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / DAY)

  let label: string
  let status: DueDateStatus

  if (diffDays < 0) {
    status = 'overdue'
    label  = diffDays === -1 ? 'Due yesterday' : `${Math.abs(diffDays)}d overdue`
  } else if (diffDays === 0) {
    status = 'today'
    label  = `Due today at ${formatTime(due)}`
  } else if (diffDays === 1) {
    status = 'this-week'
    label  = `Due tomorrow at ${formatTime(due)}`
  } else if (diffDays <= 7) {
    status = 'this-week'
    label  = `Due ${formatWeekday(due)} at ${formatTime(due)}`
  } else {
    status = 'later'
    label  = `Due ${formatShortDate(due)}`
  }

  return {
    label,
    status,
    relative: relativeTime(due),
  }
}

// ── Short Date ─────────────────────────────────────────────────────────────

/** "Jan 15" */
export function formatShortDate(date: Date | string | number): string {
  const d = toDate(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** "Jan 15, 2025" */
export function formatLongDate(date: Date | string | number): string {
  const d = toDate(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** "3:45 PM" */
export function formatTime(date: Date | string | number): string {
  const d = toDate(date)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

/** "Monday", "Tuesday", etc. */
export function formatWeekday(date: Date | string | number): string {
  const d = toDate(date)
  return d.toLocaleDateString('en-US', { weekday: 'long' })
}

/** "2:30 PM · Jan 15" */
export function formatTimestamp(date: Date | string | number): string {
  const d = toDate(date)
  return `${formatTime(d)} · ${formatShortDate(d)}`
}

// ── File Size ─────────────────────────────────────────────────────────────

/** Formats file sizes: "1.2 MB", "340 KB", "12 B" */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024)             return `${bytes} B`
  if (bytes < 1024 * 1024)     return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3)       return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

// ── Points ─────────────────────────────────────────────────────────────────

/** "100 pts" | "1 pt" */
export function formatPoints(points: number | null | undefined): string {
  if (points == null) return 'Ungraded'
  if (points === 1)   return '1 pt'
  return `${points} pts`
}

// ── Internal Helpers ──────────────────────────────────────────────────────

function toDate(date: Date | string | number): Date {
  if (date instanceof Date) return date
  return new Date(date)
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}
