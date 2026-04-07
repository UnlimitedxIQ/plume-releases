import { spawn, ChildProcess, execSync } from 'child_process'
import { join } from 'path'
import { homedir } from 'os'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { app, type BrowserWindow } from 'electron'

function getClaudePath(): string {
  // Bundled with app (production)
  const bundled = join(process.resourcesPath ?? app.getAppPath(), 'claude-cli', 'claude.exe')
  if (existsSync(bundled)) return bundled
  // Dev: resources folder
  const dev = join(app.getAppPath(), 'resources', 'claude-cli', 'claude.exe')
  if (existsSync(dev)) return dev
  // User's local install
  const localBin = join(homedir(), '.local', 'bin', 'claude')
  if (existsSync(localBin)) return localBin
  // Fallback: PATH
  try {
    const p = execSync('where claude', { encoding: 'utf-8', timeout: 3000 }).trim().split('\n')[0]
    if (p) return p.trim()
  } catch {}
  return 'claude'
}

function getWinptyPath(): string {
  // Bundled with app (production)
  const bundled = join(process.resourcesPath ?? app.getAppPath(), 'winpty', 'winpty.exe')
  if (existsSync(bundled)) return bundled
  // Dev: resources folder
  const dev = join(app.getAppPath(), 'resources', 'winpty', 'winpty.exe')
  if (existsSync(dev)) return dev
  // Fallback: Git's winpty
  const git = 'C:\\Program Files\\Git\\usr\\bin\\winpty.exe'
  if (existsSync(git)) return git
  return 'winpty'
}

interface TerminalSession {
  proc: ChildProcess
  systemPromptFile: string | null
}

/**
 * Manages persistent Claude CLI terminal sessions — one per tab.
 * Uses winpty to give Claude a real PTY so interactive mode works.
 * Output is relayed to the renderer via IPC for xterm.js to render.
 */
export class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map()
  private window: BrowserWindow

  constructor(window: BrowserWindow) {
    this.window = window
  }

  /**
   * Start a new Claude CLI session in a real PTY via winpty.
   */
  startSession(tabId: string, systemPrompt?: string): void {
    this.killSession(tabId)

    const claudeArgs = ['--verbose', '--dangerously-skip-permissions']

    // Write system prompt to temp file
    let systemPromptFile: string | null = null
    if (systemPrompt) {
      systemPromptFile = join(tmpdir(), `plume-sp-${tabId.slice(0, 8)}-${Date.now()}.txt`)
      writeFileSync(systemPromptFile, systemPrompt, 'utf-8')
      claudeArgs.push('--system-prompt-file', systemPromptFile)
    }

    // Spawn Claude through winpty for real PTY support
    const winptyPath = getWinptyPath()
    const claudePath = getClaudePath()

    // Add winpty's directory to PATH so msys-2.0.dll is found
    const winptyDir = join(winptyPath, '..')
    const env = { ...process.env, PATH: `${winptyDir};${process.env.PATH ?? ''}` }

    const proc = spawn(winptyPath, [
      '-Xallow-non-tty',
      '-Xplain',
      claudePath,
      ...claudeArgs,
    ], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: homedir(),
      windowsHide: true,
      env,
    })

    const session: TerminalSession = { proc, systemPromptFile }
    this.sessions.set(tabId, session)

    // Relay stdout to renderer
    proc.stdout?.on('data', (chunk: Buffer) => {
      this.window.webContents.send(`terminal:data:${tabId}`, chunk.toString('binary'))
    })

    // Relay stderr to renderer (Claude sends some output to stderr)
    proc.stderr?.on('data', (chunk: Buffer) => {
      this.window.webContents.send(`terminal:data:${tabId}`, chunk.toString('binary'))
    })

    // Handle process exit
    proc.on('close', (code) => {
      this.window.webContents.send(`terminal:exit:${tabId}`, { code })
      this.cleanup(tabId)
    })

    proc.on('error', (err) => {
      this.window.webContents.send(`terminal:exit:${tabId}`, { code: -1, error: err.message })
      this.cleanup(tabId)
    })
  }

  /**
   * Write user input (keystrokes) to the session's stdin.
   */
  write(tabId: string, data: string): void {
    const session = this.sessions.get(tabId)
    if (session?.proc.stdin?.writable) {
      session.proc.stdin.write(data)
    }
  }

  /**
   * Resize the PTY (winpty doesn't support resize via pipes, but we try).
   */
  resize(tabId: string, cols: number, rows: number): void {
    // winpty with -Xplain doesn't support dynamic resize
    // This is a no-op for now but keeps the interface ready for node-pty upgrade
    void cols
    void rows
    void tabId
  }

  /**
   * Check if a tab has an active session.
   */
  hasSession(tabId: string): boolean {
    const session = this.sessions.get(tabId)
    return !!session && !session.proc.killed
  }

  /**
   * Kill a tab's terminal session.
   */
  killSession(tabId: string): void {
    const session = this.sessions.get(tabId)
    if (!session) return
    if (!session.proc.killed) {
      session.proc.kill('SIGTERM')
    }
    this.cleanup(tabId)
  }

  /**
   * Kill all sessions (app shutdown).
   */
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
