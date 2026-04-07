import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { useGradingStore } from '../../stores/grading-store'
import SubmissionCard from './SubmissionCard'
import CriterionSlider from './CriterionSlider'

export default function CalibrationView() {
  const {
    provisionalEvals,
    submissions,
    calibrationAnchors,
    setCalibrationAnchors,
    updateAnchorTeacherScore,
    setAnchorTeacherComment,
    setStep,
  } = useGradingStore()

  const [currentIdx, setCurrentIdx] = useState(0)

  // Initialize anchors from provisional evals if not yet done
  useMemo(() => {
    if (calibrationAnchors.length > 0) return

    const evals = Object.values(provisionalEvals)
    if (evals.length === 0) return

    // Sort by overall score descending
    const sorted = [...evals].sort((a, b) => b.overallScore - a.overallScore)
    const anchors = []

    // Top 3
    for (let i = 0; i < Math.min(3, sorted.length); i++) {
      anchors.push(makeAnchor(sorted[i], 'top'))
    }
    // Middle 3
    const mid = Math.floor(sorted.length / 2) - 1
    for (let i = Math.max(0, mid); i < Math.min(mid + 3, sorted.length); i++) {
      if (!anchors.some((a) => a.submissionId === sorted[i].submissionId)) {
        anchors.push(makeAnchor(sorted[i], 'middle'))
      }
    }
    // Bottom 3
    for (let i = sorted.length - 1; i >= Math.max(0, sorted.length - 3); i--) {
      if (!anchors.some((a) => a.submissionId === sorted[i].submissionId)) {
        anchors.push(makeAnchor(sorted[i], 'bottom'))
      }
    }

    setCalibrationAnchors(anchors.slice(0, 9))
  }, [provisionalEvals]) // eslint-disable-line react-hooks/exhaustive-deps

  const anchor = calibrationAnchors[currentIdx]
  const submission = submissions.find((s) => s.id === anchor?.submissionId)
  const provisional = anchor ? provisionalEvals[anchor.submissionId] : null

  // Check if all anchors have been fully scored
  const allScored = calibrationAnchors.every((a) => {
    const prov = provisionalEvals[a.submissionId]
    if (!prov) return false
    return Object.keys(prov.criterionScores).every((cId) => a.teacherScores[cId] !== undefined)
  })

  function handleProceedToCalibration() {
    // Compute deltas on anchors before proceeding
    const withDeltas = calibrationAnchors.map((a) => {
      const prov = provisionalEvals[a.submissionId]
      const deltas: Record<string, number> = {}
      if (prov) {
        for (const [cId, score] of Object.entries(prov.criterionScores)) {
          deltas[cId] = (a.teacherScores[cId] ?? score.points) - score.points
        }
      }
      return { ...a, deltas, aiScores: prov ? Object.fromEntries(Object.entries(prov.criterionScores).map(([k, v]) => [k, v.points])) : a.aiScores }
    })
    setCalibrationAnchors(withDeltas)
    setStep('recalibration')
  }

  if (!anchor || !submission) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: '#0a0f0d' }}>
        <p style={{ color: '#5a6b60' }}>No calibration anchors available.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: '#0a0f0d' }}>
      {/* Navigation header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid #1a2420' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'transparent', color: currentIdx === 0 ? '#2a3a32' : '#8a9b90', cursor: currentIdx === 0 ? 'default' : 'pointer' }}
          >
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontSize: '13px', color: '#e8ede9', fontWeight: 600 }}>
            Anchor {currentIdx + 1} of {calibrationAnchors.length}
          </span>
          <button
            onClick={() => setCurrentIdx(Math.min(calibrationAnchors.length - 1, currentIdx + 1))}
            disabled={currentIdx >= calibrationAnchors.length - 1}
            style={{ padding: '4px', borderRadius: '4px', border: 'none', background: 'transparent', color: currentIdx >= calibrationAnchors.length - 1 ? '#2a3a32' : '#8a9b90', cursor: currentIdx >= calibrationAnchors.length - 1 ? 'default' : 'pointer' }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Anchor dots */}
          {calibrationAnchors.map((a, i) => {
            const prov = provisionalEvals[a.submissionId]
            const scored = prov && Object.keys(prov.criterionScores).every((cId) => a.teacherScores[cId] !== undefined)
            return (
              <button
                key={a.submissionId}
                onClick={() => setCurrentIdx(i)}
                style={{
                  width:        '8px',
                  height:       '8px',
                  borderRadius: '50%',
                  border:       'none',
                  cursor:       'pointer',
                  background:   i === currentIdx ? '#FEE123' : scored ? '#22c55e' : '#2a3a32',
                  padding:      0,
                }}
              />
            )
          })}
        </div>

        <button
          onClick={handleProceedToCalibration}
          disabled={!allScored}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
            padding:      '8px 16px',
            borderRadius: '6px',
            border:       'none',
            cursor:       allScored ? 'pointer' : 'default',
            background:   allScored ? '#FEE123' : '#1a2420',
            color:        allScored ? '#154733' : '#5a6b60',
            fontSize:     '12px',
            fontWeight:   600,
          }}
        >
          <Check size={14} />
          Calibrate ({calibrationAnchors.filter((a) => {
            const prov = provisionalEvals[a.submissionId]
            return prov && Object.keys(prov.criterionScores).every((cId) => a.teacherScores[cId] !== undefined)
          }).length}/{calibrationAnchors.length})
        </button>
      </div>

      {/* Content: submission + scoring */}
      <div style={{ display: 'flex', flex: 1, gap: '1px', background: '#2a3a32', minHeight: 0, overflow: 'hidden' }}>
        {/* Left: submission text */}
        <div style={{ flex: 1, background: '#0a0f0d', overflowY: 'auto', padding: '16px' }}>
          <SubmissionCard
            body={submission.body ?? null}
            submittedAt={submission.submittedAt ?? null}
            tier={anchor.tier}
            index={calibrationAnchors.filter((a) => a.tier === anchor.tier).indexOf(anchor)}
          />
          {provisional && (
            <div style={{ marginTop: '12px', padding: '10px', borderRadius: '6px', background: '#111916', border: '1px solid #2a3a32' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#5a6b60', marginBottom: '4px' }}>AI Draft Comment</div>
              <div style={{ fontSize: '12px', color: '#8a9b90', lineHeight: 1.5 }}>{provisional.draftComment}</div>
            </div>
          )}
        </div>

        {/* Right: scoring panel */}
        <div style={{ width: '400px', background: '#0a0f0d', overflowY: 'auto', padding: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#5a6b60', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
            Score Each Criterion
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {provisional && Object.entries(provisional.criterionScores).map(([criterionId, score]) => (
              <CriterionSlider
                key={criterionId}
                criterionId={criterionId}
                description={criterionId}
                maxPoints={score.maxPoints}
                ratings={generateRatingsFromMax(score.maxPoints)}
                teacherScore={anchor.teacherScores[criterionId]}
                aiScore={score.points}
                onScore={(cId, pts) => updateAnchorTeacherScore(anchor.submissionId, cId, pts)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function makeAnchor(
  eval_: { submissionId: number; userId: number; criterionScores: Record<string, { points: number }>; overallScore: number },
  tier: 'top' | 'middle' | 'bottom'
) {
  return {
    submissionId:   eval_.submissionId,
    userId:         eval_.userId,
    tier,
    teacherScores:  {} as Record<string, number>,
    aiScores:       Object.fromEntries(Object.entries(eval_.criterionScores).map(([k, v]) => [k, v.points])),
    deltas:         {} as Record<string, number>,
    teacherComment: '',
  }
}

// Generate simple rating options from max points
function generateRatingsFromMax(maxPoints: number): Array<{ id: string; description: string; points: number }> {
  if (maxPoints <= 0) return [{ id: '0', description: 'No credit', points: 0 }]
  const ratings = []
  const step = maxPoints <= 5 ? 1 : Math.ceil(maxPoints / 5)
  for (let p = maxPoints; p >= 0; p -= step) {
    const pct = Math.round((p / maxPoints) * 100)
    let desc = 'No credit'
    if (pct === 100) desc = 'Exemplary'
    else if (pct >= 75) desc = 'Proficient'
    else if (pct >= 50) desc = 'Developing'
    else if (pct > 0) desc = 'Beginning'
    ratings.push({ id: String(p), description: desc, points: p })
  }
  // Ensure 0 is always included
  if (!ratings.some((r) => r.points === 0)) {
    ratings.push({ id: '0', description: 'No credit', points: 0 })
  }
  return ratings
}
