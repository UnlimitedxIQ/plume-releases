import { useState, useMemo, useEffect } from 'react'
import { Check, Flag, ArrowRight, AlertTriangle } from 'lucide-react'
import { useGradingStore } from '../../stores/grading-store'
import SubmissionCard from './SubmissionCard'

const FAIL_THRESHOLD = 0.6 // Below 60% = flagged
const LOW_CONFIDENCE = 0.5

export default function ReviewQueue() {
  const {
    provisionalEvals,
    submissions,
    finalEvals,
    reviewQueue,
    addFinalEval,
    setReviewQueue,
    approveSubmission,
    updateFinalScore,
    updateFinalComment,
    setStep,
    session,
  } = useGradingStore()

  const [selectedId, setSelectedId] = useState<number | null>(null)

  // Initialize final evals from provisional evals and auto-flag
  useEffect(() => {
    if (Object.keys(finalEvals).length > 0) return

    const evals = Object.values(provisionalEvals)
    if (evals.length === 0) return

    const totalPoints = session?.totalPoints ?? 100
    const flagged: number[] = []

    for (const prov of evals) {
      const pct = totalPoints > 0 ? prov.overallScore / totalPoints : 0
      let flagReason: string | undefined
      let reviewStatus: 'pending' | 'approved' | 'flagged' = 'approved'

      if (prov.overallScore >= totalPoints) {
        flagReason = 'Perfect score'
        reviewStatus = 'flagged'
      } else if (pct < FAIL_THRESHOLD) {
        flagReason = `Below ${FAIL_THRESHOLD * 100}% threshold`
        reviewStatus = 'flagged'
      } else if (prov.confidence < LOW_CONFIDENCE) {
        flagReason = 'Low AI confidence'
        reviewStatus = 'flagged'
      }

      if (reviewStatus === 'flagged') {
        flagged.push(prov.submissionId)
      }

      addFinalEval({
        submissionId:    prov.submissionId,
        userId:          prov.userId,
        criterionScores: Object.fromEntries(
          Object.entries(prov.criterionScores).map(([k, v]) => [k, { points: v.points, comment: v.rationale }])
        ),
        overallScore:    prov.overallScore,
        finalComment:    prov.draftComment,
        reviewStatus,
        flagReason,
      })
    }

    setReviewQueue(flagged)
    if (flagged.length > 0) setSelectedId(flagged[0])
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const allEvals = useMemo(() => Object.values(finalEvals), [finalEvals])
  const flaggedCount = allEvals.filter((e) => e.reviewStatus === 'flagged').length
  const approvedCount = allEvals.filter((e) => e.reviewStatus === 'approved').length
  const pendingCount = allEvals.filter((e) => e.reviewStatus === 'pending').length

  const selected = selectedId ? finalEvals[selectedId] : null
  const selectedSubmission = selectedId ? submissions.find((s) => s.id === selectedId) : null
  const allResolved = flaggedCount === 0

  // Sort: flagged first, then pending, then approved
  const sortedEvals = useMemo(() =>
    [...allEvals].sort((a, b) => {
      const order = { flagged: 0, pending: 1, approved: 2 }
      return (order[a.reviewStatus] ?? 1) - (order[b.reviewStatus] ?? 1)
    }),
  [allEvals])

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: '#0a0f0d' }}>
      {/* Stats bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #1a2420' }}>
        <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
          <span style={{ color: '#e8ede9' }}>{allEvals.length} total</span>
          <span style={{ color: '#22c55e' }}>{approvedCount} approved</span>
          <span style={{ color: '#ef4444' }}>{flaggedCount} flagged</span>
          {pendingCount > 0 && <span style={{ color: '#f59e0b' }}>{pendingCount} pending</span>}
        </div>
        <button
          onClick={() => setStep('publish')}
          disabled={!allResolved}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '6px',
            padding:      '8px 16px',
            borderRadius: '6px',
            border:       'none',
            cursor:       allResolved ? 'pointer' : 'default',
            background:   allResolved ? '#FEE123' : '#1a2420',
            color:        allResolved ? '#154733' : '#5a6b60',
            fontSize:     '12px',
            fontWeight:   600,
          }}
        >
          Proceed to Publish <ArrowRight size={14} />
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, gap: '1px', background: '#2a3a32', minHeight: 0 }}>
        {/* Left: submission list */}
        <div style={{ width: '260px', background: '#0c1510', overflowY: 'auto', padding: '8px' }}>
          {sortedEvals.map((eval_) => (
            <button
              key={eval_.submissionId}
              onClick={() => setSelectedId(eval_.submissionId)}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          '8px',
                width:        '100%',
                padding:      '8px',
                borderRadius: '6px',
                border:       selectedId === eval_.submissionId ? '1px solid rgba(254, 225, 35, 0.3)' : '1px solid transparent',
                background:   selectedId === eval_.submissionId ? 'rgba(254, 225, 35, 0.06)' : 'transparent',
                cursor:       'pointer',
                textAlign:    'left',
                transition:   'all 0.15s ease',
              }}
            >
              <div style={{
                width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                background: eval_.reviewStatus === 'flagged' ? '#ef4444' : eval_.reviewStatus === 'approved' ? '#22c55e' : '#f59e0b',
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '12px', color: '#e8ede9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  Submission #{eval_.submissionId}
                </div>
                <div style={{ fontSize: '11px', color: '#5a6b60' }}>
                  {eval_.overallScore} pts{eval_.flagReason && ` · ${eval_.flagReason}`}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Center: submission detail */}
        <div style={{ flex: 1, background: '#0a0f0d', overflowY: 'auto', padding: '16px' }}>
          {selectedSubmission ? (
            <SubmissionCard body={selectedSubmission.body ?? null} submittedAt={selectedSubmission.submittedAt ?? null} />
          ) : (
            <div style={{ color: '#5a6b60', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
              Select a submission to review.
            </div>
          )}
        </div>

        {/* Right: evaluation detail */}
        <div style={{ width: '320px', background: '#0a0f0d', overflowY: 'auto', padding: '16px' }}>
          {selected ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Score & flag info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#FEE123' }}>{selected.overallScore} pts</span>
                {selected.flagReason && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#ef4444' }}>
                    <AlertTriangle size={12} /> {selected.flagReason}
                  </span>
                )}
              </div>

              {/* Per-criterion scores */}
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#5a6b60', textTransform: 'uppercase' }}>Criterion Scores</div>
              {Object.entries(selected.criterionScores).map(([id, score]) => (
                <div key={id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(42, 58, 50, 0.3)' }}>
                  <span style={{ fontSize: '12px', color: '#8a9b90' }}>{id}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#e8ede9' }}>{score.points}</span>
                </div>
              ))}

              {/* Comment */}
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#5a6b60', textTransform: 'uppercase', marginTop: '8px' }}>Comment</div>
              <textarea
                value={selected.finalComment}
                onChange={(e) => updateFinalComment(selected.submissionId, e.target.value)}
                style={{
                  width:        '100%',
                  minHeight:    '80px',
                  padding:      '8px',
                  borderRadius: '6px',
                  border:       '1px solid #2a3a32',
                  background:   '#111916',
                  color:        '#e8ede9',
                  fontSize:     '12px',
                  resize:       'vertical',
                  fontFamily:   'inherit',
                }}
              />

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button
                  onClick={() => approveSubmission(selected.submissionId)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                    background: selected.reviewStatus === 'approved' ? '#22c55e' : 'rgba(34, 197, 94, 0.1)',
                    color: selected.reviewStatus === 'approved' ? '#fff' : '#22c55e',
                    fontSize: '12px', fontWeight: 600,
                  }}
                >
                  <Check size={14} /> Approve
                </button>
              </div>
            </div>
          ) : (
            <div style={{ color: '#5a6b60', fontSize: '13px', textAlign: 'center', padding: '40px' }}>
              Select a submission to see details.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
