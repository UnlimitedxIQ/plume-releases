import { useState, useCallback, useEffect, useRef } from 'react'
import { ipc } from '../lib/ipc'
import type {
  AgentMode,
  WorkerType,
  WorkerState,
  WorkerTask,
  WorkerLogEntry,
  AutoState,
  AutoMessage,
  AutoStep,
  AgentEvent,
} from '../types/agent'
import {
  createWorkerState,
  createWorkerTask,
  createAutoState,
  computeAutoProgress,
} from '../types/agent'

// ── Initial state factories ────────────────────────────────────────────────

function buildInitialWorkers(): Record<WorkerType, WorkerState> {
  return {
    coder:  createWorkerState('coder'),
    author: createWorkerState('author'),
    review: createWorkerState('review'),
  }
}

// ── Hook return type ──────────────────────────────────────────────────────

export interface AgentModeState {
  mode:      AgentMode
  workers:   Record<WorkerType, WorkerState>
  autoState: AutoState

  // Mode
  setMode: (mode: AgentMode) => void

  // CEO actions
  dispatchTask:      (worker: WorkerType, title: string, context: string) => void
  cancelWorkerTask:  (worker: WorkerType) => void

  // Auto actions
  sendSpecMessage: (text: string) => void
  approvePlan:     () => void
  interrupt:       (text: string) => void
  cancel:          () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────

export function useAgentMode(tabId: string): AgentModeState {
  const [mode,      setModeState] = useState<AgentMode>('standard')
  const [workers,   setWorkers]   = useState<Record<WorkerType, WorkerState>>(buildInitialWorkers)
  const [autoState, setAutoState] = useState<AutoState>(createAutoState)

  const unsubsRef = useRef<Array<() => void>>([])

  // ── IPC subscriptions ────────────────────────────────────────────────────

  useEffect(() => {
    const unsubEvent = ipc.onAgentEvent(tabId, (raw) => {
      handleAgentEvent(raw as unknown as AgentEvent)
    })

    const unsubDone = ipc.onAgentDone(tabId, () => {
      // Mark auto as done when main process signals completion
      setAutoState((prev) => ({ ...prev, phase: 'done' }))
    })

    const unsubError = ipc.onAgentError(tabId, () => {
      setAutoState((prev) =>
        prev.phase === 'executing' ? { ...prev, phase: 'interrupted' } : prev
      )
    })

    unsubsRef.current = [unsubEvent, unsubDone, unsubError]
    return () => {
      unsubsRef.current.forEach((fn) => fn())
      unsubsRef.current = []
    }
  }, [tabId])

  // ── Event dispatch ────────────────────────────────────────────────────────

  function handleAgentEvent(event: AgentEvent) {
    const { type, payload } = event

    switch (type) {
      // ── Worker events ────────────────────────────────────────────────────

      case 'worker_task_assigned': {
        const { worker, taskId, title, context } = payload as {
          worker: WorkerType; taskId: string; title: string; context: string
        }
        const task: WorkerTask = { ...createWorkerTask(title, context), id: taskId }
        setWorkers((prev) => ({
          ...prev,
          [worker]: {
            ...prev[worker],
            queue: [...prev[worker].queue, task],
          },
        }))
        break
      }

      case 'worker_task_started': {
        const { worker, taskId } = payload as { worker: WorkerType; taskId: string }
        setWorkers((prev) => {
          const state = prev[worker]
          const task  = state.queue.find((t) => t.id === taskId)
          if (!task) return prev
          return {
            ...prev,
            [worker]: {
              ...state,
              status:     'working',
              activeTask: { ...task, status: 'active', startedAt: Date.now() },
              queue:      state.queue.filter((t) => t.id !== taskId),
            },
          }
        })
        break
      }

      case 'worker_task_done': {
        const { worker, taskId, result } = payload as {
          worker: WorkerType; taskId: string; result: string
        }
        setWorkers((prev) => {
          const state = prev[worker]
          const active = state.activeTask
          if (!active || active.id !== taskId) return prev
          const completed: WorkerTask = {
            ...active,
            status:      'done',
            result,
            progress:    100,
            completedAt: Date.now(),
          }
          const nextQueue = state.queue
          const nextActive = nextQueue[0]
            ? { ...nextQueue[0], status: 'active' as const, startedAt: Date.now() }
            : null
          return {
            ...prev,
            [worker]: {
              ...state,
              status:         nextActive ? 'working' : 'idle',
              activeTask:     nextActive,
              queue:          nextQueue.slice(1),
              completedTasks: [...state.completedTasks, completed],
            },
          }
        })
        break
      }

      case 'worker_task_error': {
        const { worker, taskId, error } = payload as {
          worker: WorkerType; taskId: string; error: string
        }
        setWorkers((prev) => {
          const state = prev[worker]
          const active = state.activeTask
          if (!active || active.id !== taskId) return prev
          const errored: WorkerTask = {
            ...active,
            status:      'error',
            error,
            completedAt: Date.now(),
          }
          return {
            ...prev,
            [worker]: {
              ...state,
              status:         'idle',
              activeTask:     null,
              completedTasks: [...state.completedTasks, errored],
            },
          }
        })
        break
      }

      // Worker log entries (tool calls, results, text, file diffs)
      case 'tool_call': {
        const { callId, name, input } = payload as {
          callId: string; name: string; input: Record<string, unknown>
        }
        const entry: WorkerLogEntry = {
          id:        callId,
          type:      'tool_call',
          timestamp: Date.now(),
          content:   JSON.stringify(input, null, 2),
          toolName:  name,
        }
        appendWorkerLog(entry)
        break
      }

      case 'tool_result': {
        const { callId, output, isError } = payload as {
          callId: string; output: string; isError: boolean
        }
        const entry: WorkerLogEntry = {
          id:        `${callId}-result`,
          type:      'tool_result',
          timestamp: Date.now(),
          content:   output,
          isError,
        }
        appendWorkerLog(entry)
        break
      }

      // ── Auto mode events ─────────────────────────────────────────────────

      case 'auto_spec_question': {
        const { questions } = payload as { questions: string[] }
        const msgs: AutoMessage[] = questions.map((q) => ({
          id:        crypto.randomUUID(),
          role:      'assistant',
          content:   q,
          timestamp: Date.now(),
        }))
        setAutoState((prev) => ({
          ...prev,
          phase:        'spec',
          specMessages: [...prev.specMessages, ...msgs],
        }))
        break
      }

      case 'auto_plan_ready': {
        const { title, steps } = payload as {
          title: string
          steps: Array<{ title: string; description: string }>
        }
        const autoSteps: AutoStep[] = steps.map((s, i) => ({
          id:          crypto.randomUUID(),
          index:       i,
          title:       s.title,
          description: s.description,
          status:      'pending',
        }))
        setAutoState((prev) => ({
          ...prev,
          phase:     'planning',
          planTitle: title,
          plan:      autoSteps,
        }))
        break
      }

      case 'auto_step_start': {
        const { stepId } = payload as { stepId: string }
        setAutoState((prev) => ({
          ...prev,
          phase: 'executing',
          plan:  prev.plan.map((s) =>
            s.id === stepId ? { ...s, status: 'active', startedAt: Date.now() } : s
          ),
          currentStepIndex: prev.plan.findIndex((s) => s.id === stepId),
        }))
        break
      }

      case 'auto_step_done': {
        const { stepId, result } = payload as { stepId: string; result: string }
        setAutoState((prev) => {
          const plan = prev.plan.map((s) =>
            s.id === stepId
              ? { ...s, status: 'done' as const, result, endedAt: Date.now() }
              : s
          )
          return { ...prev, plan, progress: computeAutoProgress(plan) }
        })
        break
      }

      case 'auto_interrupted': {
        const { message } = payload as { message?: string }
        setAutoState((prev) => ({
          ...prev,
          phase:            'interrupted',
          interruptMessage: message,
        }))
        break
      }

      case 'auto_done': {
        setAutoState((prev) => ({
          ...prev,
          phase:    'done',
          progress: 100,
        }))
        break
      }

      default:
        break
    }
  }

  // Append a log entry to whichever worker currently has an active task.
  // If the source worker is known via payload.worker use that; otherwise
  // append to any worker that is currently working.
  function appendWorkerLog(entry: WorkerLogEntry) {
    setWorkers((prev) => {
      const workerTypes: WorkerType[] = ['coder', 'author', 'review']
      const activeWorker = workerTypes.find((w) => prev[w].status === 'working')
      if (!activeWorker) return prev
      const state = prev[activeWorker]
      if (!state.activeTask) return prev
      return {
        ...prev,
        [activeWorker]: {
          ...state,
          activeTask: {
            ...state.activeTask,
            activityLog: [...state.activeTask.activityLog, entry],
          },
        },
      }
    })
  }

  // ── Public actions ────────────────────────────────────────────────────────

  const setMode = useCallback((newMode: AgentMode) => {
    setModeState(newMode)
    // Reset mode-specific state on switch
    if (newMode !== 'ceo')  setWorkers(buildInitialWorkers())
    if (newMode !== 'auto') setAutoState(createAutoState())
  }, [])

  const dispatchTask = useCallback(
    (worker: WorkerType, title: string, context: string) => {
      const task = createWorkerTask(title, context)
      setWorkers((prev) => ({
        ...prev,
        [worker]: {
          ...prev[worker],
          queue: [...prev[worker].queue, task],
        },
      }))
      // Note: CEO dispatch happens via the chat message flow —
      // the CEO engine parses task blocks from Claude's response
      // and spawns workers automatically. No explicit IPC call needed here.
    },
    [tabId]
  )

  const cancelWorkerTask = useCallback(
    (worker: WorkerType) => {
      ipc.cancelAgent(tabId)
      setWorkers((prev) => {
        const state = prev[worker]
        if (!state.activeTask) return prev
        const cancelled: WorkerTask = {
          ...state.activeTask,
          status:      'error',
          error:       'Cancelled by user',
          completedAt: Date.now(),
        }
        return {
          ...prev,
          [worker]: {
            ...state,
            status:         'idle',
            activeTask:     null,
            completedTasks: [...state.completedTasks, cancelled],
          },
        }
      })
    },
    [tabId]
  )

  const sendSpecMessage = useCallback(
    (text: string) => {
      const userMsg: AutoMessage = {
        id:        crypto.randomUUID(),
        role:      'user',
        content:   text,
        timestamp: Date.now(),
      }
      setAutoState((prev) => ({
        ...prev,
        specMessages: [...prev.specMessages, userMsg],
      }))
      ipc.autoSpec({ tabId, message: text, systemPrompt: '' })
    },
    [tabId]
  )

  const approvePlan = useCallback(() => {
    setAutoState((prev) => {
      const plan = {
        title: prev.planTitle,
        steps: prev.plan.map(s => ({ title: s.title, description: s.description })),
      }
      ipc.autoExecute({ tabId, plan, systemPrompt: '' })
      return { ...prev, phase: 'executing' as const }
    })
  }, [tabId])

  const interrupt = useCallback(
    (text: string) => {
      const msg: AutoMessage = {
        id:        crypto.randomUUID(),
        role:      'user',
        content:   text,
        timestamp: Date.now(),
      }
      setAutoState((prev) => ({
        ...prev,
        interruptMessage: text,
        specMessages:     [...prev.specMessages, msg],
      }))
      ipc.autoInterrupt({ tabId, message: text })
    },
    [tabId]
  )

  const cancel = useCallback(() => {
    ipc.autoCancel()
    setAutoState((prev) => ({ ...prev, phase: 'interrupted' }))
  }, [tabId])

  return {
    mode,
    workers,
    autoState,
    setMode,
    dispatchTask,
    cancelWorkerTask,
    sendSpecMessage,
    approvePlan,
    interrupt,
    cancel,
  }
}
