import { ipcMain, BrowserWindow, dialog, safeStorage } from 'electron'
import { readFile, writeFile, readdir, stat } from 'fs/promises'
import { join } from 'path'
import { streamChat, cancelStream } from './claude-api'
import { runAgentLoop, cancelAgentLoop } from './agent-runtime'
import { getToolsForProject } from './tool-registry'
import { getSkillsForProject, getAllSkills } from './skills/skill-loader'
import { CanvasClient } from './canvas/canvas-client'
import { analyzeWritingSamples } from './writing-style/analyzer'
import { getProviderManager } from './providers/provider-manager'
import type { ProviderId } from './providers/provider-types'
import { CeoEngine } from './providers/ceo-engine'
import { TerminalManager } from './terminal-manager'
import { scanAll, scanSkills, scanMcpServers } from './skills-scanner'
import { AutoEngine } from './providers/auto-engine'
import { GradingEngine } from './grading/grading-engine'
import { BASE_SYSTEM_PROMPT } from './providers/prompt-constants'
import Store from './store'
import { Vault } from './vault'

const store = new Store()
const providerManager = getProviderManager()
const vault = new Vault()
let ceoEngine: CeoEngine | null = null
let autoEngine: AutoEngine | null = null
let gradingEngine: GradingEngine | null = null
let terminalManager: TerminalManager | null = null

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  // Backfill vault with existing app credentials if not already present
  try {
    const canvasEnc = store.get('canvasToken')
    if (canvasEnc && !vault.get('canvas-token')) {
      const token = safeStorage.decryptString(Buffer.from(canvasEnc, 'base64'))
      vault.set('canvas-token', token, 'Canvas API Token', 'token')
    }
  } catch { /* ignore backfill errors */ }

  // Window controls
  ipcMain.on('window:minimize', () => mainWindow.minimize())
  ipcMain.on('window:maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })
  ipcMain.on('window:close', () => mainWindow.close())
  ipcMain.handle('window:is-maximized', () => mainWindow.isMaximized())

  // API Key management
  ipcMain.handle('app:set-api-key', async (_event, key: string) => {
    const encrypted = safeStorage.encryptString(key)
    store.set('apiKey', encrypted.toString('base64'))
    return true
  })

  ipcMain.handle('app:get-api-key', async () => {
    const encrypted = store.get('apiKey')
    if (!encrypted) return null
    try {
      return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    } catch {
      return null
    }
  })

  ipcMain.handle('app:has-api-key', async () => {
    return !!store.get('apiKey')
  })

  // Canvas token management
  ipcMain.handle('canvas:set-token', async (_event, token: string) => {
    const encrypted = safeStorage.encryptString(token)
    store.set('canvasToken', encrypted.toString('base64'))
    // Also save to vault so Claude and the user can see it
    vault.set('canvas-token', token, 'Canvas API Token', 'token')
    return true
  })

  ipcMain.handle('canvas:get-token', async () => {
    const encrypted = store.get('canvasToken')
    if (!encrypted) return null
    try {
      return safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    } catch {
      return null
    }
  })

  ipcMain.handle('canvas:has-token', async () => {
    return !!store.get('canvasToken')
  })

  ipcMain.handle('canvas:test-connection', async (_event, token: string) => {
    const client = new CanvasClient(token)
    return client.testConnection()
  })

  ipcMain.handle('canvas:get-courses', async () => {
    const encrypted = store.get('canvasToken')
    if (!encrypted) return []
    const token = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    const client = new CanvasClient(token)
    return client.getCourses()
  })

  ipcMain.handle('canvas:get-assignments', async (_event, courseId?: number) => {
    const encrypted = store.get('canvasToken')
    if (!encrypted) return []
    const token = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    const client = new CanvasClient(token)
    if (courseId) {
      return client.getCourseAssignments(courseId)
    }
    return client.getUpcomingAssignments()
  })

  ipcMain.handle('canvas:get-announcements', async () => {
    const encrypted = store.get('canvasToken')
    if (!encrypted) return []
    const token = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    const client = new CanvasClient(token)
    return client.getAnnouncements()
  })

  ipcMain.handle('canvas:send-message', async (_event, recipientIds: string[], subject: string, body: string) => {
    const encrypted = store.get('canvasToken')
    if (!encrypted) return { success: false, error: 'No Canvas token' }
    const token = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    const client = new CanvasClient(token)
    return client.sendMessage(recipientIds, subject, body)
  })

  ipcMain.handle('canvas:get-instructors', async (_event, courseId: number) => {
    const encrypted = store.get('canvasToken')
    if (!encrypted) return []
    const token = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    const client = new CanvasClient(token)
    return client.getCourseInstructors(courseId)
  })

  ipcMain.handle('canvas:get-submissions', async (_event, courseId: number, assignmentId: number) => {
    const encrypted = store.get('canvasToken')
    if (!encrypted) return []
    const token = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    const client = new CanvasClient(token)
    return client.getSubmissions(courseId, assignmentId)
  })

  ipcMain.handle('canvas:get-submission-content', async (_event, courseId: number, assignmentId: number, userId: number) => {
    const encrypted = store.get('canvasToken')
    if (!encrypted) return null
    const token = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    const client = new CanvasClient(token)
    return client.getSubmissionContent(courseId, assignmentId, userId)
  })

  ipcMain.handle('canvas:update-grade', async (_event, courseId: number, assignmentId: number, studentId: number, payload: { score: number; rubricAssessment?: Record<string, { points: number }>; comment?: string }) => {
    const encrypted = store.get('canvasToken')
    if (!encrypted) throw new Error('No Canvas token')
    const token = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    const client = new CanvasClient(token)
    return client.updateGrade(courseId, assignmentId, studentId, payload)
  })

  ipcMain.handle('canvas:bulk-update-grades', async (_event, courseId: number, assignmentId: number, payloads: Array<{ studentId: number; score: number; rubricAssessment?: Record<string, { points: number }>; comment?: string }>) => {
    const encrypted = store.get('canvasToken')
    if (!encrypted) throw new Error('No Canvas token')
    const token = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    const client = new CanvasClient(token)
    return client.bulkUpdateGrades(courseId, assignmentId, payloads)
  })

  ipcMain.handle('canvas:check-is-instructor', async () => {
    const encrypted = store.get('canvasToken')
    if (!encrypted) return false
    const token = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    const client = new CanvasClient(token)
    return client.checkIsInstructor()
  })

  // Provider management
  ipcMain.handle('provider:check-installed', async () => {
    return providerManager.checkAllInstalled()
  })

  ipcMain.handle('provider:auth-status', async () => {
    return providerManager.getAllAuthStatus()
  })

  ipcMain.handle('provider:auth-status-single', async (_event, id: ProviderId) => {
    return providerManager.getAuthStatus(id)
  })

  ipcMain.handle('provider:login', async (_event, id: ProviderId) => {
    await providerManager.login(id)
    return providerManager.getAuthStatus(id)
  })

  ipcMain.handle('provider:logout', async (_event, id: ProviderId) => {
    await providerManager.logout(id)
    return true
  })

  ipcMain.handle('provider:set-active', async (_event, id: ProviderId) => {
    providerManager.setActive(id)
    store.set('activeProvider', id)
    return true
  })

  ipcMain.handle('provider:get-active', async () => {
    return providerManager.activeProviderId
  })

  // Chat streaming — one-shot spawn per message with --resume for session continuity
  ipcMain.on('provider:chat', async (event, { message, systemPrompt, tabId }) => {
    try {
      const auth = await providerManager.active.getAuthStatus()
      if (!auth.installed) {
        event.reply(`chat:error:${tabId}`, { error: 'AI provider not installed. Go to Settings to set up Claude Code or Codex CLI.' })
        return
      }
      if (!auth.loggedIn) {
        event.reply(`chat:error:${tabId}`, { error: 'Not authenticated. Go to Settings and connect your AI subscription.' })
        return
      }

      const vaultContext = vault.toSystemPromptContext()
      const fullPrompt = systemPrompt + vaultContext

      for await (const streamEvent of providerManager.streamChat({
        message,
        systemPrompt: fullPrompt,
        tabId,
      })) {
        if (streamEvent.type === 'text' && streamEvent.text) {
          event.reply(`chat:chunk:${tabId}`, { type: 'text', text: streamEvent.text })
        } else if (streamEvent.type === 'error') {
          event.reply(`chat:error:${tabId}`, { error: streamEvent.text ?? 'Unknown error' })
          return
        }
      }
      event.reply(`chat:done:${tabId}`, {})
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      event.reply(`chat:error:${tabId}`, { error: msg })
    }
  })

  ipcMain.on('provider:chat-cancel', () => {
    providerManager.cancelChat()
  })

  // ── Terminal (embedded Claude CLI) ──────────────────────────────────────

  terminalManager = new TerminalManager(mainWindow)

  ipcMain.on('terminal:start', (_event, { tabId, systemPrompt }: { tabId: string; systemPrompt?: string }) => {
    const vaultContext = vault.toSystemPromptContext()
    const fullPrompt = (systemPrompt ?? '') + vaultContext
    terminalManager!.startSession(tabId, fullPrompt)
  })

  ipcMain.on('terminal:write', (_event, { tabId, data }: { tabId: string; data: string }) => {
    terminalManager!.write(tabId, data)
  })

  ipcMain.on('terminal:resize', (_event, { tabId, cols, rows }: { tabId: string; cols: number; rows: number }) => {
    terminalManager!.resize(tabId, cols, rows)
  })

  ipcMain.on('terminal:kill', (_event, tabId: string) => {
    terminalManager!.killSession(tabId)
  })

  ipcMain.handle('terminal:has-session', (_event, tabId: string) => {
    return terminalManager!.hasSession(tabId)
  })

  // CEO mode — process message through dispatcher + workers
  ipcMain.on('ceo:process', async (_event, { tabId, message, systemPrompt }) => {
    if (!ceoEngine) {
      ceoEngine = new CeoEngine(mainWindow)
    }
    const vaultContext = vault.toSystemPromptContext()
    const fullPrompt = (systemPrompt || BASE_SYSTEM_PROMPT) + vaultContext
    await ceoEngine.processMessage(tabId, message, fullPrompt)
  })

  ipcMain.on('ceo:cancel', () => {
    ceoEngine?.cancelAll()
  })

  // Auto mode — spec conversation + plan + execution
  ipcMain.on('auto:spec', async (_event, { tabId, message, systemPrompt }) => {
    if (!autoEngine) {
      autoEngine = new AutoEngine(mainWindow)
    }
    const vaultContext = vault.toSystemPromptContext()
    const fullPrompt = (systemPrompt || BASE_SYSTEM_PROMPT) + vaultContext
    await autoEngine.processSpecMessage(tabId, message, fullPrompt)
  })

  ipcMain.on('auto:execute', async (_event, { tabId, plan, systemPrompt }) => {
    if (!autoEngine) {
      autoEngine = new AutoEngine(mainWindow)
    }
    const vaultContext = vault.toSystemPromptContext()
    const fullPrompt = (systemPrompt || BASE_SYSTEM_PROMPT) + vaultContext
    await autoEngine.executePlan(tabId, plan, fullPrompt)
  })

  ipcMain.on('auto:interrupt', async (_event, { tabId, message }) => {
    if (autoEngine) {
      await autoEngine.interrupt(tabId, message)
    }
  })

  ipcMain.on('auto:cancel', () => {
    autoEngine?.cancel()
  })

  // ── Grading (Teacher Mode) ────────────────────────────────────────────

  ipcMain.on('grading:start-provisional', async (_event, { sessionId, courseId, assignmentId }: { sessionId: string; courseId: number; assignmentId: number }) => {
    const encrypted = store.get('canvasToken')
    if (!encrypted) return
    const token = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    const client = new CanvasClient(token)

    try {
      const [submissions, rubric] = await Promise.all([
        client.getSubmissions(courseId, assignmentId),
        client.getAssignmentRubric(courseId, assignmentId),
      ])

      if (!rubric || rubric.length === 0) {
        mainWindow.webContents.send('grading:error', { sessionId, error: 'Assignment has no rubric' })
        return
      }

      if (!gradingEngine) {
        gradingEngine = new GradingEngine(mainWindow)
      }

      await gradingEngine.startProvisionalScoring(sessionId, submissions, rubric)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Grading failed'
      mainWindow.webContents.send('grading:error', { sessionId, error: msg })
    }
  })

  ipcMain.on('grading:cancel', () => {
    gradingEngine?.cancel()
  })

  // Legacy Chat streaming (API key based — kept for backward compat)
  ipcMain.on('chat:stream', async (event, { messages, systemPrompt, tools, tabId }) => {
    const encrypted = store.get('apiKey')
    if (!encrypted) {
      event.reply(`chat:error:${tabId}`, { error: 'No API key configured' })
      return
    }
    const apiKey = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))

    try {
      for await (const chunk of streamChat(apiKey, messages, systemPrompt, tools)) {
        event.reply(`chat:chunk:${tabId}`, chunk)
      }
      event.reply(`chat:done:${tabId}`, {})
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      event.reply(`chat:error:${tabId}`, { error: msg })
    }
  })

  ipcMain.on('chat:cancel', (_event, { tabId }) => {
    cancelStream(tabId)
  })

  // Agent loop
  ipcMain.on('agent:run', async (event, { messages, systemPrompt, tools, tabId, mode }) => {
    const encrypted = store.get('apiKey')
    if (!encrypted) {
      event.reply(`agent:error:${tabId}`, { error: 'No API key configured' })
      return
    }
    const apiKey = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))

    try {
      for await (const agentEvent of runAgentLoop(apiKey, messages, systemPrompt, tools, mode)) {
        event.reply(`agent:event:${tabId}`, agentEvent)
      }
      event.reply(`agent:done:${tabId}`, {})
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error'
      event.reply(`agent:error:${tabId}`, { error: msg })
    }
  })

  ipcMain.on('agent:cancel', (_event, { tabId }) => {
    cancelAgentLoop(tabId)
  })

  // File system
  ipcMain.handle('file:read', async (_event, path: string) => {
    return readFile(path, 'utf-8')
  })

  ipcMain.handle('file:write', async (_event, path: string, content: string) => {
    await writeFile(path, content, 'utf-8')
    return true
  })

  ipcMain.handle('file:list', async (_event, dirPath: string) => {
    const entries = await readdir(dirPath, { withFileTypes: true })
    return entries.map(e => ({
      name: e.name,
      isDirectory: e.isDirectory(),
      path: join(dirPath, e.name)
    }))
  })

  ipcMain.handle('file:pick', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'All Files', extensions: ['*'] },
        { name: 'Documents', extensions: ['txt', 'md', 'pdf', 'doc', 'docx'] },
        { name: 'Code', extensions: ['ts', 'tsx', 'js', 'jsx', 'py', 'rs'] }
      ]
    })
    if (result.canceled) return []
    return result.filePaths
  })

  // Skills
  ipcMain.handle('skills:get-for-project', (_event, projectType: string) => {
    return getSkillsForProject(projectType)
  })

  ipcMain.handle('skills:get-all', () => {
    return getAllSkills()
  })

  // Scan Claude's actual skills and MCP servers from ~/.claude/
  ipcMain.handle('skills:scan-claude', () => {
    return scanAll()
  })

  ipcMain.handle('skills:scan-skills', () => {
    return scanSkills()
  })

  ipcMain.handle('skills:scan-mcps', () => {
    return scanMcpServers()
  })

  // Tools
  ipcMain.handle('tools:get-for-project', (_event, projectType: string, enabledSkillIds: string[]) => {
    return getToolsForProject(projectType, enabledSkillIds)
  })

  // Writing style
  ipcMain.handle('writing-style:analyze', async (_event, samples: string[]) => {
    const encrypted = store.get('apiKey')
    if (!encrypted) throw new Error('No API key configured')
    const apiKey = safeStorage.decryptString(Buffer.from(encrypted, 'base64'))
    return analyzeWritingSamples(apiKey, samples)
  })

  // Updates
  ipcMain.handle('app:check-updates', async () => {
    try {
      const { autoUpdater } = require('electron-updater')
      const result = await autoUpdater.checkForUpdates()
      return { available: !!result?.updateInfo, version: result?.updateInfo?.version }
    } catch {
      return { available: false }
    }
  })

  // Data management
  ipcMain.handle('app:clear-all-data', async () => {
    const { rmSync } = require('fs')
    const { app: electronApp } = require('electron')
    const userData = electronApp.getPath('userData')
    // Kill all terminal sessions
    terminalManager?.killAll()
    // Clear vault, store, and cached data
    try { rmSync(join(userData, 'vault'), { recursive: true, force: true }) } catch {}
    try { rmSync(join(userData, 'store.json'), { force: true }) } catch {}
    try { rmSync(join(userData, 'Local Storage'), { recursive: true, force: true }) } catch {}
    try { rmSync(join(userData, 'Session Storage'), { recursive: true, force: true }) } catch {}
    return true
  })

  ipcMain.handle('app:uninstall', async () => {
    const { execSync: execSyncLocal } = require('child_process')
    const { rmSync } = require('fs')
    const { app: electronApp } = require('electron')
    const userData = electronApp.getPath('userData')
    // Kill all terminal sessions
    terminalManager?.killAll()
    // Clear all app data
    try { rmSync(userData, { recursive: true, force: true }) } catch {}
    // Find and launch the NSIS uninstaller
    const uninstaller = join(process.resourcesPath ?? '', '..', 'Uninstall Plume.exe')
    try {
      execSyncLocal(`start "" "${uninstaller}"`, { shell: true, windowsHide: false })
    } catch {
      // If uninstaller not found, just quit
    }
    electronApp.quit()
    return true
  })

  // Onboarding
  ipcMain.handle('app:get-onboarding-complete', () => {
    return store.get('onboardingComplete') === 'true'
  })

  ipcMain.handle('app:set-onboarding-complete', () => {
    store.set('onboardingComplete', 'true')
    return true
  })

  // Store generic
  ipcMain.handle('store:get', (_event, key: string) => store.get(key))
  ipcMain.handle('store:set', (_event, key: string, value: string) => {
    store.set(key, value)
    return true
  })

  // Vault
  ipcMain.handle('vault:get-all', () => vault.getAllMasked())
  ipcMain.handle('vault:get', (_event, key: string) => vault.get(key))
  ipcMain.handle('vault:set', (_event, key: string, value: string, label: string, category: string) => {
    vault.set(key, value, label, category)
    return true
  })
  ipcMain.handle('vault:delete', (_event, key: string) => {
    vault.delete(key)

    // When a vault entry is deleted, also remove the backing credential
    if (key === 'canvas-token') {
      store.delete('canvasToken')
      mainWindow.webContents.send('vault:credential-revoked', { key, service: 'canvas' })
    }

    return true
  })
  ipcMain.handle('vault:context', () => vault.toSystemPromptContext())
}
