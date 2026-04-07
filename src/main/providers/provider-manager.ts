import { ClaudeProvider } from './claude-provider'
import { CodexProvider } from './codex-provider'
import type { Provider, ProviderId, ProviderAuth, ProvidersState, ChatOptions, StreamEvent } from './provider-types'

export class ProviderManager {
  private providers: Record<ProviderId, Provider>
  private activeId: ProviderId = 'claude'

  constructor() {
    this.providers = {
      claude: new ClaudeProvider(),
      codex: new CodexProvider(),
    }
  }

  get active(): Provider {
    return this.providers[this.activeId]
  }

  get activeProviderId(): ProviderId {
    return this.activeId
  }

  setActive(id: ProviderId): void {
    this.activeId = id
  }

  async checkAllInstalled(): Promise<Record<ProviderId, boolean>> {
    const [claude, codex] = await Promise.all([
      this.providers.claude.checkInstalled(),
      this.providers.codex.checkInstalled(),
    ])
    return { claude, codex }
  }

  async getAllAuthStatus(): Promise<ProvidersState> {
    const [claude, codex] = await Promise.all([
      this.providers.claude.getAuthStatus(),
      this.providers.codex.getAuthStatus(),
    ])
    return { claude, codex, active: this.activeId }
  }

  async getAuthStatus(id: ProviderId): Promise<ProviderAuth> {
    return this.providers[id].getAuthStatus()
  }

  async login(id: ProviderId): Promise<void> {
    return this.providers[id].login()
  }

  async logout(id: ProviderId): Promise<void> {
    return this.providers[id].logout()
  }

  /**
   * Stream a chat message. Handles per-tab session continuity via --resume.
   */
  streamChat(options: ChatOptions & { tabId?: string }): AsyncGenerator<StreamEvent> {
    return this.active.streamChat(options)
  }

  cancelChat(): void {
    this.active.cancelChat()
  }

  /** Clear a tab's session (e.g., when permanently deleting a project) */
  clearSession(tabId: string): void {
    const claude = this.providers.claude as ClaudeProvider
    claude.clearSession(tabId)
  }
}

// Singleton
let instance: ProviderManager | null = null

export function getProviderManager(): ProviderManager {
  if (!instance) {
    instance = new ProviderManager()
  }
  return instance
}

export type { Provider, ProviderId, ProviderAuth, ProvidersState, ChatOptions, StreamEvent }
