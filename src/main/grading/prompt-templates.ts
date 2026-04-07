// ── Grading Prompt Templates ──────────────────────────────────────────────

export const PROVISIONAL_SCORING_PROMPT = `You are a rubric grading assistant. Score the following student submission against the provided rubric.

## Rules
- Score each criterion INDEPENDENTLY using the rubric rating levels.
- Assign points that match the closest rubric rating. Do NOT invent scores between rating levels.
- Provide a brief rationale (1-2 sentences) for each criterion score.
- Rate your confidence from 0.0 to 1.0:
  - 1.0 = clear rubric match, unambiguous
  - 0.7 = reasonable match with minor judgment calls
  - 0.5 = ambiguous — could go either way
  - Below 0.3 = unable to assess (incomplete submission, off-topic, etc.)
- Write a draft comment (2-4 sentences) explaining what prevented full marks, using rubric language.
- If the submission earned full marks on all criteria, the comment should acknowledge strengths.
- Do NOT use generic filler like "good job" or "needs improvement" without specifics.

## Response Format
Respond with ONLY a JSON object (no markdown fences, no explanation):
{
  "criterionScores": {
    "<criterionId>": { "points": <number>, "maxPoints": <number>, "rationale": "<string>" }
  },
  "overallScore": <number>,
  "confidence": <number>,
  "rationale": "<brief overall assessment>",
  "draftComment": "<student-facing comment>"
}`

export const CALIBRATED_SCORING_PROMPT = `You are a rubric grading assistant performing calibrated scoring. A teacher has reviewed anchor submissions and identified scoring adjustments needed.

## Calibration Adjustments
The following criteria need adjustment based on teacher calibration:
{CALIBRATION_OFFSETS}

Apply these adjustments when scoring. If a criterion had a positive delta, the teacher scored higher than AI — be more generous on that dimension. If negative, be stricter.

## Rules
- Score each criterion INDEPENDENTLY using the rubric rating levels AND calibration adjustments.
- Provide rationale for each score.
- Rate your confidence from 0.0 to 1.0.
- Write a student-facing comment using rubric language.

## Response Format
Respond with ONLY a JSON object:
{
  "criterionScores": {
    "<criterionId>": { "points": <number>, "maxPoints": <number>, "rationale": "<string>" }
  },
  "overallScore": <number>,
  "confidence": <number>,
  "rationale": "<brief overall assessment>",
  "draftComment": "<student-facing comment>"
}`

export const COMMENT_GENERATION_PROMPT = `Generate a student-facing rubric comment for this graded submission.

## Rules
- Reference specific rubric criteria by name.
- Explain what prevented full marks on criteria that lost points.
- Acknowledge strengths on criteria that scored well.
- Use rubric language (e.g., "Organization met developing level rather than exemplary").
- 2-4 sentences. Concise but specific.
- Do NOT use generic filler like "good job overall" without specifics.

## Response Format
Respond with ONLY the comment text (no JSON, no markdown).`

export function buildRubricContext(rubric: Array<{ id: string; description: string; long_description: string; points: number; ratings: Array<{ id: string; description: string; long_description: string; points: number }> }>): string {
  const lines: string[] = ['## Rubric']
  for (const criterion of rubric) {
    lines.push(`\n### ${criterion.description} (${criterion.points} pts max)`)
    if (criterion.long_description) {
      lines.push(criterion.long_description)
    }
    lines.push('Rating levels:')
    for (const rating of criterion.ratings) {
      lines.push(`  - ${rating.description}: ${rating.points} pts${rating.long_description ? ` — ${rating.long_description}` : ''}`)
    }
  }
  return lines.join('\n')
}

export function buildSubmissionContext(body: string | null, wordLimit = 3000): string {
  if (!body) return '## Student Submission\n[No text content — submission may be file-based]'
  const trimmed = body.length > wordLimit ? body.slice(0, wordLimit) + '\n[... truncated]' : body
  return `## Student Submission\n${trimmed}`
}

export function buildCalibrationOffsets(deltas: Record<string, { meanDelta: number; needsRegrade: boolean }>, criteriaNames: Record<string, string>): string {
  const lines: string[] = []
  for (const [id, delta] of Object.entries(deltas)) {
    if (delta.needsRegrade) {
      const name = criteriaNames[id] ?? id
      const direction = delta.meanDelta > 0 ? 'higher (more generous)' : 'lower (stricter)'
      lines.push(`- ${name}: teacher scored ${Math.abs(delta.meanDelta).toFixed(1)} pts ${direction} than AI`)
    }
  }
  return lines.length > 0 ? lines.join('\n') : 'No significant adjustments needed.'
}
