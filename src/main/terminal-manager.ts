import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import { homedir } from 'os'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { app, type BrowserWindow } from 'electron'
import { execSync } from 'child_process'

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
  outputBuffer: string[]  // Stores all output for replay on tab switch
}

const MAX_BUFFER_LINES = 5000

/**
 * Manages persistent Claude CLI terminal sessions — one per tab.
 * Uses conhost.exe to give Claude a real Windows console/PTY.
 * Buffers output so tabs can be switched without losing state.
 */
export class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map()
  private window: BrowserWindow

  constructor(window: BrowserWindow) {
    this.window = window
  }

  startSession(tabId: string, systemPrompt?: string, cols = 120, rows = 30): void {
    // Don't restart if already running
    if (this.hasSession(tabId)) return

    const claudePath = getClaudePath()
    const claudeArgs = ['--verbose', '--dangerously-skip-permissions']

    let systemPromptFile: string | null = null
    if (systemPrompt) {
      systemPromptFile = join(tmpdir(), `plume-sp-${tabId.slice(0, 8)}-${Date.now()}.txt`)
      writeFileSync(systemPromptFile, systemPrompt, 'utf-8')
      claudeArgs.push('--system-prompt-file', systemPromptFile)
    }

    // Use cmd.exe with "mode con" to set terminal size before launching Claude
    // Quote each arg that contains spaces
    const quotedArgs = claudeArgs.map(a => a.includes(' ') || a.includes('\\') ? `"${a}"` : a)
    const claudeCmd = `mode con cols=${cols} lines=${rows} & "${claudePath}" ${quotedArgs.join(' ')}`

    const proc = spawn('conhost.exe', ['cmd.exe', '/c', claudeCmd], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: homedir(),
      windowsHide: true,
    })

    const session: TerminalSession = { proc, systemPromptFile, outputBuffer: [] }
    this.sessions.set(tabId, session)

    // Buffer and relay stdout
    proc.stdout?.on('data', (chunk: Buffer) => {
      const data = chunk.toString('utf-8')
      session.outputBuffer.push(data)
      // Trim buffer if too large
      if (session.outputBuffer.length > MAX_BUFFER_LINES) {
        session.outputBuffer.splice(0, session.outputBuffer.length - MAX_BUFFER_LINES)
      }
      this.window.webContents.send(`terminal:data:${tabId}`, data)
    })

    proc.stderr?.on('data', (chunk: Buffer) => {
      const data = chunk.toString('utf-8')
      session.outputBuffer.push(data)
      if (session.outputBuffer.length > MAX_BUFFER_LINES) {
        session.outputBuffer.splice(0, session.outputBuffer.length - MAX_BUFFER_LINES)
      }
      this.window.webContents.send(`terminal:data:${tabId}`, data)
    })

    proc.on('close', (code) => {
      this.window.webContents.send(`terminal:exit:${tabId}`, { code })
      // Don't cleanup — keep buffer for display
    })

    proc.on('error', (err) => {
      this.window.webContents.send(`terminal:exit:${tabId}`, { code: -1, error: err.message })
    })
  }

  /**
   * Get buffered output for replay when a tab is re-mounted.
   */
  getBuffer(tabId: string): string {
    const session = this.sessions.get(tabId)
    if (!session) return ''
    return session.outputBuffer.join('')
  }

  write(tabId: string, data: string): void {
    const session = this.sessions.get(tabId)
    if (session?.proc.stdin?.writable) {
      session.proc.stdin.write(data)
    }
  }

  resize(_tabId: string, _cols: number, _rows: number): void {
    // conhost doesn't support dynamic resize via pipes
  }

  hasSession(tabId: string): boolean {
    const session = this.sessions.get(tabId)
    return !!session && !session.proc.killed
  }

  killSession(tabId: string): void {
    const session = this.sessions.get(tabId)
    if (!session) return
    if (!session.proc.killed) {
      session.proc.kill('SIGTERM')
    }
    this.cleanup(tabId)
  }

  killAll(): void {
    for (const tabId of this.sessions.keys()) {
      this.killSession(tabId)
    }
  }

  private cleanup(tabId: string): void {
    const session = this.sessions.get(tabId)
    if (session?.systemPromptFile) {
      try { unlinkSync(session.systemPromptFile) } catch {}
    }
    this.sessions.delete(tabId)
  }
}
