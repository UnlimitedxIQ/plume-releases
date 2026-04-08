import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { homedir } from 'os'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { app, type BrowserWindow } from 'electron'
import { execSync } from 'child_process'
import { randomUUID } from 'crypto'

function getClaudePath(): string {
  const bundled = join(process.resourcesPath ?? app.getAppPath(), 'claude-cli', 'claude.exe')
  if (existsSync(bundled)) return bundled
  const dev = join(app.getAppPath(), 'resources', 'claude-cli', 'claude.exe')
  if (existsSync(dev)) return dev
  const localBin = join(homedir(), '.local', 'bin', 'claude')
  if (existsSync(localBin)) return localBin
  try {
    const p = execSync('where claude', { encoding: 'utf-8', timeout: 3000 }).trim().split('\n')[0]
    if (p) return p.trim()
  } catch {}
  return 'claude'
}

interface TerminalSession {
  proc: ChildProcess
  systemPromptFile: string | null
}

/**
 * Manages persistent Claude CLI terminal sessions — one per tab.
 * Uses conhost.exe for a real console + --session-id/--resume for continuity.
 */
export class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map()
  private sessionIds: Map<string, string> = new Map()  // tabId → Claude session UUID
  private window: BrowserWindow

  constructor(window: BrowserWindow) {
    this.window = window
  }

  startSession(tabId: string, systemPrompt?: string): void {
    // Kill existing process if running (but keep sessionId)
    const existing = this.sessions.get(tabId)
    if (existing && !existing.proc.killed) {
      existing.proc.kill('SIGTERM')
    }

    const claudePath = getClaudePath()
    const claudeArgs = ['--verbose', '--dangerously-skip-permissions']

    let systemPromptFile: string | null = null
    const existingSessionId = this.sessionIds.get(tabId)

    if (existingSessionId) {
      // Resume existing session
      claudeArgs.push('--resume', existingSessionId)
    } else {
      // New session — set a controlled session ID
      const sessionId = randomUUID()
      this.sessionIds.set(tabId, sessionId)
      claudeArgs.push('--session-id', sessionId)

      if (systemPrompt) {
        systemPromptFile = join(tmpdir(), `plume-sp-${tabId.slice(0, 8)}-${Date.now()}.txt`)
        writeFileSync(systemPromptFile, systemPrompt, 'utf-8')
        claudeArgs.push('--system-prompt-file', systemPromptFile)
      }
    }

    const proc = spawn('conhost.exe', [claudePath, ...claudeArgs], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: homedir(),
      windowsHide: true,
    })

    const session: TerminalSession = { proc, systemPromptFile }
    this.sessions.set(tabId, session)

    // Relay stdout
    proc.stdout?.on('data', (chunk: Buffer) => {
      this.window.webContents.send(`terminal:data:${tabId}`, chunk.toString('utf-8'))
    })

    // Relay stderr
    proc.stderr?.on('data', (chunk: Buffer) => {
      this.window.webContents.send(`terminal:data:${tabId}`, chunk.toString('utf-8'))
    })

    proc.on('close', (code) => {
      this.window.webContents.send(`terminal:exit:${tabId}`, { code })
    })

    proc.on('error', (err) => {
      this.window.webContents.send(`terminal:exit:${tabId}`, { code: -1, error: err.message })
    })
  }

  write(tabId: string, data: string): void {
    const session = this.sessions.get(tabId)
    if (session?.proc.stdin?.writable) {
      session.proc.stdin.write(data)
    }
  }

  /**
   * Park a session: kill the process but keep the session ID for resume.
   */
  parkSession(tabId: string): void {
    const session = this.sessions.get(tabId)
    if (session) {
      if (!session.proc.killed) {
        session.proc.kill('SIGTERM')
      }
      if (session.systemPromptFile) {
        try { unlinkSync(session.systemPromptFile) } catch {}
      }
      this.sessions.delete(tabId)
    }
    // Keep sessionIds entry — needed for --resume on reopen
  }

  /**
   * Permanently delete a session and its session ID.
   */
  killSession(tabId: string): void {
    this.parkSession(tabId)
    this.sessionIds.delete(tabId)
  }

  hasActiveProcess(tabId: string): boolean {
    const session = this.sessions.get(tabId)
    return !!session && !session.proc.killed
  }

  hasSessionId(tabId: string): boolean {
    return this.sessionIds.has(tabId)
  }

  killAll(): void {
    for (const tabId of this.sessions.keys()) {
      this.killSession(tabId)
    }
  }
}
