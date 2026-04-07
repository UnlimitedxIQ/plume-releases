import { useEffect, useCallback } from 'react'
import { ipc } from '../lib/ipc'
import { useGradingStore } from '../stores/grading-store'
import type { GradingProgressEvent, GradingEvalEvent, GradingCompleteEvent } from '../lib/ipc'
import type { ProvisionalEvaluation } from '../types/grading'

export function useGrading() {
  const store = useGradingStore()

  // Subscribe to grading IPC events
  useEffect(() => {
    const unsubs: Array<() => void> = []

    unsubs.push(
      ipc.onGradingProgress((data: GradingProgressEvent) => {
        store.updateProvisionalProgress({
          completed: data.completed,
          total:     data.total,
          current:   data.current,
        })
      })
    )

    unsubs.push(
      ipc.onGradingEval((data: GradingEvalEvent) => {
        store.addProvisionalEval(data.evaluation as ProvisionalEvaluation)
      })
    )

    unsubs.push(
      ipc.onGradingComplete((data: GradingCompleteEvent) => {
        store.updateProvisionalProgress({
          completed: data.total,
          total:     data.total,
          current:   'Complete',
        })
        store.setProcessing(false)
        store.setStep('calibration')
      })
    )

    unsubs.push(
      ipc.onGradingError((data) => {
        store.setError(data.error)
        store.setProcessing(false)
      })
    )

    return () => unsubs.forEach((fn) => fn())
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startProvisionalScoring = useCallback(
    (courseId: number, assignmentId: number) => {
      const sessionId = store.session?.id ?? crypto.randomUUID()
      store.setProcessing(true)
      store.setStep('provisional')
      store.setError(null)
      ipc.gradingStartProvisional({ sessionId, courseId, assignmentId })
    },
    [store]
  )

  const cancelScoring = useCallback(() => {
    ipc.gradingCancel()
    store.setProcessing(false)
  }, [store])

  return {
    ...store,
    startProvisionalScoring,
    cancelScoring,
  }
}
