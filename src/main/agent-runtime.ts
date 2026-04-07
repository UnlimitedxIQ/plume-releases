import Anthropic from '@anthropic-ai/sdk'
import { executeTool } from './tool-registry'

const activeLoops = new Map<string, AbortController>()

type AgentMode = 'standard' | 'planner' | 'executor' | 'planner_executor' | 'loop'

interface AgentEvent {
  type: 'text_delta' | 'tool_start' | 'tool_result' | 'plan_generated' | 'plan_step_update' |
        'iteration_start' | 'iteration_complete' | 'file_diff' | 'message_done' | 'error'
  text?: string
  toolCall?: { id: string; name: string; input: Record<string, unknown> }
  toolResult?: { id: string; output: string; isError: boolean }
  plan?: PlanData
  stepUpdate?: { stepId: string; status: string }
  iteration?: { current: number; max: number; delta?: string }
  diff?: { path: string; before: string; after: string }
  error?: string
}

interface PlanStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'active' | 'done' | 'skipped'
  subSteps?: string[]
}

interface PlanData {
  title: string
  steps: PlanStep[]
}

interface ToolDef {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

interface Message {
  role: 'user' | 'assistant'
  content: string | ContentBlock[]
}

interface ContentBlock {
  type: string
  text?: string
  id?: string
  name?: string
  input?: Record<string, unknown>
  tool_use_id?: string
  content?: string
}

const PLANNER_SYSTEM_SUFFIX = `

When in Planner mode, you MUST first generate a structured plan before doing any work.
Output your plan as a JSON code block with this exact format:
\`\`\`json:plan
{
  "title": "Plan title",
  "steps": [
    {"id": "1", "title": "Step title", "description": "What to do", "status": "pending"},
    {"id": "2", "title": "Step title", "description": "What to do", "status": "pending"}
  ]
}
\`\`\`
After generating the plan, wait for user approval before executing.`

const EXECUTOR_SYSTEM_SUFFIX = `

When in Executor mode, work autonomously through the task. Use tools as needed.
Report progress after each significant step. Be thorough and methodical.`

const LOOP_SYSTEM_SUFFIX = `

When in Loop mode, iterate on the output until it meets the quality criteria.
After each iteration, evaluate if the output is satisfactory.
If not, explain what needs improvement and iterate again.
When satisfied, respond with "LOOP_COMPLETE" to signal you're done.`

export async function* runAgentLoop(
  apiKey: string,
  messages: Message[],
  systemPrompt: string,
  tools: ToolDef[],
  mode: AgentMode = 'standard',
  maxIterations: number = 25,
  maxLoopIterations: number = 10
): AsyncGenerator<AgentEvent> {
  const client = new Anthropic({ apiKey })
  const controller = new AbortController()
  const loopId = Math.random().toString(36).slice(2)
  activeLoops.set(loopId, controller)

  let enrichedSystem = systemPrompt
  if (mode === 'planner' || mode === 'planner_executor') {
    enrichedSystem += PLANNER_SYSTEM_SUFFIX
  }
  if (mode === 'executor' || mode === 'planner_executor') {
    enrichedSystem += EXECUTOR_SYSTEM_SUFFIX
  }
  if (mode === 'loop') {
    enrichedSystem += LOOP_SYSTEM_SUFFIX
  }

  const conversationMessages = [...messages]
  let iteration = 0
  let loopIteration = 0

  try {
    while (iteration < maxIterations) {
      if (controller.signal.aborted) break
      iteration++

      const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8192,
        system: enrichedSystem,
        messages: conversationMessages as Anthropic.MessageParam[],
        tools: tools as Anthropic.Tool[]
      })

      const assistantContent: ContentBlock[] = []
      let hasToolUse = false

      for (const block of response.content) {
        if (block.type === 'text') {
          assistantContent.push({ type: 'text', text: block.text })
          yield { type: 'text_delta', text: block.text }

          // Check for plan JSON in planner mode
          if (mode === 'planner' || mode === 'planner_executor') {
            const planMatch = block.text.match(/```json:plan\n([\s\S]*?)\n```/)
            if (planMatch) {
              try {
                const plan = JSON.parse(planMatch[1]) as PlanData
                yield { type: 'plan_generated', plan }
              } catch {
                // Invalid plan JSON, continue
              }
            }
          }

          // Check for loop completion
          if (mode === 'loop' && block.text.includes('LOOP_COMPLETE')) {
            yield { type: 'message_done' }
            return
          }
        } else if (block.type === 'tool_use') {
          hasToolUse = true
          assistantContent.push({
            type: 'tool_use',
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>
          })

          yield {
            type: 'tool_start',
            toolCall: { id: block.id, name: block.name, input: block.input as Record<string, unknown> }
          }

          // Execute the tool
          let result: string
          let isError = false
          try {
            result = await executeTool(block.name, block.input as Record<string, unknown>)

            // Track file diffs for executor mode
            if (block.name === 'write_file' && (mode === 'executor' || mode === 'planner_executor')) {
              const input = block.input as { path: string; content: string }
              yield {
                type: 'file_diff',
                diff: { path: input.path, before: '', after: input.content }
              }
            }
          } catch (error: unknown) {
            result = error instanceof Error ? error.message : 'Tool execution failed'
            isError = true
          }

          yield {
            type: 'tool_result',
            toolResult: { id: block.id, output: result, isError }
          }

          // Add tool result to conversation
          conversationMessages.push({
            role: 'assistant',
            content: assistantContent
          })
          conversationMessages.push({
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: block.id,
              content: result
            }]
          })
        }
      }

      if (!hasToolUse) {
        // No tool use — check if we should loop
        if (mode === 'loop' && loopIteration < maxLoopIterations) {
          loopIteration++
          yield { type: 'iteration_complete', iteration: { current: loopIteration, max: maxLoopIterations } }

          conversationMessages.push({
            role: 'assistant',
            content: assistantContent
          })
          conversationMessages.push({
            role: 'user',
            content: 'Please review your output and iterate to improve it. If satisfied, respond with LOOP_COMPLETE.'
          })
          continue
        }

        yield { type: 'message_done' }
        return
      }
    }

    yield { type: 'error', error: `Agent loop exceeded max iterations (${maxIterations})` }
  } finally {
    activeLoops.delete(loopId)
  }
}

export function cancelAgentLoop(tabId: string): void {
  const controller = activeLoops.get(tabId)
  if (controller) {
    controller.abort()
    activeLoops.delete(tabId)
  }
}
