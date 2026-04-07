import { useState, useEffect } from 'react'
import { BookOpen, FileText, ChevronRight } from 'lucide-react'
import { ipc } from '../../lib/ipc'
import { useCanvas } from '../../hooks/useCanvas'
import { useGradingStore } from '../../stores/grading-store'
import { useGrading } from '../../hooks/useGrading'
import type { CanvasAssignment } from '../../lib/ipc'

export default function AssignmentPicker() {
  const { courses, assignments, isLoading } = useCanvas()
  const { startSession } = useGradingStore()
  const { startProvisionalScoring } = useGrading()

  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
  const [selectedAssignment, setSelectedAssignment] = useState<CanvasAssignment | null>(null)
  const [rubricPreview, setRubricPreview] = useState<unknown[] | null>(null)
  const [loadingRubric, setLoadingRubric] = useState(false)

  // Filter assignments to only those with rubrics
  const courseAssignments = assignments.filter(
    (a) => (!selectedCourseId || a.courseId === selectedCourseId) && a.hasRubric
  )

  // Load rubric when assignment selected
  useEffect(() => {
    if (!selectedAssignment) {
      setRubricPreview(null)
      return
    }
    setLoadingRubric(true)
    ipc.getCanvasSubmissions(selectedAssignment.courseId, selectedAssignment.id)
      .then(() => setLoadingRubric(false))
      .catch(() => setLoadingRubric(false))
  }, [selectedAssignment])

  function handleStartGrading() {
    if (!selectedAssignment) return

    const sessionId = crypto.randomUUID()
    const course = courses.find((c) => c.id === selectedAssignment.courseId)

    startSession(
      {
        id:              sessionId,
        courseId:        selectedAssignment.courseId,
        courseName:      course?.name ?? 'Unknown Course',
        assignmentId:    selectedAssignment.id,
        assignmentName:  selectedAssignment.name,
        totalSubmissions: 0,
        totalPoints:     selectedAssignment.pointsPossible ?? 0,
        status:          'provisional',
        createdAt:       Date.now(),
      },
      [] // rubric will be fetched server-side
    )

    startProvisionalScoring(selectedAssignment.courseId, selectedAssignment.id)
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: '#154733', borderTopColor: '#FEE123' }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flex: 1, gap: '1px', background: '#2a3a32', minHeight: 0 }}>
      {/* Left: Course list */}
      <div style={{ width: '240px', background: '#0c1510', overflowY: 'auto', padding: '12px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#5a6b60', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', padding: '4px' }}>
          Courses
        </div>
        {courses.map((course) => {
          const active = selectedCourseId === course.id
          return (
            <button
              key={course.id}
              onClick={() => setSelectedCourseId(active ? null : course.id)}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '8px',
                width:        '100%',
                padding:      '8px',
                borderRadius: '6px',
                border:       'none',
                cursor:       'pointer',
                textAlign:    'left',
                background:   active ? 'rgba(21, 71, 51, 0.35)' : 'transparent',
                color:        active ? '#e8ede9' : '#8a9b90',
                fontSize:     '13px',
                transition:   'all 0.15s ease',
              }}
            >
              <BookOpen size={14} style={{ color: active ? '#FEE123' : '#5a6b60', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {course.name}
              </span>
            </button>
          )
        })}
      </div>

      {/* Right: Assignments with rubrics */}
      <div style={{ flex: 1, background: '#0a0f0d', overflowY: 'auto', padding: '16px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: '#5a6b60', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
          Assignments with Rubrics {courseAssignments.length > 0 && `(${courseAssignments.length})`}
        </div>

        {courseAssignments.length === 0 ? (
          <div style={{ color: '#5a6b60', fontSize: '13px', padding: '24px', textAlign: 'center' }}>
            {selectedCourseId ? 'No assignments with rubrics in this course.' : 'Select a course to see assignments.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {courseAssignments.map((assignment) => {
              const selected = selectedAssignment?.id === assignment.id
              return (
                <button
                  key={assignment.id}
                  onClick={() => setSelectedAssignment(selected ? null : assignment)}
                  style={{
                    display:      'flex',
                    alignItems:   'center',
                    gap:          '12px',
                    padding:      '12px',
                    borderRadius: '8px',
                    border:       `1px solid ${selected ? 'rgba(254, 225, 35, 0.3)' : '#2a3a32'}`,
                    background:   selected ? 'rgba(254, 225, 35, 0.06)' : '#111916',
                    cursor:       'pointer',
                    textAlign:    'left',
                    width:        '100%',
                    transition:   'all 0.15s ease',
                  }}
                >
                  <FileText size={16} style={{ color: selected ? '#FEE123' : '#5a6b60', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#e8ede9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {assignment.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#5a6b60', marginTop: '2px' }}>
                      {assignment.pointsPossible} pts
                      {assignment.dueAt && ` · Due ${new Date(assignment.dueAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <ChevronRight size={14} style={{ color: '#5a6b60', flexShrink: 0 }} />
                </button>
              )
            })}
          </div>
        )}

        {/* Start Grading Button */}
        {selectedAssignment && (
          <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleStartGrading}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '8px',
                padding:      '10px 24px',
                borderRadius: '8px',
                border:       'none',
                cursor:       'pointer',
                background:   '#FEE123',
                color:        '#154733',
                fontSize:     '13px',
                fontWeight:   700,
                transition:   'all 0.15s ease',
              }}
            >
              Start Grading
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
