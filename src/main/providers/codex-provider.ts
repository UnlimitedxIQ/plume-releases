import { spawn, execSync, ChildProcess } from 'child_process'
import type { Provider, ProviderAuth, ChatOptions, StreamEvent } from './provider-types'

export class CodexProvider implements Provider {
  id = 'codex' as const
  name = 'OpenAI Codex'
  private activeProcess: ChildProcess | null = null

  async checkInstalled(): Promise<boolean> {
    try {
      execSync('codex --version', { stdio: 'pipe', timeout: 5000 })
      return true
    } catch {
      return false
    }
  }

  async getAuthStatus(): Promise<ProviderAuth> {
    const installed = await this.checkInstalled()
    if (!installed) {
      return { installed: false, loggedIn: false }
    }

    try {
      // Codex CLI auth check — may vary by version
      const output = execSync('codex auth status', {
        stdio: 'pipe',
        timeout: 10000,
        encoding: 'utf-8',
      })

      // Try to parse JSON output
      try {
        const status = JSON.parse(output.trim())
        return {
          installed: true,
          loggedIn: status.loggedIn ?? !!status.email,
          email: status.email,
          subscriptionType: status.plan ?? 'plus',
          authMethod: 'chatgpt',
        }
      } catch {
        // If not JSON, check if output indicates logged in
        const loggedIn = output.includes('logged in') || output.includes('authenticated')
        return { installed: true, loggedIn }
      }
    } catch {
      return { installed: true, loggedIn: false }
    }
  }

  async login(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const proc = spawn('codex', ['auth', 'login'], {
        stdio: 'inherit',
        shell: true,
      })

      proc.on('close', (code) => {
        if (code === 0) resolve()
        else reject(new Error(`Codex login exited with code ${code}`))
      })

      proc.on('error', reject)
    })
  }

  async logout(): Promise<void> {
    try {
      execSync('codex auth logout', { stdio: 'pipe', timeout: 5000 })
    } catch {
      // Ignore
    }
  }

  async *streamChat(options: ChatOptions): AsyncGenerator<StreamEvent> {
    // Codex CLI non-interactive mode
    const args = [
      '--quiet',
      '--approval-mode', 'full-auto',
    ]

    if (options.systemPrompt) {
      args.push('--instructions', options.systemPrompt)
    }

    args.push(options.message)

    const proc = spawn('codex', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true,
      cwd: options.cwd,
    })

    this.activeProcess = proc

    let buffer = ''

    try {
      for await (const chunk of proc.stdout!) {
        const text = chunk.toString()
        buffer += text

        // Codex outputs text directly in quiet mode
        yield { type: 'text', text }
      }

      yield { type: 'done' }
    } catch (error) {
      yield { type: 'error', text: error instanceof Error ? error.message : 'Stream error' }
    } finally {
      this.activeProcess = null
    }
  }

  cancelChat(): void {
    if (this.activeProcess) {
      this.activeProcess.kill('SIGTERM')
      this.activeProcess = null
    }
  }
}
