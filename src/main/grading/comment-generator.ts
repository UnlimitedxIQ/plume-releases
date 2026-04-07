import { getProviderManager } from '../providers/provider-manager'
import { COMMENT_GENERATION_PROMPT, buildRubricContext, buildSubmissionContext } from './prompt-templates'
import type { FinalEvaluation } from './grading-types'
import type { CanvasSubmission, CanvasRubricCriterion } from '../canvas/canvas-client'

export async function generateComment(
  submission: CanvasSubmission,
  evaluation: FinalEvaluation,
  rubric: CanvasRubricCriterion[]
): Promise<string> {
  const provider = getProviderManager()

  const rubricContext = buildRubricContext(rubric)
  const submissionContext = buildSubmissionContext(submission.body, 1500)

  // Build score summary for context
  const scoreLines = Object.entries(evaluation.criterionScores).map(([id, score]) => {
    const criterion = rubric.find((c) => c.id === id)
    const name = criterion?.description ?? id
    const max = criterion?.points ?? 0
    return `  - ${name}: ${score.points}/${max}`
  })

  const message = `${rubricContext}\n\n${submissionContext}\n\n## Scores Assigned\n${scoreLines.join('\n')}\n\nOverall: ${evaluation.overallScore} points\n\nGenerate a student-facing comment.`

  let comment = ''
  try {
    for await (const event of provider.streamChat({
      message,
      systemPrompt: COMMENT_GENERATION_PROMPT,
    })) {
      if (event.type === 'text' && event.text) {
        comment += event.text
      }
    }
  } catch {
    comment = evaluation.finalComment || 'Please review your rubric scores above for feedback on each criterion.'
  }

  return comment.trim()
}
