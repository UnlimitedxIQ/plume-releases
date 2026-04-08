import { contextBridge, ipcRenderer } from 'electron'

export type IpcApi = typeof api

const api = {
  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),

  // API Key (legacy)
  setApiKey: (key: string) => ipcRenderer.invoke('app:set-api-key', key),
  getApiKey: () => ipcRenderer.invoke('app:get-api-key'),
  hasApiKey: () => ipcRenderer.invoke('app:has-api-key'),

  // Providers
  checkProviders: () => ipcRenderer.invoke('provider:check-installed'),
  getProvidersAuth: () => ipcRenderer.invoke('provider:auth-status'),
  getProviderAuth: (id: string) => ipcRenderer.invoke('provider:auth-status-single', id),
  providerLogin: (id: string) => ipcRenderer.invoke('provider:login', id),
  providerLogout: (id: string) => ipcRenderer.invoke('provider:logout', id),
  setActiveProvider: (id: string) => ipcRenderer.invoke('provider:set-active', id),
  getActiveProvider: () => ipcRenderer.invoke('provider:get-active'),
  providerChat: (data: { message: string; systemPrompt: string; tabId: string }) =>
    ipcRenderer.send('provider:chat', data),
  providerStartSession: (data: { tabId: string; systemPrompt: string }) =>
    ipcRenderer.send('provider:start-session', data),
  providerChatCancel: () => ipcRenderer.send('provider:chat-cancel'),
  providerKillSession: (tabId: string) => ipcRenderer.send('provider:kill-session', tabId),

  // Canvas
  setCanvasToken: (token: string) => ipcRenderer.invoke('canvas:set-token', token),
  getCanvasToken: () => ipcRenderer.invoke('canvas:get-token'),
  hasCanvasToken: () => ipcRenderer.invoke('canvas:has-token'),
  testCanvasConnection: (token: string) => ipcRenderer.invoke('canvas:test-connection', token),
  getCanvasCourses: () => ipcRenderer.invoke('canvas:get-courses'),
  getCanvasAssignments: (courseId?: number) => ipcRenderer.invoke('canvas:get-assignments', courseId),
  getCanvasAnnouncements: () => ipcRenderer.invoke('canvas:get-announcements'),
  sendCanvasMessage: (recipientIds: string[], subject: string, body: string) =>
    ipcRenderer.invoke('canvas:send-message', recipientIds, subject, body),
  getCanvasInstructors: (courseId: number) => ipcRenderer.invoke('canvas:get-instructors', courseId),
  getCanvasSubmissions: (courseId: number, assignmentId: number) =>
    ipcRenderer.invoke('canvas:get-submissions', courseId, assignmentId),
  getCanvasSubmissionContent: (courseId: number, assignmentId: number, userId: number) =>
    ipcRenderer.invoke('canvas:get-submission-content', courseId, assignmentId, userId),
  updateCanvasGrade: (courseId: number, assignmentId: number, studentId: number, payload: unknown) =>
    ipcRenderer.invoke('canvas:update-grade', courseId, assignmentId, studentId, payload),
  bulkUpdateCanvasGrades: (courseId: number, assignmentId: number, payloads: unknown[]) =>
    ipcRenderer.invoke('canvas:bulk-update-grades', courseId, assignmentId, payloads),
  checkCanvasIsInstructor: () => ipcRenderer.invoke('canvas:check-is-instructor'),

  // Grading (Teacher Mode)
  gradingStartProvisional: (data: { sessionId: string; courseId: number; assignmentId: number }) =>
    ipcRenderer.send('grading:start-provisional', data),
  gradingCancel: () => ipcRenderer.send('grading:cancel'),
  onGradingProgress: (callback: (data: unknown) => void) => {
    const handler = (_event: unknown, data: unknown) => callback(data)
    ipcRenderer.on('grading:provisional-progress', handler)
    return () => ipcRenderer.removeListener('grading:provisional-progress', handler)
  },
  onGradingEval: (callback: (data: unknown) => void) => {
    const handler = (_event: unknown, data: unknown) => callback(data)
    ipcRenderer.on('grading:provisional-eval', handler)
    return () => ipcRenderer.removeListener('grading:provisional-eval', handler)
  },
  onGradingComplete: (callback: (data: unknown) => void) => {
    const handler = (_event: unknown, data: unknown) => callback(data)
    ipcRenderer.on('grading:provisional-complete', handler)
    return () => ipcRenderer.removeListener('grading:provisional-complete', handler)
  },
  onGradingError: (callback: (data: unknown) => void) => {
    const handler = (_event: unknown, data: unknown) => callback(data)
    ipcRenderer.on('grading:error', handler)
    return () => ipcRenderer.removeListener('grading:error', handler)
  },

  // Terminal (embedded Claude CLI)
  terminalStart: (data: { tabId: string; systemPrompt?: string; cols?: number; rows?: number }) =>
    ipcRenderer.send('terminal:start', data),
  terminalWrite: (data: { tabId: string; data: string }) =>
    ipcRenderer.send('terminal:write', data),
  terminalResize: (data: { tabId: string; cols: number; rows: number }) =>
    ipcRenderer.send('terminal:resize', data),
  terminalKill: (tabId: string) => ipcRenderer.send('terminal:kill', tabId),
  terminalPark: (tabId: string) => ipcRenderer.send('terminal:park', tabId),
  terminalHasSession: (tabId: string) => ipcRenderer.invoke('terminal:has-session', tabId),
  terminalGetBuffer: (tabId: string) => ipcRenderer.invoke('terminal:get-buffer', tabId),
  onTerminalData: (tabId: string, callback: (data: string) => void) => {
    const channel = `terminal:data:${tabId}`
    const handler = (_event: unknown, data: string) => callback(data)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },
  onTerminalExit: (tabId: string, callback: (info: { code: number; error?: string }) => void) => {
    const channel = `terminal:exit:${tabId}`
    const handler = (_event: unknown, info: { code: number; error?: string }) => callback(info)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },

  // CEO mode
  ceoProcess: (data: { tabId: string; message: string; systemPrompt: string }) =>
    ipcRenderer.send('ceo:process', data),
  ceoCancel: () => ipcRenderer.send('ceo:cancel'),

  // Auto mode
  autoSpec: (data: { tabId: string; message: string; systemPrompt: string }) =>
    ipcRenderer.send('auto:spec', data),
  autoExecute: (data: { tabId: string; plan: unknown; systemPrompt: string }) =>
    ipcRenderer.send('auto:execute', data),
  autoInterrupt: (data: { tabId: string; message: string }) =>
    ipcRenderer.send('auto:interrupt', data),
  autoCancel: () => ipcRenderer.send('auto:cancel'),

  // Chat (legacy)
  sendChatStream: (data: { messages: unknown[]; systemPrompt: string; tools?: unknown[]; tabId: string }) =>
    ipcRenderer.send('chat:stream', data),
  cancelChat: (tabId: string) => ipcRenderer.send('chat:cancel', { tabId }),
  onChatChunk: (tabId: string, callback: (chunk: unknown) => void) => {
    const channel = `chat:chunk:${tabId}`
    const handler = (_event: unknown, chunk: unknown) => callback(chunk)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },
  onChatDone: (tabId: string, callback: () => void) => {
    const channel = `chat:done:${tabId}`
    const handler = () => callback()
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },
  onChatError: (tabId: string, callback: (error: { error: string }) => void) => {
    const channel = `chat:error:${tabId}`
    const handler = (_event: unknown, error: { error: string }) => callback(error)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },

  // Agent
  runAgent: (data: { messages: unknown[]; systemPrompt: string; tools: unknown[]; tabId: string; mode: string }) =>
    ipcRenderer.send('agent:run', data),
  cancelAgent: (tabId: string) => ipcRenderer.send('agent:cancel', { tabId }),
  onAgentEvent: (tabId: string, callback: (event: unknown) => void) => {
    const channel = `agent:event:${tabId}`
    const handler = (_event: unknown, data: unknown) => callback(data)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },
  onAgentDone: (tabId: string, callback: () => void) => {
    const channel = `agent:done:${tabId}`
    const handler = () => callback()
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },
  onAgentError: (tabId: string, callback: (error: { error: string }) => void) => {
    const channel = `agent:error:${tabId}`
    const handler = (_event: unknown, error: { error: string }) => callback(error)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  },

  // File system
  readFile: (path: string) => ipcRenderer.invoke('file:read', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('file:write', path, content),
  listDirectory: (path: string) => ipcRenderer.invoke('file:list', path),
  pickFiles: () => ipcRenderer.invoke('file:pick'),

  // Skills
  getSkillsForProject: (projectType: string) => ipcRenderer.invoke('skills:get-for-project', projectType),
  getAllSkills: () => ipcRenderer.invoke('skills:get-all'),

  // Claude skills/MCP scanner
  scanClaudeSkills: () => ipcRenderer.invoke('skills:scan-claude'),
  scanSkillsOnly: () => ipcRenderer.invoke('skills:scan-skills'),
  scanMcpsOnly: () => ipcRenderer.invoke('skills:scan-mcps'),

  // Tools
  getToolsForProject: (projectType: string, skillIds: string[]) =>
    ipcRenderer.invoke('tools:get-for-project', projectType, skillIds),

  // Writing style
  analyzeWritingStyle: (samples: string[]) => ipcRenderer.invoke('writing-style:analyze', samples),

  // Vault
  vaultGetAll: () => ipcRenderer.invoke('vault:get-all'),
  vaultGet: (key: string) => ipcRenderer.invoke('vault:get', key),
  vaultSet: (key: string, value: string, label: string, category: string) =>
    ipcRenderer.invoke('vault:set', key, value, label, category),
  vaultDelete: (key: string) => ipcRenderer.invoke('vault:delete', key),
  vaultContext: () => ipcRenderer.invoke('vault:context'),

  onVaultCredentialRevoked: (callback: (data: { key: string; service: string }) => void) => {
    const handler = (_event: unknown, data: { key: string; service: string }) => callback(data)
    ipcRenderer.on('vault:credential-revoked', handler)
    return () => ipcRenderer.removeListener('vault:credential-revoked', handler)
  },

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('app:check-updates'),
  onUpdateAvailable: (callback: (data: { version: string }) => void) => {
    const handler = (_event: unknown, data: { version: string }) => callback(data)
    ipcRenderer.on('updater:available', handler)
    return () => ipcRenderer.removeListener('updater:available', handler)
  },
  onUpdateDownloading: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('updater:downloading', handler)
    return () => ipcRenderer.removeListener('updater:downloading', handler)
  },
  onUpdateReady: (callback: () => void) => {
    const handler = () => callback()
    ipcRenderer.on('updater:ready', handler)
    return () => ipcRenderer.removeListener('updater:ready', handler)
  },

  // Data management
  clearAllData: () => ipcRenderer.invoke('app:clear-all-data'),
  uninstallPlume: () => ipcRenderer.invoke('app:uninstall'),

  // Onboarding
  getOnboardingComplete: () => ipcRenderer.invoke('app:get-onboarding-complete'),
  setOnboardingComplete: () => ipcRenderer.invoke('app:set-onboarding-complete'),

  // Store
  storeGet: (key: string) => ipcRenderer.invoke('store:get', key),
  storeSet: (key: string, value: string) => ipcRenderer.invoke('store:set', key, value)
}

contextBridge.exposeInMainWorld('api', api)
