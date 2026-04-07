import { getProviderManager } from '../providers/provider-manager'
import { PROVISIONAL_SCORING_PROMPT, buildRubricContext, buildSubmissionContext } from './prompt-templates'
import type { ProvisionalEvaluation } from './grading-types'
import type { CanvasSubmission, CanvasRubricCriterion } from '../canvas/canvas-client'

const MAX_RETRIES = 1

export async function scoreSubmission(
  submission: CanvasSubmission,
  rubric: CanvasRubricCriterion[]
): Promise<ProvisionalEvaluation> {
  const provider = getProviderManager()

  const rubricContext = buildRubricContext(rubric)
  const submissionContext = buildSubmissionContext(submission.body)
  const systemPrompt = PROVISIONAL_SCORING_PROMPT
  const message = `${rubricContext}\n\n${submissionContext}\n\nScore this submission against the rubric. Return ONLY valid JSON.`

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let fullResponse = ''

    try {
      for await (const event of provider.streamChat({
        message: attempt === 0 ? message : `${message}\n\nIMPORTANT: Your previous response was not valid JSON. Return ONLY a JSON object, no other text.`,
        systemPrompt,
      })) {
        if (event.type === 'text' && event.text) {
          fullResponse += event.text
        }
      }

      const parsed = extractJson(fullResponse)
      if (!parsed) {
        lastError = new Error('Failed to parse JSON from AI response')
        continue
      }

      return {
        submissionId:    submission.id,
        userId:          submission.user_id,
        criterionScores: (parsed.criterionScores as ProvisionalEvaluation['criterionScores']) ?? {},
        overallScore:    Number(parsed.overallScore) || 0,
        confidence:      Number(parsed.confidence) || 0.5,
        rationale:       String(parsed.rationale ?? ''),
        draftComment:    String(parsed.draftComment ?? ''),
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Scoring failed')
    }
  }

  // Return a low-confidence fallback if all attempts fail
  return {
    submissionId:    submission.id,
    userId:          submission.user_id,
    criterionScores: {},
    overallScore:    0,
    confidence:      0,
    rationale:       `Scoring failed: ${lastError?.message ?? 'Unknown error'}`,
    draftComment:    'Unable to generate automated feedback. Manual review required.',
  }
}

function extractJson(text: string): Record<string, unknown> | null {
  // Try parsing the whole text as JSON
  try {
    return JSON.parse(text.trim())
  } catch { /* continue */ }

  // Try extracting from markdown fences
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)```/)
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim())
    } catch { /* continue */ }
  }

  // Try finding the first { ... } block
  const braceStart = text.indexOf('{')
  const braceEnd = text.lastIndexOf('}')
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(text.slice(braceStart, braceEnd + 1))
    } catch { /* continue */ }
  }

  return null
}
