// ── Canvas LMS Types ───────────────────────────────────────────────────────
// Mirror of the main-process Canvas types for use in the renderer.

export interface CanvasCourse {
  id:           number
  name:         string
  courseCode:   string
  enrollmentTerm?: string
  imageUrl?:    string
  isPublished?: boolean
}

export interface CanvasAssignment {
  id:              number
  courseId:        number
  courseName?:     string
  name:            string
  description:     string
  dueAt:           string | null
  lockAt:          string | null
  pointsPossible:  number | null
  submissionTypes: SubmissionType[]
  htmlUrl:         string
  hasRubric:       boolean
  rubric?:         Rubric
  submissionStatus?: SubmissionStatus
  isPublished:     boolean
  allowedAttempts: number | null
}

export type SubmissionType =
  | 'online_text_entry'
  | 'online_upload'
  | 'online_url'
  | 'media_recording'
  | 'none'
  | 'on_paper'
  | 'discussion_topic'
  | 'external_tool'
  | 'not_graded'

export type SubmissionStatus =
  | 'submitted'
  | 'graded'
  | 'pending_review'
  | 'unsubmitted'
  | 'late'
  | 'missing'

// ── Rubric ────────────────────────────────────────────────────────────────

export interface Rubric {
  id:       string
  title:    string
  points:   number
  criteria: RubricCriterion[]
}

export interface RubricCriterion {
  id:          string
  description: string
  longDescription?: string
  points:      number
  ratings:     RubricRating[]
  ignoreForScoring?: boolean
}

export interface RubricRating {
  id:          string
  description: string
  longDescription?: string
  points:      number
}

// ── Canvas Module ─────────────────────────────────────────────────────────

export interface CanvasModule {
  id:       number
  courseId: number
  name:     string
  position: number
  items:    CanvasModuleItem[]
}

export interface CanvasModuleItem {
  id:          number
  moduleId:    number
  title:       string
  type:        'Assignment' | 'Quiz' | 'File' | 'Page' | 'Discussion' | 'ExternalUrl' | 'ExternalTool' | 'SubHeader'
  contentId?:  number
  htmlUrl?:    string
  dueAt?:      string | null
  pointsPossible?: number | null
}

// ── Canvas File ───────────────────────────────────────────────────────────

export interface CanvasFile {
  id:          number
  displayName: string
  filename:    string
  contentType: string
  size:        number
  url:         string
  updatedAt:   string
}

// ── Submission (Teacher Mode) ─────────────────────────────────────────────

export interface CanvasSubmission {
  id:                 number
  userId:             number
  assignmentId:       number
  body:               string | null
  url:                string | null
  submittedAt:        string | null
  score:              number | null
  grade:              string | null
  workflowState:      SubmissionStatus
  late:               boolean
  missing:            boolean
  attempt:            number | null
  attachments:        CanvasFile[]
  submissionComments: SubmissionComment[]
  rubricAssessment:   Record<string, { points: number; comments?: string }> | null
  userName?:          string
}

export interface SubmissionComment {
  id:         number
  authorName: string
  comment:    string
  createdAt:  string
}

// ── Helpers ───────────────────────────────────────────────────────────────

export function isOverdue(assignment: CanvasAssignment): boolean {
  if (!assignment.dueAt) return false
  return new Date(assignment.dueAt) < new Date() &&
    assignment.submissionStatus !== 'submitted' &&
    assignment.submissionStatus !== 'graded'
}

export function isDueToday(assignment: CanvasAssignment): boolean {
  if (!assignment.dueAt) return false
  const due = new Date(assignment.dueAt)
  const now = new Date()
  return due.getDate() === now.getDate() &&
    due.getMonth() === now.getMonth() &&
    due.getFullYear() === now.getFullYear()
}

export function submissionTypeLabel(type: SubmissionType): string {
  const labels: Record<SubmissionType, string> = {
    online_text_entry: 'Text Entry',
    online_upload:     'File Upload',
    online_url:        'URL',
    media_recording:   'Media',
    none:              'None',
    on_paper:          'On Paper',
    discussion_topic:  'Discussion',
    external_tool:     'External Tool',
    not_graded:        'Not Graded',
  }
  return labels[type] ?? type
}
