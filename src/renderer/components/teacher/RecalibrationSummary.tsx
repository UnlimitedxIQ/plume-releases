import { useMemo } from 'react'
import { ArrowRight, Check, AlertTriangle, RefreshCw } from 'lucide-react'
import { useGradingStore } from '../../stores/grading-store'
import type { CalibrationResult } from '../../types/grading'

export default function RecalibrationSummary() {
  const {
    calibrationAnchors,
    provisionalEvals,
    setCalibrationResult,
    setStep,
  } = useGradingStore()

  // Compute calibration result
  const result = useMemo((): CalibrationResult => {
    if (calibrationAnchors.length === 0) {
      return { anchorsUsed: 0, criterionDeltas: {}, regradeStrategy: 'none', criteriaToRegrade: [] }
    }

    const criterionIds = new Set<string>()
    for (const anchor of calibrationAnchors) {
      Object.keys(anchor.teacherScores).forEach((id) => criterionIds.add(id))
    }

    const criterionDeltas: CalibrationResult['criterionDeltas'] = {}
    const criteriaToRegrade: string[] = []

    for (const id of criterionIds) {
      const deltas: number[] = []
      let maxPts = 0

      for (const anchor of calibrationAnchors) {
        const teacher = anchor.teacherScores[id]
        const ai = anchor.aiScores[id]
        if (teacher !== undefined && ai !== undefined) {
          deltas.push(teacher - ai)
        }
        const prov = provisionalEvals[anchor.submissionId]
        if (prov?.criterionScores[id]) {
          maxPts = Math.max(maxPts, prov.criterionScores[id].maxPoints)
        }
      }

      if (deltas.length === 0) continue

      const mean = deltas.reduce((s, d) => s + d, 0) / deltas.length
      const variance = deltas.reduce((s, d) => s + (d - mean) ** 2, 0) / deltas.length
      const stdDev = Math.sqrt(variance)
      const threshold = (maxPts || 1) * 0.15
      const needsRegrade = Math.abs(mean) > threshold

      criterionDeltas[id] = { meanDelta: mean, stdDev, needsRegrade }
      if (needsRegrade) criteriaToRegrade.push(id)
    }

    const total = criterionIds.size
    const strategy = criteriaToRegrade.length > total * 0.5 ? 'full' : criteriaToRegrade.length > 0 ? 'partial' : 'none'

    return { anchorsUsed: calibrationAnchors.length, criterionDeltas, regradeStrategy: strategy as CalibrationResult['regradeStrategy'], criteriaToRegrade }
  }, [calibrationAnchors, provisionalEvals])

  function handleProceed() {
    setCalibrationResult(result)
    setStep('review')
  }

  const strategyLabel = {
    none:    'No regrade needed — AI and teacher are aligned.',
    partial: `Partial regrade — ${result.criteriaToRegrade.length} criteria will be recalibrated.`,
    full:    'Full regrade — majority of criteria need adjustment.',
  }

  const strategyColor = {
    none:    '#22c55e',
    partial: '#f59e0b',
    full:    '#ef4444',
  }

  return (
    <div className="flex-1 flex flex-col" style={{ background: '#0a0f0d', padding: '24px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#e8ede9', margin: '0 0 4px' }}>Calibration Results</h2>
      <p style={{ fontSize: '13px', color: '#5a6b60', margin: '0 0 20px' }}>
        Based on {result.anchorsUsed} anchor submissions you graded.
      </p>

      {/* Strategy banner */}
      <div
        style={{
          padding:      '12px 16px',
          borderRadius: '8px',
          background:   `${strategyColor[result.regradeStrategy]}11`,
          border:       `1px solid ${strategyColor[result.regradeStrategy]}33`,
          color:        strategyColor[result.regradeStrategy],
          fontSize:     '13px',
          fontWeight:   500,
          marginBottom: '20px',
          display:      'flex',
          alignItems:   'center',
          gap:          '8px',
        }}
      >
        {result.regradeStrategy === 'none' ? <Check size={16} /> : result.regradeStrategy === 'partial' ? <RefreshCw size={16} /> : <AlertTriangle size={16} />}
        {strategyLabel[result.regradeStrategy]}
      </div>

      {/* Criterion deltas table */}
      <div style={{ border: '1px solid #2a3a32', borderRadius: '8px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 80px', padding: '8px 12px', background: '#111916', borderBottom: '1px solid #2a3a32' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#5a6b60', textTransform: 'uppercase' }}>Criterion</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#5a6b60', textTransform: 'uppercase', textAlign: 'center' }}>Mean Delta</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#5a6b60', textTransform: 'uppercase', textAlign: 'center' }}>Std Dev</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#5a6b60', textTransform: 'uppercase', textAlign: 'center' }}>Action</span>
        </div>
        {Object.entries(result.criterionDeltas).map(([id, delta]) => (
          <div
            key={id}
            style={{
              display:            'grid',
              gridTemplateColumns: '1fr 100px 100px 80px',
              padding:            '8px 12px',
              borderBottom:       '1px solid rgba(42, 58, 50, 0.3)',
              background:         delta.needsRegrade ? 'rgba(245, 158, 11, 0.04)' : 'transparent',
            }}
          >
            <span style={{ fontSize: '13px', color: '#e8ede9' }}>{id}</span>
            <span
              style={{
                fontSize:   '13px',
                fontWeight: 600,
                textAlign:  'center',
                color:      Math.abs(delta.meanDelta) > 1 ? '#ef4444' : Math.abs(delta.meanDelta) > 0.5 ? '#f59e0b' : '#22c55e',
              }}
            >
              {delta.meanDelta > 0 ? '+' : ''}{delta.meanDelta.toFixed(1)}
            </span>
            <span style={{ fontSize: '13px', color: '#5a6b60', textAlign: 'center' }}>{delta.stdDev.toFixed(1)}</span>
            <span
              style={{
                fontSize:   '11px',
                fontWeight: 600,
                textAlign:  'center',
                color:      delta.needsRegrade ? '#f59e0b' : '#22c55e',
              }}
            >
              {delta.needsRegrade ? 'Regrade' : 'Aligned'}
            </span>
          </div>
        ))}
      </div>

      {/* Proceed button */}
      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleProceed}
          style={{
            display:      'flex',
            alignItems:   'center',
            gap:          '8px',
            padding:      '10px 24px',
            borderRadius: '8px',
            border:       'none',
            cursor:       'pointer',
            background:   '#FEE123',
            color:        '#154733',
            fontSize:     '13px',
            fontWeight:   700,
          }}
        >
          Proceed to Review
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
