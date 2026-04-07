import type { ProvisionalEvaluation, CalibrationResult, CalibrationAnchor } from './grading-types'

const MEANINGFUL_DELTA_THRESHOLD = 0.15 // 15% of max points for criterion

/**
 * Select 9 anchor submissions: top 3, middle 3, bottom 3 by provisional overall score.
 */
export function selectAnchors(
  evaluations: ProvisionalEvaluation[],
  count = 9
): Array<{ submissionId: number; userId: number; tier: 'top' | 'middle' | 'bottom'; overallScore: number }> {
  if (evaluations.length === 0) return []

  const sorted = [...evaluations].sort((a, b) => b.overallScore - a.overallScore)
  const perTier = Math.floor(count / 3)
  const result: Array<{ submissionId: number; userId: number; tier: 'top' | 'middle' | 'bottom'; overallScore: number }> = []

  // Top
  for (let i = 0; i < Math.min(perTier, sorted.length); i++) {
    result.push({ submissionId: sorted[i].submissionId, userId: sorted[i].userId, tier: 'top', overallScore: sorted[i].overallScore })
  }

  // Middle
  const midStart = Math.floor(sorted.length / 2) - Math.floor(perTier / 2)
  for (let i = midStart; i < midStart + perTier && i < sorted.length; i++) {
    if (!result.some((r) => r.submissionId === sorted[i].submissionId)) {
      result.push({ submissionId: sorted[i].submissionId, userId: sorted[i].userId, tier: 'middle', overallScore: sorted[i].overallScore })
    }
  }

  // Bottom
  for (let i = sorted.length - 1; i >= Math.max(0, sorted.length - perTier); i--) {
    if (!result.some((r) => r.submissionId === sorted[i].submissionId)) {
      result.push({ submissionId: sorted[i].submissionId, userId: sorted[i].userId, tier: 'bottom', overallScore: sorted[i].overallScore })
    }
  }

  return result.slice(0, count)
}

/**
 * Compare teacher and AI scores per criterion, determine regrade strategy.
 */
export function computeCalibration(
  anchors: CalibrationAnchor[],
  criterionMaxPoints: Record<string, number>
): CalibrationResult {
  if (anchors.length === 0) {
    return { anchorsUsed: 0, criterionDeltas: {}, regradeStrategy: 'none', criteriaToRegrade: [] }
  }

  // Collect all criterion IDs from anchors
  const criterionIds = new Set<string>()
  for (const anchor of anchors) {
    Object.keys(anchor.teacherScores).forEach((id) => criterionIds.add(id))
    Object.keys(anchor.aiScores).forEach((id) => criterionIds.add(id))
  }

  const criterionDeltas: CalibrationResult['criterionDeltas'] = {}
  const criteriaToRegrade: string[] = []

  for (const criterionId of criterionIds) {
    const deltas: number[] = []

    for (const anchor of anchors) {
      const teacherScore = anchor.teacherScores[criterionId]
      const aiScore = anchor.aiScores[criterionId]
      if (teacherScore !== undefined && aiScore !== undefined) {
        deltas.push(teacherScore - aiScore)
      }
    }

    if (deltas.length === 0) continue

    const meanDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length
    const variance = deltas.reduce((sum, d) => sum + (d - meanDelta) ** 2, 0) / deltas.length
    const stdDev = Math.sqrt(variance)

    const maxPts = criterionMaxPoints[criterionId] ?? 1
    const threshold = maxPts * MEANINGFUL_DELTA_THRESHOLD
    const needsRegrade = Math.abs(meanDelta) > threshold

    criterionDeltas[criterionId] = { meanDelta, stdDev, needsRegrade }

    if (needsRegrade) {
      criteriaToRegrade.push(criterionId)
    }
  }

  const totalCriteria = criterionIds.size
  let regradeStrategy: CalibrationResult['regradeStrategy'] = 'none'
  if (criteriaToRegrade.length > totalCriteria * 0.5) {
    regradeStrategy = 'full'
  } else if (criteriaToRegrade.length > 0) {
    regradeStrategy = 'partial'
  }

  return {
    anchorsUsed: anchors.length,
    criterionDeltas,
    regradeStrategy,
    criteriaToRegrade,
  }
}
