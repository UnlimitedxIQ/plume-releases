// ── Agent Mode ─────────────────────────────────────────────────────────────

export type AgentMode = 'standard' | 'ceo' | 'auto'

// ── CEO Mode: Workers ─────────────────────────────────────────────────────

export type WorkerType = 'coder' | 'author' | 'review'

export type WorkerStatus = 'idle' | 'working' | 'done'

export interface WorkerTask {
  id: string
  title: string
  context: string
  status: 'queued' | 'active' | 'done' | 'error'
  progress: number
  activityLog: WorkerLogEntry[]
  result?: string
  error?: string
  startedAt?: number
  completedAt?: number
}

export interface WorkerLogEntry {
  id: string
  type: 'tool_call' | 'tool_result' | 'text' | 'error' | 'file_diff'
  timestamp: number
  content: string
  toolName?: string
  isError?: boolean
  filePath?: string
  diff?: string
}

export interface WorkerState {
  type: WorkerType
  status: WorkerStatus
  activeTask: WorkerTask | null
  queue: WorkerTask[]
  completedTasks: WorkerTask[]
}

// ── Auto Mode ─────────────────────────────────────────────────────────────

export type AutoPhase = 'spec' | 'planning' | 'executing' | 'interrupted' | 'done'

export interface AutoStep {
  id: string
  index: number
  title: string
  description: string
  status: 'pending' | 'active' | 'done' | 'error'
  result?: string
  startedAt?: number
  endedAt?: number
}

export interface AutoState {
  phase: AutoPhase
  specMessages: AutoMessage[]
  plan: AutoStep[]
  planTitle: string
  currentStepIndex: number
  progress: number
  interruptMessage?: string
}

export interface AutoMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// ── Shared: Plan (kept for backward compat / Auto mode reuse) ─────────────

export type PlanStepStatus = 'pending' | 'active' | 'done' | 'skipped' | 'error'

export interface PlanStep {
  id: string
  index: number
  title: string
  description: string
  status: PlanStepStatus
  toolCalls?: string[]
  result?: string
  startedAt?: number
  endedAt?: number
}

export interface PlanData {
  id: string
  title: string
  description: string
  steps: PlanStep[]
  status: 'draft' | 'approved' | 'executing' | 'done' | 'abandoned'
  createdAt: number
  completedAt?: number
  progress: number
}

// ── Agent Events ──────────────────────────────────────────────────────────

export type AgentEventType =
  | 'plan_created'
  | 'plan_approved'
  | 'step_start'
  | 'step_done'
  | 'step_skip'
  | 'tool_call'
  | 'tool_result'
  | 'text_chunk'
  | 'worker_task_assigned'
  | 'worker_task_started'
  | 'worker_task_done'
  | 'worker_task_error'
  | 'auto_spec_question'
  | 'auto_plan_ready'
  | 'auto_step_start'
  | 'auto_step_done'
  | 'auto_interrupted'
  | 'auto_done'
  | 'agent_done'
  | 'agent_error'

export interface AgentEvent {
  type: AgentEventType
  tabId: string
  timestamp: number
  payload: AgentEventPayload
}

export type AgentEventPayload =
  | PlanCreatedPayload
  | StepStartPayload
  | StepDonePayload
  | ToolCallPayload
  | ToolResultPayload
  | TextChunkPayload
  | WorkerTaskPayload
  | AutoSpecPayload
  | AgentErrorPayload
  | Record<string, unknown>

export interface PlanCreatedPayload { plan: PlanData }
export interface StepStartPayload { stepId: string; index: number }
export interface StepDonePayload { stepId: string; result: string }
export interface ToolCallPayload { callId: string; name: string; input: Record<string, unknown> }
export interface ToolResultPayload { callId: string; output: string; isError: boolean }
export interface TextChunkPayload { text: string }
export interface AgentErrorPayload { error: string }

export interface WorkerTaskPayload {
  worker: WorkerType
  taskId: string
  title: string
  context: string
}

export interface AutoSpecPayload {
  questions: string[]
}

// ── Execution Log Entry (reused in workers) ───────────────────────────────

export interface ExecutionLogEntry {
  id: string
  type: 'tool_call' | 'tool_result' | 'text' | 'step' | 'error'
  timestamp: number
  content: string
  toolName?: string
  isError?: boolean
  filePath?: string
  diff?: string
}

// ── Factory Helpers ────────────────────────────────────────────────────────

export function createWorkerTask(title: string, context: string): WorkerTask {
  return {
    id: crypto.randomUUID(),
    title,
    context,
    status: 'queued',
    progress: 0,
    activityLog: [],
  }
}

export function createWorkerState(type: WorkerType): WorkerState {
  return {
    type,
    status: 'idle',
    activeTask: null,
    queue: [],
    completedTasks: [],
  }
}

export function createAutoStep(index: number, title: string, description: string): AutoStep {
  return {
    id: crypto.randomUUID(),
    index,
    title,
    description,
    status: 'pending',
  }
}

export function createAutoState(): AutoState {
  return {
    phase: 'spec',
    specMessages: [],
    plan: [],
    planTitle: '',
    currentStepIndex: -1,
    progress: 0,
  }
}

export function computeAutoProgress(steps: AutoStep[]): number {
  if (steps.length === 0) return 0
  const done = steps.filter(s => s.status === 'done').length
  return Math.round((done / steps.length) * 100)
}
