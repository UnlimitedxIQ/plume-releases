import { spawn, execSync, ChildProcess } from 'child_process'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir, homedir } from 'os'
import { app } from 'electron'
import type { Provider, ProviderAuth, ChatOptions, StreamEvent } from './provider-types'

function getClaudePath(): string {
  // Bundled with app
  const bundled = join(process.resourcesPath ?? app.getAppPath(), 'claude-cli', 'claude.exe')
  if (existsSync(bundled)) return bundled
  // Dev resources
  const dev = join(app.getAppPath(), 'resources', 'claude-cli', 'claude.exe')
  if (existsSync(dev)) return dev
  // User local install
  const local = join(homedir(), '.local', 'bin', 'claude')
  if (existsSync(local)) return local
  return 'claude'
}

export class ClaudeProvider implements Provider {
  id = 'claude' as const
  name = 'Claude Code'
  private activeProcess: ChildProcess | null = null
  private tabSessions: Map<string, string> = new Map()

  async checkInstalled(): Promise<boolean> {
    try {
      execSync(`"${getClaudePath()}" --version`, { stdio: 'pipe', timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  async getAuthStatus(): Promise<ProviderAuth> {
    const installed = await this.checkInstalled()
    if (!installed) return { installed: false, loggedIn: false }
    try {
      const output = execSync('claude auth status', {
        stdio: 'pipe', timeout: 10000, encoding: 'utf-8',
      })
      const status = JSON.parse(output.trim())
      return {
        installed: true,
        loggedIn: status.loggedIn ?? false,
        email: status.email,
        subscriptionType: status.subscriptionType,
        authMethod: status.authMethod,
      }
    } catch {
      return { installed: true, loggedIn: false }
    }
  }

  async login(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const proc = spawn(getClaudePath(), ['auth', 'login', '--claudeai'], { stdio: 'inherit', shell: false })
      proc.on('close', (code) => code === 0 ? resolve() : reject(new Error(`Login exited ${code}`)))
      proc.on('error', reject)
    })
  }

  async logout(): Promise<void> {
    try { execSync('claude auth logout', { stdio: 'pipe', timeout: 5000 }) } catch {}
  }

  hasSession(tabId: string): boolean { return this.tabSessions.has(tabId) }
  getSessionId(tabId: string): string | undefined { return this.tabSessions.get(tabId) }
  setSessionId(tabId: string, id: string): void { this.tabSessions.set(tabId, id) }
  clearSession(tabId: string): void { this.tabSessions.delete(tabId) }

  async *streamChat(options: ChatOptions): AsyncGenerator<StreamEvent> {
    const tabId = (options as { tabId?: string }).tabId

    const args = ['-p', '--output-format', 'stream-json', '--verbose', '--dangerously-skip-permissions']

    // Resume or start new
    let spFile: string | null = null
    if (tabId && this.tabSessions.has(tabId)) {
      args.push('--resume', this.tabSessions.get(tabId)!)
      // Resuming existing session
    } else if (options.systemPrompt) {
      spFile = join(tmpdir(), `plume-sp-${Date.now()}.txt`)
      writeFileSync(spFile, options.systemPrompt, 'utf-8')
      args.push('--system-prompt-file', spFile)
      // New session with system prompt file
    }

    args.push(options.message)


    const proc = spawn(getClaudePath(), args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
      cwd: options.cwd ?? homedir(),
    })

    this.activeProcess = proc

    proc.on('error', (err) => {

    })

    proc.stderr?.on('data', (chunk: Buffer) => {

    })

    let buffer = ''
    let eventCount = 0

    try {
      for await (const chunk of proc.stdout!) {
        buffer += chunk.toString()
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          try {
            const event = JSON.parse(trimmed) as Record<string, unknown>

            if (event.session_id && tabId) {
              this.setSessionId(tabId, event.session_id as string)
            }

            const type = event.type as string
            if (type === 'system') continue

            eventCount++


            if (type === 'content_block_delta') {
              const delta = event.delta as Record<string, unknown> | undefined
              const text = (delta?.text ?? '') as string
              if (text) yield { type: 'text', text }
            } else if (type === 'assistant') {
              const msg = event.message as Record<string, unknown> | undefined
              if (msg && Array.isArray(msg.content)) {
                for (const block of msg.content as Array<Record<string, unknown>>) {
                  if (block.type === 'text' && block.text) {
                    yield { type: 'text', text: block.text as string }
                  }
                }
              }
            } else if (type === 'result') {

            }
          } catch { /* skip non-JSON */ }
        }
      }


      yield { type: 'done' }
    } catch (error) {

      yield { type: 'error', text: error instanceof Error ? error.message : 'Stream error' }
    } finally {
      this.activeProcess = null
      if (spFile) { try { unlinkSync(spFile) } catch {} }
    }
  }

  cancelChat(): void {
    if (this.activeProcess) {
      this.activeProcess.kill('SIGTERM')
      this.activeProcess = null
    }
  }
}
