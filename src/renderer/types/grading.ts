// ── Teacher Mode Grading Types ────────────────────────────────────────────

export type GradingStep =
  | 'assignment-select'
  | 'provisional'
  | 'calibration'
  | 'recalibration'
  | 'review'
  | 'publish'

export interface GradingSession {
  id:              string
  courseId:        number
  courseName:      string
  assignmentId:    number
  assignmentName:  string
  totalSubmissions: number
  totalPoints:     number
  status:          GradingStep
  createdAt:       number
}

export interface ProvisionalEvaluation {
  submissionId:    number
  userId:          number
  criterionScores: Record<string, CriterionScore>
  overallScore:    number
  confidence:      number
  rationale:       string
  draftComment:    string
}

export interface CriterionScore {
  points:    number
  maxPoints: number
  rationale: string
}

export interface CalibrationAnchor {
  submissionId:   number
  userId:         number
  tier:           'top' | 'middle' | 'bottom'
  teacherScores:  Record<string, number>
  aiScores:       Record<string, number>
  deltas:         Record<string, number>
  teacherComment: string
}

export interface CalibrationResult {
  anchorsUsed:      number
  criterionDeltas:  Record<string, CriterionDelta>
  regradeStrategy:  'full' | 'partial' | 'none'
  criteriaToRegrade: string[]
}

export interface CriterionDelta {
  meanDelta:    number
  stdDev:       number
  needsRegrade: boolean
}

export interface FinalEvaluation {
  submissionId:    number
  userId:          number
  criterionScores: Record<string, { points: number; comment: string }>
  overallScore:    number
  finalComment:    string
  reviewStatus:    'pending' | 'approved' | 'flagged'
  flagReason?:     string
  publishedAt?:    number
}

export interface GradePayload {
  studentId:        number
  score:            number
  rubricAssessment: Record<string, { points: number }>
  comment:          string
}
