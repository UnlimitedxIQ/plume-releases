// Typed wrapper around window.api (the preload bridge).
// All renderer code should import from here rather than touching window.api directly.

import type { Message } from '../types/chat'

declare global {
  interface Window {
    api: IpcBridge
  }
}

export interface IpcBridge {
  // Window controls
  minimize:    () => void
  maximize:    () => void
  close:       () => void
  isMaximized: () => Promise<boolean>

  // API Key (legacy)
  setApiKey: (key: string) => Promise<void>
  getApiKey: () => Promise<string | null>
  hasApiKey: () => Promise<boolean>

  // Providers
  checkProviders: () => Promise<{ claude: boolean; codex: boolean }>
  getProvidersAuth: () => Promise<{ claude: ProviderAuthStatus; codex: ProviderAuthStatus; active: string }>
  getProviderAuth: (id: string) => Promise<ProviderAuthStatus>
  providerLogin: (id: string) => Promise<ProviderAuthStatus>
  providerLogout: (id: string) => Promise<boolean>
  setActiveProvider: (id: string) => Promise<boolean>
  getActiveProvider: () => Promise<string>
  providerStartSession: (data: { tabId: string; systemPrompt: string }) => void
  providerChat: (data: { message: string; systemPrompt: string; tabId: string }) => void
  providerChatCancel: () => void
  providerKillSession: (tabId: string) => void

  // CEO mode
  ceoProcess: (data: { tabId: string; message: string; systemPrompt: string }) => void
  ceoCancel: () => void

  // Auto mode
  autoSpec: (data: { tabId: string; message: string; systemPrompt: string }) => void
  autoExecute: (data: { tabId: string; plan: unknown; systemPrompt: string }) => void
  autoInterrupt: (data: { tabId: string; message: string }) => void
  autoCancel: () => void

  // Canvas
  setCanvasToken:         (token: string) => Promise<void>
  getCanvasToken:         () => Promise<string | null>
  hasCanvasToken:         () => Promise<boolean>
  testCanvasConnection:   (token: string) => Promise<{ success: boolean; error?: string }>
  getCanvasCourses:       () => Promise<CanvasCourse[]>
  getCanvasAssignments:   (courseId?: number) => Promise<CanvasAssignment[]>
  getCanvasAnnouncements: () => Promise<CanvasAnnouncement[]>
  sendCanvasMessage:      (recipientIds: string[], subject: string, body: string) => Promise<{ success: boolean; error?: string }>
  getCanvasInstructors:   (courseId: number) => Promise<Array<{ id: number; name: string; shortName: string }>>
  getCanvasSubmissions:   (courseId: number, assignmentId: number) => Promise<CanvasSubmission[]>
  getCanvasSubmissionContent: (courseId: number, assignmentId: number, userId: number) => Promise<CanvasSubmission | null>
  updateCanvasGrade:      (courseId: number, assignmentId: number, studentId: number, payload: GradePayload) => Promise<unknown>
  bulkUpdateCanvasGrades: (courseId: number, assignmentId: number, payloads: GradePayload[]) => Promise<BulkGradeResult>
  checkCanvasIsInstructor: () => Promise<boolean>

  // Grading (Teacher Mode)
  gradingStartProvisional: (data: { sessionId: string; courseId: number; assignmentId: number }) => void
  gradingCancel:           () => void
  onGradingProgress:       (cb: (data: GradingProgressEvent) => void) => UnsubFn
  onGradingEval:           (cb: (data: GradingEvalEvent) => void) => UnsubFn
  onGradingComplete:       (cb: (data: GradingCompleteEvent) => void) => UnsubFn
  onGradingError:          (cb: (data: { sessionId: string; error: string }) => void) => UnsubFn

  // Chat streaming
  sendChatStream: (data: ChatStreamData) => void
  cancelChat:     (tabId: string) => void
  onChatChunk:    (tabId: string, cb: (chunk: ChatChunk) => void) => UnsubFn
  onChatDone:     (tabId: string, cb: () => void) => UnsubFn
  onChatError:    (tabId: string, cb: (err: IpcError) => void) => UnsubFn

