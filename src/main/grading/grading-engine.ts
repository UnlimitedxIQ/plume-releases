import type { BrowserWindow } from 'electron'
import { scoreSubmission } from './provisional-scorer'
import type { ProvisionalEvaluation } from './grading-types'
import type { CanvasSubmission, CanvasRubricCriterion } from '../canvas/canvas-client'

export class GradingEngine {
  private window: BrowserWindow
  private cancelled = false

  constructor(window: BrowserWindow) {
    this.window = window
  }

  async startProvisionalScoring(
    sessionId: string,
    submissions: CanvasSubmission[],
    rubric: CanvasRubricCriterion[]
  ): Promise<ProvisionalEvaluation[]> {
    this.cancelled = false
    const evaluations: ProvisionalEvaluation[] = []
    const total = submissions.length

    for (let i = 0; i < submissions.length; i++) {
      if (this.cancelled) {
        this.emit('grading:cancelled', { sessionId })
        return evaluations
      }

      const submission = submissions[i]

      // Emit progress
      this.emit('grading:provisional-progress', {
        sessionId,
        completed: i,
        total,
        current: `Submission ${i + 1} of ${total}`,
        submissionId: submission.id,
      })

      // Skip unsubmitted
      if (submission.workflow_state === 'unsubmitted' || !submission.body) {
        continue
      }

      try {
        const evaluation = await scoreSubmission(submission, rubric)
        evaluations.push(evaluation)

        // Emit individual result
        this.emit('grading:provisional-eval', { sessionId, evaluation })
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Scoring failed'
        this.emit('grading:provisional-error', {
          sessionId,
          submissionId: submission.id,
          error: msg,
        })
      }
    }

    // Emit completion
    this.emit('grading:provisional-complete', {
      sessionId,
      total: evaluations.length,
      evaluations,
    })

    return evaluations
  }

  cancel(): void {
    this.cancelled = true
  }

  private emit(channel: string, data: Record<string, unknown>): void {
    this.window.webContents.send(channel, data)
  }
}
