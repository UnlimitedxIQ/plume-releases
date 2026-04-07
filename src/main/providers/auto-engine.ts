import type { BrowserWindow } from 'electron'
import { getProviderManager } from './provider-manager'
import { AUTO_SPEC_PROMPT, BASE_SYSTEM_PROMPT } from './prompt-constants'

interface AutoStep {
  title: string
  description: string
}

interface AutoPlan {
  title: string
  steps: AutoStep[]
}

/**
 * Auto Engine — handles the full autonomous execution flow:
 * 1. Spec phase: Claude asks clarifying questions
 * 2. Planning phase: Claude generates a structured plan
 * 3. Execution phase: Claude works through each step
 * 4. Interrupt: user can steer mid-execution
 */
export class AutoEngine {
  private window: BrowserWindow
  private cancelled = false
  private conversationHistory: Array<{ role: string; content: string }> = []

  constructor(window: BrowserWindow) {
    this.window = window
  }

  /**
   * Process a spec message — Claude responds with clarifying questions
   * or a plan. The left panel shows the conversation, the right panel
   * updates the Master Plan as Claude builds it.
   */
  async processSpecMessage(tabId: string, message: string, systemPrompt: string): Promise<void> {
    const provider = getProviderManager()
    const fullPrompt = `${systemPrompt}\n\n${AUTO_SPEC_PROMPT}`

    // Add user message to history
    this.conversationHistory.push({ role: 'user', content: message })

    // Build full conversation for context
    const fullMessage = this.conversationHistory
      .map(m => `${m.role === 'user' ? 'Human' : 'Assistant'}: ${m.content}`)
      .join('\n\n')

    let fullResponse = ''

    try {
      for await (const event of provider.streamChat({ message: fullMessage, systemPrompt: fullPrompt })) {
        if (event.type === 'text' && event.text) {
          fullResponse += event.text
          this.window.webContents.send(`chat:chunk:${tabId}`, { type: 'text', text: event.text })
        }
      }
      this.window.webContents.send(`chat:done:${tabId}`, {})
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error'
      this.window.webContents.send(`chat:error:${tabId}`, { error: msg })
      return
    }

    // Save assistant response to history
    this.conversationHistory.push({ role: 'assistant', content: fullResponse })

    // Check if response contains a plan
    const plan = parsePlan(fullResponse)
    if (plan) {
      this.window.webContents.send(`agent:event:${tabId}`, {
        type: 'auto_plan_ready',
        tabId,
        timestamp: Date.now(),
        payload: { title: plan.title, steps: plan.steps },
      })
    }
  }

  /**
   * Execute the plan step by step. Each step is sent to Claude
   * as a focused task.
   */
  async executePlan(tabId: string, plan: AutoPlan, systemPrompt: string): Promise<void> {
    const provider = getProviderManager()
    this.cancelled = false

    for (let i = 0; i < plan.steps.length; i++) {
      if (this.cancelled) break

      const step = plan.steps[i]
      const stepId = crypto.randomUUID()

      // Notify: step started
      this.window.webContents.send(`agent:event:${tabId}`, {
        type: 'auto_step_start',
        tabId,
        timestamp: Date.now(),
        payload: { stepId },
      })

      // Execute the step
      const taskMessage = `You are executing step ${i + 1} of ${plan.steps.length} in the plan "${plan.title}".\n\nStep: ${step.title}\nDescription: ${step.description}\n\nComplete this step thoroughly. Use tools as needed.`

      let stepResult = ''

      try {
        for await (const event of provider.streamChat({
          message: taskMessage,
          systemPrompt: `${systemPrompt}\n\nYou are in autonomous execution mode. Complete the assigned step and report what you did.`,
        })) {
          if (this.cancelled) break

          if (event.type === 'text' && event.text) {
            stepResult += event.text
            // Stream tool/text events to the frontend
            this.window.webContents.send(`agent:event:${tabId}`, {
              type: 'text_chunk',
              tabId,
              timestamp: Date.now(),
              payload: { text: event.text },
            })
          }
          if (event.type === 'tool_use') {
            this.window.webContents.send(`agent:event:${tabId}`, {
              type: 'tool_call',
              tabId,
              timestamp: Date.now(),
              payload: { callId: crypto.randomUUID(), name: event.toolName, input: event.toolInput },
            })
          }
          if (event.type === 'tool_result') {
            this.window.webContents.send(`agent:event:${tabId}`, {
              type: 'tool_result',
              tabId,
              timestamp: Date.now(),
              payload: { callId: '', output: event.toolOutput, isError: event.isError },
            })
          }
        }

        // Notify: step done
        this.window.webContents.send(`agent:event:${tabId}`, {
          type: 'auto_step_done',
          tabId,
          timestamp: Date.now(),
          payload: { stepId, result: stepResult.slice(0, 200) },
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Step failed'
        this.window.webContents.send(`agent:event:${tabId}`, {
          type: 'auto_step_done',
          tabId,
          timestamp: Date.now(),
          payload: { stepId, result: `Error: ${msg}` },
        })
      }
    }

    // All steps done
    if (!this.cancelled) {
      this.window.webContents.send(`agent:event:${tabId}`, {
        type: 'auto_done',
        tabId,
        timestamp: Date.now(),
        payload: {},
      })
    }
  }

  /**
   * Interrupt execution with a user message. Pauses execution,
   * sends the interrupt to Claude, then resumes.
   */
  async interrupt(tabId: string, message: string): Promise<void> {
    this.window.webContents.send(`agent:event:${tabId}`, {
      type: 'auto_interrupted',
      tabId,
      timestamp: Date.now(),
      payload: { message },
    })

    // Process the interrupt as a spec message (Claude responds, may adjust plan)
    await this.processSpecMessage(tabId, message, BASE_SYSTEM_PROMPT)
  }

  cancel(): void {
    this.cancelled = true
    getProviderManager().cancelChat()
  }

  reset(): void {
    this.conversationHistory = []
    this.cancelled = false
  }
}

/**
 * Parse a plan from Claude's response. Looks for:
 * ```json:plan
 * {"title": "...", "steps": [...]}
 * ```
 */
function parsePlan(response: string): AutoPlan | null {
  // Try json:plan format first
  const planMatch = response.match(/```json:plan\n([\s\S]*?)```/)
  if (planMatch) {
    try {
      return JSON.parse(planMatch[1]) as AutoPlan
    } catch { /* fall through */ }
  }

  // Try regular json block with plan structure
  const jsonMatch = response.match(/```json\n([\s\S]*?)```/)
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1])
      if (parsed.title && Array.isArray(parsed.steps)) {
        return parsed as AutoPlan
      }
    } catch { /* fall through */ }
  }

  return null
}
