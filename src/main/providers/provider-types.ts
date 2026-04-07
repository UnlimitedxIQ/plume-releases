export type ProviderId = 'claude' | 'codex'

export interface ProviderAuth {
  installed: boolean
  loggedIn: boolean
  email?: string
  subscriptionType?: string
  authMethod?: string
}

export interface ProvidersState {
  claude: ProviderAuth
  codex: ProviderAuth
  active: ProviderId
}

export interface StreamEvent {
  type: 'text' | 'tool_use' | 'tool_result' | 'error' | 'done'
  text?: string
  toolName?: string
  toolInput?: Record<string, unknown>
  toolOutput?: string
  isError?: boolean
}

export interface ChatOptions {
  message: string
  systemPrompt?: string
  allowedTools?: string[]
  conversationId?: string
  resume?: boolean  // use --continue to resume the most recent session
  cwd?: string
}

export interface StreamResult {
  events: AsyncGenerator<StreamEvent>
  sessionId?: string  // returned by Claude Code for session tracking
}

export interface Provider {
  id: ProviderId
  name: string
  checkInstalled(): Promise<boolean>
  getAuthStatus(): Promise<ProviderAuth>
  login(): Promise<void>
  logout(): Promise<void>
  streamChat(options: ChatOptions): AsyncGenerator<StreamEvent>
  cancelChat(): void
}