  // Agent
  runAgent:     (data: AgentRunData) => void
  cancelAgent:  (tabId: string) => void
  onAgentEvent: (tabId: string, cb: (event: AgentEvent) => void) => UnsubFn
  onAgentDone:  (tabId: string, cb: () => void) => UnsubFn
  onAgentError: (tabId: string, cb: (err: IpcError) => void) => UnsubFn

  // File system
  readFile:      (path: string) => Promise<string>
  writeFile:     (path: string, content: string) => Promise<void>
  listDirectory: (path: string) => Promise<string[]>
  pickFiles:     () => Promise<PickedFile[]>

  // Skills
  getSkillsForProject: (projectType: string) => Promise<SkillDef[]>
  getAllSkills:         () => Promise<SkillDef[]>

  // Tools
  getToolsForProject: (projectType: string, skillIds: string[]) => Promise<ToolDef[]>

  // Writing style
  analyzeWritingStyle: (samples: string[]) => Promise<WritingStyleResult>

  // Vault
  vaultGetAll: () => Promise<VaultEntryMasked[]>
  vaultGet: (key: string) => Promise<string | null>
  vaultSet: (key: string, value: string, label: string, category: string) => Promise<boolean>
  vaultDelete: (key: string) => Promise<boolean>
  vaultContext: () => Promise<string>

  // Onboarding
  getOnboardingComplete: () => Promise<boolean>
  setOnboardingComplete: () => Promise<void>

  // Store
  storeGet: (key: string) => Promise<string | null>
  storeSet: (key: string, value: string) => Promise<void>
}

// ── Supporting Types ───────────────────────────────────────────────────────

export type UnsubFn = () => void

export interface IpcError {
  error: string
}

export interface ChatStreamData {
  messages:     Message[]
  systemPrompt: string
  tools?:       ToolDef[]
  tabId:        string
}

export interface ChatChunk {
  type:    'text' | 'tool_use' | 'tool_result' | 'thinking'
  text?:   string
  toolUse?: {
    id:    string
    name:  string
    input: Record<string, unknown>
  }
  toolResult?: {
    toolUseId: string
    content:   string
    isError:   boolean
  }
}

export interface AgentRunData {
  messages:     Message[]
  systemPrompt: string
  tools:        ToolDef[]
  tabId:        string
  mode:         string
}

export interface AgentEvent {
  type:    'plan_step' | 'tool_call' | 'tool_result' | 'text' | 'iteration' | 'done'
  payload: Record<string, unknown>
}

export interface PickedFile {
  name:    string
  path:    string
  size:    number
  content: string
}

export interface SkillDef {
  id:          string
  name:        string
  description: string
  projectTypes:string[]
  toolCount:   number
  icon?:       string
  category:    string
  installed:   boolean
}

export interface ToolDef {
  name:        string
  description: string
  input_schema:{
    type:       'object'
    properties: Record<string, unknown>
    required?:  string[]
  }
}

export interface VaultEntryMasked {
  key: string
  label: string
  category: string
  maskedValue: string
  createdAt: number
  updatedAt: number
}

export interface ProviderAuthStatus {
  installed: boolean
  loggedIn: boolean
  email?: string
  subscriptionType?: string
  authMethod?: string
}

export interface CanvasCourse {
  id:   number
  name: string
  code: string
}

export interface CanvasAssignment {
  id:             number
  courseId:       number
  name:           string
  description:    string
  dueAt:          string | null
  pointsPossible: number | null
  submissionTypes:string[]
  htmlUrl:        string
  hasRubric:      boolean
}

export interface CanvasAnnouncement {
  id:         number
  title:      string
  message:    string
  posted_at:  string
  created_at: string
  course_id:  number
  author:     { display_name: string }
  html_url:   string
}

export interface CanvasSubmission {
  id:                number
  user_id:           number
  assignment_id:     number
  body:              string | null
  url:               string | null
  submitted_at:      string | null
  score:             number | null
  grade:             string | null
  workflow_state:    'submitted' | 'graded' | 'pending_review' | 'unsubmitted'
  late:              boolean
  missing:           boolean
  attempt:           number | null
  attachments?:      Array<{ id: number; display_name: string; url: string; filename: string; 'content-type': string }>
  submission_comments?: Array<{ id: number; author_name: string; comment: string; created_at: string }>
  rubric_assessment?: Record<string, { points: number; comments?: string; rating_id?: string }>
  user?:             { id: number; name: string; short_name: string }
}

