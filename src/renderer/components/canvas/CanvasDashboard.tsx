import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Clock, Calendar, Megaphone, Send,
  AlertCircle, ChevronDown, ExternalLink,
} from 'lucide-react'
import { useCanvas } from '../../hooks/useCanvas'
import { ipc } from '../../lib/ipc'
import type { CanvasAnnouncement } from '../../lib/ipc'
import type { CanvasAssignment, CanvasCourse } from '../../types/canvas'
import CanvasBadge from './CanvasBadge'
import { formatPoints } from '../../lib/format'

// ── Course accent colors ────────────────────────────────────────────────────

const COURSE_ACCENTS = ['#006747', '#3b82f6', '#a855f7', '#f97316', '#14b8a6', '#ec4899', '#FEE123', '#ef4444']
function getCourseAccent(index: number): string {
  return COURSE_ACCENTS[index % COURSE_ACCENTS.length]
}

// ── Main component ──────────────────────────────────────────────────────────

export default function CanvasDashboard() {
  const { courses, assignments, isLoading, refreshAll } = useCanvas()
  const [announcements, setAnnouncements] = useState<CanvasAnnouncement[]>([])

  // Vertical split — percentage for top row (assignments)
  const [topPercent, setTopPercent] = useState(70)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const handleRowDragStart = useCallback(() => {
    dragging.current = true
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const y = e.clientY - rect.top
      const pct = Math.round((y / rect.height) * 100)
      setTopPercent(Math.max(20, Math.min(80, pct)))
    }

    const handleMouseUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  // Message composer state
  const [messageBody, setMessageBody] = useState('')
  const [selectedCourseId, setSelectedCourseId] = useState<number | ''>('')
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null)

  // Fetch announcements on mount (assignments auto-fetched by useCanvas hook)
  useEffect(() => {
    ipc.getCanvasAnnouncements()
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]))
  }, [])

  function getAssignmentsForCourse(courseId: number): CanvasAssignment[] {
    const seen = new Set<number>()
    return assignments
      .filter(a => {
        if (a.courseId !== courseId || seen.has(a.id)) return false
        seen.add(a.id)
        return true
      })
      .sort((a, b) => {
        if (!a.dueAt && !b.dueAt) return 0
        if (!a.dueAt) return 1
        if (!b.dueAt) return -1
        return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      })
  }

  function getAnnouncementsForCourse(courseId: number): CanvasAnnouncement[] {
    const seen = new Set<number>()
    return announcements.filter(a => {
      if (a.course_id !== courseId || seen.has(a.id)) return false
      seen.add(a.id)
      return true
    })
  }

  async function handleSend() {
    if (!messageBody.trim() || !selectedCourseId) return
    setSending(true)
    setSendResult(null)
    try {
      const course = courses.find(c => c.id === selectedCourseId)
      const subject = course ? `Question about ${course.courseCode}` : 'Canvas Message'

      // Fetch instructor IDs for the selected course
      const instructors = await ipc.getCanvasInstructors(selectedCourseId as number)
      const recipientIds = instructors.map(i => String(i.id))

      if (recipientIds.length === 0) {
        setSendResult({ ok: false, msg: 'No instructor found for this course' })
        setSending(false)
        return
      }

      const result = await ipc.sendCanvasMessage(recipientIds, subject, messageBody.trim())
      if (result.success) {
        setSendResult({ ok: true, msg: 'Sent!' })
        setMessageBody('')
        setSelectedCourseId('')
      } else {
        setSendResult({ ok: false, msg: result.error ?? 'Failed' })
      }
    } catch {
      setSendResult({ ok: false, msg: 'Error sending message' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ background: '#0a0f0d' }}>
      {/* Header */}
      <div
        style={{
          padding: '14px 20px',
          borderBottom: '1px solid #1a2420',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <GraduationCap size={18} style={{ color: '#FEE123' }} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#e8ede9', margin: 0 }}>
            Canvas Dashboard
          </h2>
          <p style={{ fontSize: '11px', color: '#5a6b60', margin: 0 }}>
            {courses.length} course{courses.length !== 1 ? 's' : ''} · {assignments.length} assignments
          </p>
        </div>
        <button
          onClick={refreshAll}
          disabled={isLoading}
          style={{
            padding: '5px 10px',
            borderRadius: '7px',
            border: '1px solid #2a3a32',
            background: 'transparent',
            color: '#5a6b60',
            fontSize: '11px',
            fontWeight: 600,
            cursor: isLoading ? 'not-allowed' : 'pointer',
          }}
        >
          Refresh
        </button>
      </div>

      {/* Two rows with draggable height split */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0"
        style={{
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
        }}
      >
        {/* Top row: course header + assignments */}
        <div
          style={{
            height: `${topPercent}%`,
            display: 'grid',
            gridTemplateColumns: `repeat(${courses.length}, 1fr)`,
            gap: '10px',
            minHeight: 0,
          }}
        >
          {courses.map((course, i) => (
            <CourseAssignmentBox
              key={`assign-${course.id}`}
              course={course}
              accent={getCourseAccent(i)}
              assignments={getAssignmentsForCourse(course.id)}
              index={i}
            />
          ))}
        </div>

        {/* Horizontal split handle */}
        <HorizontalSplitHandle onMouseDown={handleRowDragStart} />

        {/* Bottom row: announcements per course */}
        <div
          style={{
            height: `${100 - topPercent}%`,
            display: 'grid',
            gridTemplateColumns: `repeat(${courses.length}, 1fr)`,
            gap: '10px',
            minHeight: 0,
          }}
        >
          {courses.map((course, i) => (
            <CourseAnnouncementBox
              key={`announce-${course.id}`}
              course={course}
              accent={getCourseAccent(i)}
              announcements={getAnnouncementsForCourse(course.id)}
              index={i}
            />
          ))}
        </div>
      </div>

      {/* Message composer — fixed at bottom */}
      <div style={{ padding: '0 12px 12px', flexShrink: 0 }}>
        <MessageComposer
          courses={courses}
          selectedCourseId={selectedCourseId}
          setSelectedCourseId={setSelectedCourseId}
          messageBody={messageBody}
          setMessageBody={setMessageBody}
          sending={sending}
          sendResult={sendResult}
          onSend={handleSend}
        />
      </div>
    </div>
  )
}

// ── Course Column ─────────────────────────────────────────────────────────

function CourseAssignmentBox({
  course,
  accent,
  assignments,
  index,
}: {
  course: CanvasCourse
  accent: string
  assignments: CanvasAssignment[]
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#111916',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #1e2d26',
        minHeight: 0,
      }}
    >
      {/* Course header */}
      <div
        style={{
          padding: '10px 12px 8px',
          borderLeft: `3px solid ${accent}`,
          borderBottom: '1px solid #1a2420',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 700, color: accent }}>
          {course.courseCode}
        </div>
        <div style={{ fontSize: '10px', color: '#8a9b90', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {course.name}
        </div>
      </div>

      {/* Section label */}
      <div style={{ padding: '6px 12px 4px', display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        <Calendar size={9} style={{ color: '#5a6b60' }} />
        <span style={{ fontSize: '9px', fontWeight: 700, color: '#5a6b60', letterSpacing: '0.06em' }}>ASSIGNMENTS</span>
        {assignments.length > 0 && (
          <span style={{ fontSize: '8px', fontWeight: 700, color: '#154733', background: '#FEE123', borderRadius: '8px', padding: '0 5px', lineHeight: '1.5' }}>
            {assignments.length}
          </span>
        )}
      </div>

      {/* Scrollable assignment list */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {assignments.length === 0 ? (
          <div style={{ padding: '12px', fontSize: '11px', color: '#3a4a40', fontStyle: 'italic' }}>No assignments</div>
        ) : (
          assignments.map((a, i) => (
            <AssignmentRow key={a.id} assignment={a} isLast={i === assignments.length - 1} />
          ))
        )}
      </div>
    </motion.div>
  )
}

function CourseAnnouncementBox({
  course,
  accent,
  announcements,
  index,
}: {
  course: CanvasCourse
  accent: string
  announcements: CanvasAnnouncement[]
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 + 0.1 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: '#111916',
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #1e2d26',
        minHeight: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '8px 12px',
          borderLeft: `3px solid ${accent}`,
          borderBottom: '1px solid #1a2420',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          flexShrink: 0,
        }}
      >
        <Megaphone size={9} style={{ color: '#5a6b60' }} />
        <span style={{ fontSize: '9px', fontWeight: 700, color: '#5a6b60', letterSpacing: '0.06em' }}>ANNOUNCEMENTS</span>
        {announcements.length > 0 && (
          <span style={{ fontSize: '8px', fontWeight: 700, color: '#154733', background: '#FEE123', borderRadius: '8px', padding: '0 5px', lineHeight: '1.5' }}>
            {announcements.length}
          </span>
        )}
        <span style={{ fontSize: '9px', color: '#3a4a40', marginLeft: 'auto' }}>{course.courseCode}</span>
      </div>

      {/* Scrollable announcements */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        {announcements.length === 0 ? (
          <div style={{ padding: '12px', fontSize: '11px', color: '#3a4a40', fontStyle: 'italic' }}>No announcements</div>
        ) : (
          announcements.map((a, i) => (
            <AnnouncementRow key={a.id} announcement={a} isLast={i === announcements.length - 1} />
          ))
        )}
      </div>
    </motion.div>
  )
}

// ── Assignment Row ─────────────────────────────────────────────────────────

function AssignmentRow({ assignment, isLast }: { assignment: CanvasAssignment; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false)

  const now = Date.now()
  const due = assignment.dueAt ? new Date(assignment.dueAt).getTime() : null
  const isOverdue = due !== null && due < now
  const dotColor = isOverdue ? '#ef4444' : due && due - now < 3 * 86400000 ? '#FEE123' : '#006747'

  return (
    <div style={{ borderBottom: isLast ? 'none' : '1px solid #1a2420' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '8px',
          width: '100%',
          padding: '8px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      >
        <div
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            background: dotColor,
            flexShrink: 0,
            marginTop: '5px',
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#e8ede9',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: '3px',
            }}
          >
            {assignment.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
            <CanvasBadge dueAt={assignment.dueAt} />
            {assignment.pointsPossible != null && (
              <span style={{ fontSize: '9px', color: '#5a6b60' }}>
                {formatPoints(assignment.pointsPossible)}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          size={10}
          style={{
            color: '#3a4a40',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.15s ease',
            flexShrink: 0,
            marginTop: '4px',
          }}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && assignment.description && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding: '0 14px 8px 27px',
                fontSize: '10px',
                color: '#8a9b90',
                lineHeight: 1.5,
              }}
              dangerouslySetInnerHTML={{ __html: assignment.description }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Announcement Row ──────────────────────────────────────────────────────

function AnnouncementRow({ announcement, isLast }: { announcement: CanvasAnnouncement; isLast: boolean }) {
  const timeAgo = getRelativeTime(announcement.posted_at || announcement.created_at)

  return (
    <div
      style={{
        padding: '8px 14px',
        borderBottom: isLast ? 'none' : '1px solid #1a2420',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 600, color: '#e8ede9', marginBottom: '2px' }}>
        {announcement.title}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
        <span style={{ fontSize: '9px', color: '#8a9b90' }}>{announcement.author.display_name}</span>
        <span style={{ fontSize: '9px', color: '#2a3a32' }}>·</span>
        <span style={{ fontSize: '9px', color: '#5a6b60' }}>{timeAgo}</span>
      </div>
      <div
        style={{
          fontSize: '10px',
          color: '#5a6b60',
          lineHeight: 1.4,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {announcement.message}
      </div>
    </div>
  )
}

// ── Message Composer ──────────────────────────────────────────────────────

function HorizontalSplitHandle({ onMouseDown }: { onMouseDown: () => void }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        height: '6px',
        cursor: 'row-resize',
        flexShrink: 0,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}
    >
      <div
        style={{
          height: hovered ? '3px' : '1px',
          width: '100%',
          background: hovered ? '#006747' : '#1a2420',
          borderRadius: '2px',
          transition: 'all 0.15s ease',
        }}
      />
      {hovered && (
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            gap: '3px',
            alignItems: 'center',
          }}
        >
          {[0, 1, 2].map(i => (
            <div
              key={i}
              style={{
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                background: '#FEE123',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MessageComposer({
  courses,
  selectedCourseId,
  setSelectedCourseId,
  messageBody,
  setMessageBody,
  sending,
  sendResult,
  onSend,
}: {
  courses: CanvasCourse[]
  selectedCourseId: number | ''
  setSelectedCourseId: (id: number | '') => void
  messageBody: string
  setMessageBody: (s: string) => void
  sending: boolean
  sendResult: { ok: boolean; msg: string } | null
  onSend: () => void
}) {
  return (
    <div
      style={{
        background: '#111916',
        border: '1px solid #1e2d26',
        borderRadius: '10px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '8px 14px',
          borderBottom: '1px solid #1a2420',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <Send size={11} style={{ color: '#5a6b60' }} />
        <span style={{ fontSize: '9px', fontWeight: 700, color: '#5a6b60', letterSpacing: '0.06em' }}>
          MESSAGE YOUR INSTRUCTOR
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #1a2420' }}>
        <select
          value={selectedCourseId}
          onChange={e => setSelectedCourseId(e.target.value === '' ? '' : Number(e.target.value))}
          style={{
            flex: '0 0 140px',
            padding: '8px 10px',
            background: 'transparent',
            border: 'none',
            borderRight: '1px solid #1a2420',
            color: selectedCourseId === '' ? '#5a6b60' : '#e8ede9',
            fontSize: '11px',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer',
            appearance: 'none',
          }}
        >
          <option value="">Select course...</option>
          {courses.map(c => (
            <option key={c.id} value={c.id} style={{ background: '#111916', color: '#e8ede9' }}>
              {c.courseCode}
            </option>
          ))}
        </select>
        <textarea
          value={messageBody}
          onChange={e => setMessageBody(e.target.value)}
          placeholder="Message your instructor..."
          rows={4}
          style={{
            flex: 1,
            padding: '10px 12px',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#e8ede9',
            fontSize: '12px',
            lineHeight: 1.5,
            resize: 'none',
          }}
        />
        <div style={{ padding: '0 10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {sendResult && (
            <span style={{ fontSize: '10px', color: sendResult.ok ? '#22c55e' : '#ef4444' }}>
              {sendResult.msg}
            </span>
          )}
          <button
            onClick={onSend}
            disabled={sending || !messageBody.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: sending || !messageBody.trim() ? '#2a3a32' : '#FEE123',
              color: sending || !messageBody.trim() ? '#5a6b60' : '#0a0f0d',
              fontSize: '11px',
              fontWeight: 700,
              cursor: sending || !messageBody.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            <Send size={10} />
            Send
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────

function getRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 7) return `${days} days ago`
  return `${Math.floor(days / 7)}w ago`
}
