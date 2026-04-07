import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useCanvasStore } from '../../stores/canvas-store'
import type { CanvasAssignment, CanvasCourse } from '../../types/canvas'
import { submissionTypeLabel } from '../../types/canvas'
import CanvasBadge from './CanvasBadge'
import RubricView from './RubricView'
import { formatPoints, formatDueDate } from '../../lib/format'

export default function AssignmentList() {
  const {
    courses,
    assignments,
    assignmentsLoading,
    fetchAssignments,
    refreshAll,
  } = useCanvasStore()

  useEffect(() => {
    if (assignments.length === 0) {
      fetchAssignments()
    }
  }, [assignments.length, fetchAssignments])

  // Sort courses by name
  const sortedCourses = [...courses].sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      style={{ background: '#0a0f0d' }}
    >
      {/* Header */}
      <div
        style={{
          padding:      '14px 20px',
          borderBottom: '1px solid #1a2420',
          display:      'flex',
          alignItems:   'center',
          gap:          '12px',
          flexShrink:   0,
        }}
      >
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#e8ede9' }}>
            Canvas Assignments
          </h2>
          <p style={{ fontSize: '12px', color: '#5a6b60' }}>
            {courses.length} course{courses.length !== 1 ? 's' : ''} · {assignments.length} assignments
          </p>
        </div>
        <button
          onClick={refreshAll}
          disabled={assignmentsLoading}
          title="Refresh"
          style={{
            marginLeft:    'auto',
            display:       'flex',
            alignItems:    'center',
            justifyContent:'center',
            width:         '32px',
            height:        '32px',
            borderRadius:  '8px',
            border:        '1px solid #2a3a32',
            background:    'transparent',
            color:         '#5a6b60',
            cursor:        assignmentsLoading ? 'not-allowed' : 'pointer',
          }}
        >
          <RefreshCw
            size={13}
            style={{ animation: assignmentsLoading ? 'spin 1s linear infinite' : 'none' }}
          />
        </button>
      </div>

      {/* Assignment list */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '12px 16px' }}>
        {assignmentsLoading && assignments.length === 0 ? (
          <div className="flex items-center justify-center" style={{ minHeight: '200px' }}>
            <div
              className="w-6 h-6 border-2 rounded-full"
              style={{
                borderColor:    '#154733',
                borderTopColor: '#FEE123',
                animation:      'spin 1s linear infinite',
              }}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedCourses.map((course) => (
              <CourseGroup
                key={course.id}
                course={course}
                assignments={assignments.filter((a) => a.courseId === course.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function CourseGroup({
  course,
  assignments,
}: {
  course:      CanvasCourse
  assignments: CanvasAssignment[]
}) {
  const [collapsed, setCollapsed] = useState(false)

  const sorted = [...assignments].sort((a, b) => {
    if (!a.dueAt && !b.dueAt) return 0
    if (!a.dueAt) return 1
    if (!b.dueAt) return -1
    return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
  })

  return (
    <div
      style={{
        background:   '#111916',
        border:       '1px solid #2a3a32',
        borderRadius: '12px',
        overflow:     'hidden',
      }}
    >
      {/* Course header */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         '10px',
          width:       '100%',
          padding:     '12px 14px',
          background:  'transparent',
          border:      'none',
          cursor:      'pointer',
          textAlign:   'left',
          borderBottom:'1px solid #1a2420',
        }}
      >
        <div
          style={{
            width:        '6px',
            height:       '6px',
            borderRadius: '50%',
            background:   '#006747',
            flexShrink:   0,
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#e8ede9' }}>
            {course.name}
          </div>
          <div style={{ fontSize: '11px', color: '#5a6b60' }}>
            {course.courseCode} · {assignments.length} assignment{assignments.length !== 1 ? 's' : ''}
          </div>
        </div>
        <span style={{ color: '#5a6b60' }}>
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </span>
      </button>

      {/* Assignments */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="flex flex-col gap-0">
              {sorted.map((a, i) => (
                <AssignmentCard
                  key={a.id}
                  assignment={a}
                  isLast={i === sorted.length - 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function AssignmentCard({
  assignment,
  isLast,
}: {
  assignment: CanvasAssignment
  isLast:     boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const due = formatDueDate(assignment.dueAt)

  return (
    <div
      style={{
        borderBottom: isLast ? 'none' : '1px solid #1a2420',
      }}
    >
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          display:    'flex',
          alignItems: 'flex-start',
          gap:        '12px',
          width:      '100%',
          padding:    '11px 14px',
          background: 'transparent',
          border:     'none',
          cursor:     'pointer',
          textAlign:  'left',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(26,36,32,0.5)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize:     '13px',
              fontWeight:   600,
              color:        '#e8ede9',
              marginBottom: '4px',
              overflow:     'hidden',
              textOverflow: 'ellipsis',
              whiteSpace:   'nowrap',
            }}
          >
            {assignment.name}
          </div>
          <div className="flex items-center flex-wrap gap-1.5">
            <CanvasBadge dueAt={assignment.dueAt} />
            {assignment.pointsPossible != null && (
              <span style={{ fontSize: '11px', color: '#5a6b60' }}>
                {formatPoints(assignment.pointsPossible)}
              </span>
            )}
            {assignment.submissionTypes.map((t) => (
              <span
                key={t}
                style={{
                  fontSize:     '10px',
                  color:        '#5a6b60',
                  padding:      '1px 6px',
                  borderRadius: '4px',
                  background:   '#1a2420',
                  border:       '1px solid #2a3a32',
                }}
              >
                {submissionTypeLabel(t)}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {assignment.htmlUrl && (
            <a
              href={assignment.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                color:      '#5a6b60',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#8a9b90' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#5a6b60' }}
            >
              <ExternalLink size={12} />
            </a>
          )}
          <span style={{ color: '#5a6b60' }}>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              style={{
                padding:    '0 14px 14px',
                borderTop:  '1px solid #1a2420',
                paddingTop: '12px',
              }}
            >
              {/* Due date detail */}
              {due.label && (
                <p style={{ fontSize: '12px', color: '#8a9b90', marginBottom: '10px' }}>
                  {due.label}
                </p>
              )}

              {/* Description */}
              {assignment.description && (
                <div
                  className="prose-uo selectable"
                  style={{ fontSize: '12px', marginBottom: assignment.rubric ? '12px' : 0 }}
                  dangerouslySetInnerHTML={{ __html: assignment.description }}
                />
              )}

              {/* Rubric */}
              {assignment.rubric && (
                <div style={{ marginTop: '12px' }}>
                  <RubricView rubric={assignment.rubric} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