export interface GradePayload {
  score:             number
  rubricAssessment?: Record<string, { points: number }>
  comment?:          string
}

export interface BulkGradeResult {
  succeeded: number
  failed:    number
  errors:    Array<{ studentId: number; error: string }>
}

// ── Grading Events ───────────────────────────────────────────────────────

export interface GradingProgressEvent {
  sessionId:    string
  completed:    number
  total:        number
  current:      string
  submissionId: number
}

export interface GradingEvalEvent {
  sessionId:  string
  evaluation: {
    submissionId:    number
    userId:          number
    criterionScores: Record<string, { points: number; maxPoints: number; rationale: string }>
    overallScore:    number
    confidence:      number
    rationale:       string
    draftComment:    string
  }
}

export interface GradingCompleteEvent {
  sessionId:   string
  total:       number
  evaluations: GradingEvalEvent['evaluation'][]
}

export interface WritingStyleResult {
  formality:    number
  vocabulary:   string
  tone:         string
  avgSentenceLength: number
  positiveRules:string[]
  negativeRules:string[]
  quirks:       string[]
}

// ── Browser-mode mock for development outside Electron ────────────────────

// Persist mock state in localStorage so it survives page reloads during dev
const MOCK_KEY = 'plume-mock-store'
function loadMockStore(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(MOCK_KEY) ?? '{}') } catch { return {} }
}
function saveMockStore(store: Record<string, string>) {
  localStorage.setItem(MOCK_KEY, JSON.stringify(store))
}
const browserStore: Record<string, string> = loadMockStore()
function mockSet(key: string, value: string) {
  browserStore[key] = value
  saveMockStore(browserStore)
}

