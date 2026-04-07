import { useState, useMemo } from 'react'
import { Send, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react'
import { ipc } from '../../lib/ipc'
import { useGradingStore } from '../../stores/grading-store'

type PublishState = 'preview' | 'publishing' | 'done' | 'error'

export default function PublishSummary() {
  const {
    finalEvals,
    session,
    incrementPublished,
    publishedCount,
    cancelSession,
  } = useGradingStore()

  const [state, setState] = useState<PublishState>('preview')
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [publishError, setPublishError] = useState<string | null>(null)
  const [failedCount, setFailedCount] = useState(0)

  const evals = useMemo(() => Object.values(finalEvals), [finalEvals])
  const approved = evals.filter((e) => e.reviewStatus === 'approved')

  // Score distribution
  const scores = approved.map((e) => e.overallScore)
  const mean = scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : 0
  const median = scores.length > 0 ? [...scores].sort((a, b) => a - b)[Math.floor(scores.length / 2)] : 0
  const maxScore = session?.totalPoints ?? Math.max(...scores, 0)

  // Simple histogram bins (5 bins)
  const bins = useMemo(() => {
    if (maxScore === 0) return []
    const binCount = 5
    const binSize = maxScore / binCount
    const result = Array.from({ length: binCount }, (_, i) => ({
      label: `${Math.round(i * binSize)}-${Math.round((i + 1) * binSize)}`,
      count: 0,
    }))
    for (const score of scores) {
      const bin = Math.min(Math.floor(score / binSize), binCount - 1)
      result[bin].count++
    }
    return result
  }, [scores, maxScore])

  const maxBinCount = Math.max(...bins.map((b) => b.count), 1)

  async function handlePublish() {
    if (!session) return
    setState('publishing')
    setProgress({ current: 0, total: approved.length })
    setFailedCount(0)

    const payloads = approved.map((e) => ({
      studentId:        e.userId,
      score:            e.overallScore,
      rubricAssessment: Object.fromEntries(
        Object.entries(e.criterionScores).map(([k, v]) => [k, { points: v.points }])
      ),
      comment: e.finalComment,
    }))

    try {
      const result = await ipc.bulkUpdateCanvasGrades(session.courseId, session.assignmentId, payloads)
      setProgress({ current: approved.length, total: approved.length })
      setFailedCount(result.failed)

      for (let i = 0; i < result.succeeded; i++) {
        incrementPublished()
      }

      setState(result.failed > 0 ? 'error' : 'done')
      if (result.failed > 0) {
        setPublishError(`${result.failed} grade(s) failed to publish. Check Canvas for details.`)
      }
    } catch (error) {
      setState('error')
      setPublishError(error instanceof Error ? error.message : 'Publishing failed')
    }
  }

  function handleDone() {
    cancelSession()
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center" style={{ background: '#0a0f0d', padding: '40px' }}>
      <div style={{ maxWidth: '500px', width: '100%' }}>
        {state === 'preview' && (
          <>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e8ede9', margin: '0 0 4px' }}>
              Ready to Publish
            </h2>
            <p style={{ fontSize: '13px', color: '#5a6b60', margin: '0 0 24px' }}>
              {session?.assignmentName} &middot; {session?.courseName}
            </p>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Submissions', value: String(approved.length) },
                { label: 'Mean', value: mean.toFixed(1) },
                { label: 'Median', value: median.toFixed(1) },
              ].map((stat) => (
                <div key={stat.label} style={{ padding: '12px', borderRadius: '8px', background: '#111916', border: '1px solid #2a3a32', textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#FEE123' }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: '#5a6b60', marginTop: '2px' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Histogram */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#5a6b60', textTransform: 'uppercase', marginBottom: '8px' }}>Score Distribution</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '80px' }}>
                {bins.map((bin, i) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <div
                      style={{
                        width:        '100%',
                        height:       `${(bin.count / maxBinCount) * 60}px`,
                        minHeight:    bin.count > 0 ? '4px' : '0',
                        borderRadius: '3px 3px 0 0',
                        background:   'linear-gradient(180deg, #006747, #154733)',
                      }}
                    />
                    <span style={{ fontSize: '9px', color: '#5a6b60' }}>{bin.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Publish button */}
            <button
              onClick={handlePublish}
              style={{
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                gap:          '8px',
                width:        '100%',
                padding:      '12px',
                borderRadius: '8px',
                border:       'none',
                cursor:       'pointer',
                background:   '#FEE123',
                color:        '#154733',
                fontSize:     '14px',
                fontWeight:   700,
              }}
            >
              <Send size={16} />
              Publish {approved.length} Grades to Canvas
            </button>
          </>
        )}

        {state === 'publishing' && (
          <div style={{ textAlign: 'center' }}>
            <div className="w-10 h-10 border-2 rounded-full animate-spin mx-auto" style={{ borderColor: '#154733', borderTopColor: '#FEE123', marginBottom: '16px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#e8ede9', margin: '0 0 8px' }}>Publishing Grades...</h2>
            <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: '#1a2420', overflow: 'hidden', marginTop: '16px' }}>
              <div style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`, height: '100%', background: '#FEE123', transition: 'width 0.3s' }} />
            </div>
            <p style={{ fontSize: '12px', color: '#5a6b60', marginTop: '8px' }}>{progress.current} of {progress.total}</p>
          </div>
        )}

        {state === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <CheckCircle2 size={48} style={{ color: '#22c55e', marginBottom: '16px' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#e8ede9', margin: '0 0 8px' }}>Grades Published</h2>
            <p style={{ fontSize: '13px', color: '#8a9b90', marginBottom: '24px' }}>
              {approved.length} grades and comments pushed to Canvas.
            </p>
            <button
              onClick={handleDone}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #2a3a32', cursor: 'pointer',
                background: '#111916', color: '#e8ede9', fontSize: '13px', fontWeight: 600,
              }}
            >
              <RotateCcw size={14} /> Grade Another Assignment
            </button>
          </div>
        )}

        {state === 'error' && (
          <div style={{ textAlign: 'center' }}>
            <AlertCircle size={48} style={{ color: '#ef4444', marginBottom: '16px' }} />
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#e8ede9', margin: '0 0 8px' }}>Publishing Error</h2>
            <p style={{ fontSize: '13px', color: '#ef4444', marginBottom: '24px' }}>{publishError}</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handlePublish}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: '#FEE123', color: '#154733', fontSize: '12px', fontWeight: 600 }}
              >
                Retry
              </button>
              <button
                onClick={handleDone}
                style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #2a3a32', background: 'transparent', color: '#8a9b90', fontSize: '12px', cursor: 'pointer' }}
              >
                Back to Start
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
