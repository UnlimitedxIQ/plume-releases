// ── Core Chat Types ────────────────────────────────────────────────────────

export type MessageRole = 'user' | 'assistant' | 'system'

export interface TextContent {
  type: 'text'
  text: string
}

export interface ToolUseContent {
  type:  'tool_use'
  id:    string
  name:  string
  input: Record<string, unknown>
}

export interface ToolResultContent {
  type:       'tool_result'
  tool_use_id:string
  content:    string
  is_error?:  boolean
}

export interface ImageContent {
  type:   'image'
  source: {
    type:      'base64'
    media_type:'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'
    data:      string
  }
}

export type MessageContent =
  | TextContent
  | ToolUseContent
  | ToolResultContent
  | ImageContent

// ── Message ────────────────────────────────────────────────────────────────

export interface Message {
  id:        string
  role:      MessageRole
  content:   MessageContent | MessageContent[]
  timestamp: number
  /** Tool calls that occurred as part of this assistant turn */
  toolCalls?: ToolCall[]
  /** Files attached to this message */
  attachments?: MessageAttachment[]
  /** Streaming in progress */
  streaming?: boolean
  /** Error during generation */
  error?: string
}

// ── Tool Call ──────────────────────────────────────────────────────────────

export type ToolCallStatus = 'pending' | 'running' | 'success' | 'error'

export interface ToolCall {
  id:        string
  name:      string
  input:     Record<string, unknown>
  output?:   string
  isError?:  boolean
  status:    ToolCallStatus
  startedAt: number
  endedAt?:  number
}

// ── Attachment ─────────────────────────────────────────────────────────────

export interface MessageAttachment {
  name:     string
  path:     string
  size:     number
  mimeType: string
  /** Inline content for text files */
  content?: string
}

// ── Conversation ───────────────────────────────────────────────────────────

export interface Conversation {
  tabId:     string
  messages:  Message[]
  createdAt: number
  updatedAt: number
  /** Token count estimate */
  tokenCount?: number
}

// ── Streaming ─────────────────────────────────────────────────────────────

export interface StreamingState {
  isStreaming:  boolean
  text:         string
  currentToolCall?: Partial<ToolCall>
}

// ── Helper: extract text from message content ──────────────────────────────

export function getMessageText(msg: Message): string {
  const content = msg.content
  if (!content) return ''

  if (typeof content === 'string') return content as string

  if (Array.isArray(content)) {
    return content
      .filter((c): c is TextContent => c.type === 'text')
      .map(c => c.text)
      .join('')
  }

  if ((content as MessageContent).type === 'text') {
    return (content as TextContent).text
  }

  return ''
}

// ── Helper: create a new user message ────────────────────────────────────

export function createUserMessage(
  text: string,
  attachments?: MessageAttachment[]
): Message {
  return {
    id:          crypto.randomUUID(),
    role:        'user',
    content:     { type: 'text', text },
    timestamp:   Date.now(),
    attachments,
  }
}

// ── Helper: create a new assistant message ────────────────────────────────

export function createAssistantMessage(text = ''): Message {
  return {
    id:        crypto.randomUUID(),
    role:      'assistant',
    content:   { type: 'text', text },
    timestamp: Date.now(),
    streaming: true,
  }
}
