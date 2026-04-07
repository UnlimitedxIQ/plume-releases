// Main-process mirror of renderer grading types.
// Duplicated to avoid cross-process imports.

export type GradingStep =
  | 'assignment-select'
  | 'provisional'
  | 'calibration'
  | 'recalibration'
  | 'review'
  | 'publish'

export interface ProvisionalEvaluation {
  submissionId:    number
  userId:          number
  criterionScores: Record<string, { points: number; maxPoints: number; rationale: string }>
  overallScore:    number
  confidence:      number
  rationale:       string
  draftComment:    string
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
  criterionDeltas:  Record<string, { meanDelta: number; stdDev: number; needsRegrade: boolean }>
  regradeStrategy:  'full' | 'partial' | 'none'
  criteriaToRegrade: string[]
}

export interface FinalEvaluation {
  submissionId:    number
  userId:          number
  criterionScores: Record<string, { points: number; comment: string }>
  overallScore:    number
  finalComment:    string
  reviewStatus:    'pending' | 'approved' | 'flagged'
  flagReason?:     string
}
