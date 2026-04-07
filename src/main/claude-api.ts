import Anthropic from '@anthropic-ai/sdk'

const activeStreams = new Map<string, AbortController>()

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}

interface ContentBlock {
  type: string
  text?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
}

interface ToolDef {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

interface StreamChunk {
  type: 'text_delta' | 'tool_use_start' | 'tool_use_delta' | 'tool_use_end' | 'content_block_stop' | 'message_stop' | 'message_start'
  text?: string
  toolUse?: {
    id: string
    name: string
    input: Record<string, unknown>
  }
  inputDelta?: string
  stopReason?: string
}

export async function* streamChat(
  apiKey: string,
  messages: ChatMessage[],
  systemPrompt: string,
  tools?: ToolDef[]
): AsyncGenerator<StreamChunk> {
  const client = new Anthropic({ apiKey })
  const controller = new AbortController()
  const tabId = Math.random().toString(36).slice(2)
  activeStreams.set(tabId, controller)

  try {
    const params: Record<string, unknown> = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      system: systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      stream: true
    }

    if (tools && tools.length > 0) {
      params.tools = tools
    }

    const stream = await client.messages.create(params as Anthropic.MessageCreateParams)

    let currentToolUse: { id: string; name: string; inputJson: string } | null = null

    for await (const event of stream as AsyncIterable<Anthropic.MessageStreamEvent>) {
      if (controller.signal.aborted) break

      switch (event.type) {
        case 'message_start':
          yield { type: 'message_start' }
          break

        case 'content_block_start':
          if (event.content_block.type === 'text') {
            // Text block starting
          } else if (event.content_block.type === 'tool_use') {
            currentToolUse = {
              id: event.content_block.id,
              name: event.content_block.name,
              inputJson: ''
            }
            yield {
              type: 'tool_use_start',
              toolUse: {
                id: event.content_block.id,
                name: event.content_block.name,
                input: {}
              }
            }
          }
          break

        case 'content_block_delta':
          if (event.delta.type === 'text_delta') {
            yield { type: 'text_delta', text: event.delta.text }
          } else if (event.delta.type === 'input_json_delta') {
            if (currentToolUse) {
              currentToolUse.inputJson += event.delta.partial_json
            }
            yield { type: 'tool_use_delta', inputDelta: event.delta.partial_json }
          }
          break

        case 'content_block_stop':
          if (currentToolUse) {
            try {
              const input = JSON.parse(currentToolUse.inputJson)
              yield {
                type: 'tool_use_end',
                toolUse: {
                  id: currentToolUse.id,
                  name: currentToolUse.name,
                  input
                }
              }
            } catch {
              yield {
                type: 'tool_use_end',
                toolUse: {
                  id: currentToolUse.id,
                  name: currentToolUse.name,
                  input: {}
                }
              }
            }
            currentToolUse = null
          }
          yield { type: 'content_block_stop' }
          break

        case 'message_stop':
          yield { type: 'message_stop' }
          break

        case 'message_delta':
          if ('stop_reason' in event.delta) {
            yield { type: 'message_stop', stopReason: event.delta.stop_reason as string }
          }
          break
      }
    }
  } finally {
    activeStreams.delete(tabId)
  }
}

export function cancelStream(tabId: string): void {
  const controller = activeStreams.get(tabId)
  if (controller) {
    controller.abort()
    activeStreams.delete(tabId)
  }
}

export { ChatMessage, ContentBlock, ToolDef, StreamChunk }