const mockBridge: IpcBridge = {
  minimize:    () => {},
  maximize:    () => {},
  close:       () => {},
  isMaximized: async () => false,

  setApiKey: async (key: string) => { mockSet('apiKey', key) },

  // Provider mocks
  checkProviders: async () => ({ claude: true, codex: true }),
  getProvidersAuth: async () => ({
    claude: { installed: true, loggedIn: browserStore.claudeLoggedIn === 'true', email: 'student@uoregon.edu', subscriptionType: 'max' },
    codex: { installed: true, loggedIn: false },
    active: 'claude',
  }),
  getProviderAuth: async (id: string) => ({
    installed: true,
    loggedIn: id === 'claude' && browserStore.claudeLoggedIn === 'true',
    email: id === 'claude' ? 'student@uoregon.edu' : undefined,
    subscriptionType: id === 'claude' ? 'max' : undefined,
  }),
  providerLogin: async (id: string) => {
    if (id === 'claude') mockSet('claudeLoggedIn', 'true')
    return { installed: true, loggedIn: true, email: 'student@uoregon.edu', subscriptionType: id === 'claude' ? 'max' : 'plus' }
  },
  providerLogout: async () => true,
  setActiveProvider: async () => true,
  getActiveProvider: async () => 'claude',
  providerStartSession: () => {},
  providerChat: () => {},
  providerKillSession: () => {},
  providerChatCancel: () => {},
  ceoProcess: () => {},
  ceoCancel: () => {},
  autoSpec: () => {},
  autoExecute: () => {},
  autoInterrupt: () => {},
  autoCancel: () => {},
  getApiKey: async () => browserStore.apiKey ?? null,
  hasApiKey: async () => !!browserStore.apiKey,

  setCanvasToken: async (token: string) => { mockSet('canvasToken', token) },
  getCanvasToken: async () => browserStore.canvasToken ?? null,
  hasCanvasToken: async () => !!browserStore.canvasToken,
  testCanvasConnection: async () => ({ success: true }),
  getCanvasCourses: async () => [
    { id: 1, name: 'MGMT 335 — Business Strategy', code: 'MGMT335' },
    { id: 2, name: 'ACCT 382 — Financial Accounting', code: 'ACCT382' },
    { id: 3, name: 'MKT 363 — Marketing Research', code: 'MKT363' }
  ],
  getCanvasAssignments: async () => [
    { id: 101, courseId: 1, name: 'Case Study Analysis', description: 'Analyze the Tesla case study', dueAt: new Date(Date.now() + 86400000 * 2).toISOString(), pointsPossible: 100, submissionTypes: ['online_upload'], htmlUrl: '#', hasRubric: true },
    { id: 102, courseId: 2, name: 'Balance Sheet Exercise', description: 'Complete the balance sheet reconciliation', dueAt: new Date(Date.now() + 86400000 * 5).toISOString(), pointsPossible: 50, submissionTypes: ['online_upload'], htmlUrl: '#', hasRubric: false },
    { id: 103, courseId: 3, name: 'Survey Design Project', description: 'Design a consumer survey for your chosen brand', dueAt: new Date(Date.now() - 86400000).toISOString(), pointsPossible: 150, submissionTypes: ['online_upload'], htmlUrl: '#', hasRubric: true }
  ],
  getCanvasAnnouncements: async () => [
    { id: 201, title: 'Midterm review session moved to Friday', message: 'Due to scheduling conflicts...', posted_at: new Date(Date.now() - 86400000).toISOString(), created_at: new Date(Date.now() - 86400000).toISOString(), course_id: 1, author: { display_name: 'Prof. Williams' }, html_url: '#' },
    { id: 202, title: 'Guest speaker next Tuesday', message: 'We will have a VP from Nike...', posted_at: new Date(Date.now() - 172800000).toISOString(), created_at: new Date(Date.now() - 172800000).toISOString(), course_id: 2, author: { display_name: 'Prof. Chen' }, html_url: '#' },
    { id: 203, title: 'Final project groups posted', message: 'Check Canvas for your group assignment...', posted_at: new Date(Date.now() - 259200000).toISOString(), created_at: new Date(Date.now() - 259200000).toISOString(), course_id: 3, author: { display_name: 'Prof. Martinez' }, html_url: '#' },
  ],
  sendCanvasMessage: async () => ({ success: true }),
  getCanvasInstructors: async () => [
    { id: 1001, name: 'Prof. Williams', shortName: 'Williams' },
    { id: 1002, name: 'Prof. Chen', shortName: 'Chen' },
  ],
  getCanvasSubmissions: async () => [],
  getCanvasSubmissionContent: async () => null,
  updateCanvasGrade: async () => ({}),
  bulkUpdateCanvasGrades: async () => ({ succeeded: 0, failed: 0, errors: [] }),
  checkCanvasIsInstructor: async () => false,

  gradingStartProvisional: () => {},
  gradingCancel:           () => {},
  onGradingProgress:       () => () => {},
  onGradingEval:           () => () => {},
  onGradingComplete:       () => () => {},
  onGradingError:          () => () => {},

  sendChatStream: () => {},
  cancelChat:     () => {},
  onChatChunk:    () => () => {},
  onChatDone:     () => () => {},
  onChatError:    () => () => {},

  runAgent:     () => {},
  cancelAgent:  () => {},
  onAgentEvent: () => () => {},
  onAgentDone:  () => () => {},
  onAgentError: () => () => {},

  readFile:      async () => 'Mock file content',
  writeFile:     async () => {},
  listDirectory: async () => [],
  pickFiles:     async () => [],

  getSkillsForProject: async () => [],
  getAllSkills: async () => [
    { id: 'uo-business-writing',    name: 'UO Business Writing Guide',       description: 'Lundquist College writing standards',              projectTypes: ['business_writing', 'general'],             toolCount: 2, icon: 'FileText',    category: 'writing',  installed: true  },
    { id: 'uo-resume-guide',        name: 'UO Resume Guide',                 description: 'Career center resume formatting',                  projectTypes: ['business_writing', 'general'],             toolCount: 2, icon: 'User',        category: 'writing',  installed: true  },
    { id: 'uo-ui-ux',              name: 'UO UI/UX Skills',                 description: 'Design and layout best practices',                 projectTypes: ['website_app', 'product_design'],           toolCount: 2, icon: 'Palette',     category: 'design',   installed: true  },
    { id: 'uo-research-paper',      name: 'UO Research Paper Skills',        description: 'Academic research and citation guidance',          projectTypes: ['research_paper'],                          toolCount: 3, icon: 'BookOpen',    category: 'research', installed: true  },
    { id: 'uo-financial-analysis',  name: 'UO Financial Analysis Skills',    description: 'Quantitative analysis frameworks',                 projectTypes: ['financial_analysis'],                      toolCount: 3, icon: 'TrendingUp',  category: 'finance',  installed: true  },
    { id: 'uo-presentation',        name: 'UO Presentation Skills',          description: 'Slide deck structure and design',                  projectTypes: ['business_writing', 'product_design'],      toolCount: 2, icon: 'Presentation', category: 'design',   installed: true  },
    { id: 'python-patterns',        name: 'Python Patterns',                 description: 'Pythonic idioms, PEP 8, and best practices',       projectTypes: ['website_app'],                             toolCount: 1, icon: 'Code2',       category: 'code',     installed: false },
    { id: 'data-viz',               name: 'Data Visualization',              description: 'Chart and graph generation with best practices',   projectTypes: ['financial_analysis'],                      toolCount: 2, icon: 'BarChart3',   category: 'code',     installed: false },
    { id: 'latex-editor',           name: 'LaTeX Editor',                    description: 'Write and format LaTeX documents',                 projectTypes: ['research_paper'],                          toolCount: 1, icon: 'FileCode',    category: 'research', installed: false },
    { id: 'email-composer',         name: 'Email Composer',                  description: 'Professional email drafting and formatting',       projectTypes: ['business_writing'],                        toolCount: 1, icon: 'Mail',        category: 'writing',  installed: false },
    { id: 'study-flashcards',       name: 'Study Flashcards',                description: 'Generate flashcards from notes and textbooks',     projectTypes: ['general'],                                 toolCount: 1, icon: 'Layers',      category: 'research', installed: false },
    { id: 'budget-planner',         name: 'Budget Planner',                  description: 'Personal and project budget planning',             projectTypes: ['financial_analysis'],                      toolCount: 1, icon: 'DollarSign',  category: 'finance',  installed: false },
  ],

  getToolsForProject: async () => [],

  analyzeWritingStyle: async () => ({
    formality: 6, vocabulary: 'moderate', tone: 'confident',
    avgSentenceLength: 18, positiveRules: [], negativeRules: [], quirks: []
  }),

  // Vault mocks
  vaultGetAll: async () => [
    { key: 'canvas-token', label: 'Canvas API Token', category: 'token', maskedValue: 'abc1••••••••xyz9', createdAt: Date.now(), updatedAt: Date.now() },
    { key: 'openai-key', label: 'OpenAI API Key', category: 'api_key', maskedValue: 'sk-p••••••••••••3kFj', createdAt: Date.now(), updatedAt: Date.now() },
  ],
  vaultGet: async () => null,
  vaultSet: async () => true,
  vaultDelete: async () => true,
  vaultContext: async () => '',

  getOnboardingComplete: async () => browserStore.onboardingComplete === 'true',
  setOnboardingComplete: async () => { mockSet('onboardingComplete', 'true') },

  storeGet: async (key: string) => browserStore[key] ?? null,
  storeSet: async (key: string, value: string) => { mockSet(key, value) }
}

// ── Typed IPC Helper Functions ─────────────────────────────────────────────

export function isIpcAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.api !== 'undefined'
}

export const ipc: IpcBridge = new Proxy({} as IpcBridge, {
  get(_target, prop: string) {
    if (isIpcAvailable()) {
      const api = window.api
      const fn = (api as unknown as Record<string, unknown>)[prop]
      if (typeof fn === 'function') {
        return fn.bind(api)
      }
    }
    // Fall back to mock in browser mode
    const mockFn = (mockBridge as unknown as Record<string, unknown>)[prop]
    if (typeof mockFn === 'function') {
      return mockFn.bind(mockBridge)
    }
    return () => Promise.resolve(null)
  },
})
