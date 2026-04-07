import { create } from 'zustand'
import type {
  GradingStep,
  GradingSession,
  ProvisionalEvaluation,
  CalibrationAnchor,
  CalibrationResult,
  FinalEvaluation,
} from '../types/grading'
import type { CanvasSubmission, RubricCriterion } from '../types/canvas'

interface ProvisionalProgress {
  completed: number
  total:     number
  current:   string
}

interface GradingState {
  // ── Session ──────────────────────────────────────────────────────────
  session:      GradingSession | null
  currentStep:  GradingStep
  rubricCriteria: RubricCriterion[]

  // ── Submissions ──────────────────────────────────────────────────────
  submissions:  CanvasSubmission[]

  // ── Provisional ──────────────────────────────────────────────────────
  provisionalEvals: Record<number, ProvisionalEvaluation>
  provisionalProgress: ProvisionalProgress

  // ── Calibration ──────────────────────────────────────────────────────
  calibrationAnchors: CalibrationAnchor[]
  calibrationResult:  CalibrationResult | null

  // ── Final ────────────────────────────────────────────────────────────
  finalEvals:   Record<number, FinalEvaluation>
  reviewQueue:  number[]

  // ── Meta ─────────────────────────────────────────────────────────────
  publishedCount: number
  error:          string | null
  isProcessing:   boolean

  // ── Actions ──────────────────────────────────────────────────────────
  startSession:           (session: GradingSession, rubric: RubricCriterion[]) => void
  setStep:                (step: GradingStep) => void
  setSubmissions:         (subs: CanvasSubmission[]) => void
  addProvisionalEval:     (eval_: ProvisionalEvaluation) => void
  updateProvisionalProgress: (progress: ProvisionalProgress) => void
  setCalibrationAnchors:  (anchors: CalibrationAnchor[]) => void
  updateAnchorTeacherScore: (submissionId: number, criterionId: string, points: number) => void
  setAnchorTeacherComment: (submissionId: number, comment: string) => void
  setCalibrationResult:   (result: CalibrationResult) => void
  addFinalEval:           (eval_: FinalEvaluation) => void
  setReviewQueue:         (ids: number[]) => void
  approveSubmission:      (submissionId: number) => void
  flagSubmission:         (submissionId: number, reason: string) => void
  updateFinalScore:       (submissionId: number, criterionId: string, points: number) => void
  updateFinalComment:     (submissionId: number, comment: string) => void
  incrementPublished:     () => void
  setError:               (error: string | null) => void
  setProcessing:          (processing: boolean) => void
  cancelSession:          () => void
}

const INITIAL_PROGRESS: ProvisionalProgress = { completed: 0, total: 0, current: '' }

export const useGradingStore = create<GradingState>()((set) => ({
  // Initial state
  session:              null,
  currentStep:          'assignment-select',
  rubricCriteria:       [],
  submissions:          [],
  provisionalEvals:     {},
  provisionalProgress:  { ...INITIAL_PROGRESS },
  calibrationAnchors:   [],
  calibrationResult:    null,
  finalEvals:           {},
  reviewQueue:          [],
  publishedCount:       0,
  error:                null,
  isProcessing:         false,

  // Actions
  startSession: (session, rubric) => set({
    session,
    rubricCriteria:      rubric,
    currentStep:         'assignment-select',
    submissions:         [],
    provisionalEvals:    {},
    provisionalProgress: { ...INITIAL_PROGRESS },
    calibrationAnchors:  [],
    calibrationResult:   null,
    finalEvals:          {},
    reviewQueue:         [],
    publishedCount:      0,
    error:               null,
    isProcessing:        false,
  }),

  setStep: (step) => set({ currentStep: step }),

  setSubmissions: (subs) => set({ submissions: subs }),

  addProvisionalEval: (eval_) => set((s) => ({
    provisionalEvals: { ...s.provisionalEvals, [eval_.submissionId]: eval_ },
  })),

  updateProvisionalProgress: (progress) => set({ provisionalProgress: progress }),

  setCalibrationAnchors: (anchors) => set({ calibrationAnchors: anchors }),

  updateAnchorTeacherScore: (submissionId, criterionId, points) => set((s) => ({
    calibrationAnchors: s.calibrationAnchors.map((a) =>
      a.submissionId === submissionId
        ? { ...a, teacherScores: { ...a.teacherScores, [criterionId]: points } }
        : a
    ),
  })),

  setAnchorTeacherComment: (submissionId, comment) => set((s) => ({
    calibrationAnchors: s.calibrationAnchors.map((a) =>
      a.submissionId === submissionId ? { ...a, teacherComment: comment } : a
    ),
  })),

  setCalibrationResult: (result) => set({ calibrationResult: result }),

  addFinalEval: (eval_) => set((s) => ({
    finalEvals: { ...s.finalEvals, [eval_.submissionId]: eval_ },
  })),

  setReviewQueue: (ids) => set({ reviewQueue: ids }),

  approveSubmission: (submissionId) => set((s) => ({
    finalEvals: {
      ...s.finalEvals,
      [submissionId]: s.finalEvals[submissionId]
        ? { ...s.finalEvals[submissionId], reviewStatus: 'approved' as const }
        : s.finalEvals[submissionId],
    },
    reviewQueue: s.reviewQueue.filter((id) => id !== submissionId),
  })),

  flagSubmission: (submissionId, reason) => set((s) => ({
    finalEvals: {
      ...s.finalEvals,
      [submissionId]: s.finalEvals[submissionId]
        ? { ...s.finalEvals[submissionId], reviewStatus: 'flagged' as const, flagReason: reason }
        : s.finalEvals[submissionId],
    },
    reviewQueue: s.reviewQueue.includes(submissionId)
      ? s.reviewQueue
      : [...s.reviewQueue, submissionId],
  })),

  updateFinalScore: (submissionId, criterionId, points) => set((s) => {
    const existing = s.finalEvals[submissionId]
    if (!existing) return s
    const updatedCriterion = { ...existing.criterionScores[criterionId], points }
    const updatedScores = { ...existing.criterionScores, [criterionId]: updatedCriterion }
    const overallScore = Object.values(updatedScores).reduce((sum, c) => sum + c.points, 0)
    return {
      finalEvals: {
        ...s.finalEvals,
        [submissionId]: { ...existing, criterionScores: updatedScores, overallScore },
      },
    }
  }),

  updateFinalComment: (submissionId, comment) => set((s) => {
    const existing = s.finalEvals[submissionId]
    if (!existing) return s
    return {
      finalEvals: { ...s.finalEvals, [submissionId]: { ...existing, finalComment: comment } },
    }
  }),

  incrementPublished: () => set((s) => ({ publishedCount: s.publishedCount + 1 })),

  setError: (error) => set({ error }),

  setProcessing: (processing) => set({ isProcessing: processing }),

  cancelSession: () => set({
    session:              null,
    currentStep:          'assignment-select',
    rubricCriteria:       [],
    submissions:          [],
    provisionalEvals:     {},
    provisionalProgress:  { ...INITIAL_PROGRESS },
    calibrationAnchors:   [],
    calibrationResult:    null,
    finalEvals:           {},
    reviewQueue:          [],
    publishedCount:       0,
    error:                null,
    isProcessing:         false,
  }),
}))
