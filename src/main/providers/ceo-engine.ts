import type { BrowserWindow } from 'electron'
import { getProviderManager } from './provider-manager'
import type { StreamEvent } from './provider-types'
import { CEO_DISPATCHER_PROMPT, WORKER_PROMPTS, BASE_SYSTEM_PROMPT } from './prompt-constants'

type WorkerType = 'coder' | 'author' | 'review'

interface TaskBlock {
  worker: WorkerType
  task: string
}

const WORKER_TYPES: WorkerType[] = ['coder', 'author', 'review']

/**
 * CEO Engine — processes chat messages from the left panel,
 * detects task assignments in Claude's response, and dispatches
 * worker subprocesses for each task.
 */
export class CeoEngine {
  private window: BrowserWindow
  private activeWorkers: Map<string, AbortController> = new Map()

  constructor(window: BrowserWindow) {
    this.window = window
  }

  /**
   * Process a CEO mode chat message. Claude acts as the dispatcher —
   * its response may contain task blocks like:
   * ```task:coder
   * Build a REST API...
   * ```
   * We parse those out and spawn worker subprocesses.
   */
  async processMessage(tabId: string, message: string, systemPrompt: string): Promise<void> {
    const provider = getProviderManager()
    const fullPrompt = `${systemPrompt}\n\n${CEO_DISPATCHER_PROMPT}`

    let fullResponse = ''

    // Stream the dispatcher's response to the chat panel
    try {
      for await (const event of provider.streamChat({ message, systemPrompt: fullPrompt })) {
        if (event.type === 'text' && event.text) {
          fullResponse += event.text
          this.window.webContents.send(`chat:chunk:${tabId}`, { type: 'text', text: event.text })
        }
      }
      this.window.webContents.send(`chat:done:${tabId}`, {})
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Dispatcher error'
      this.window.webContents.send(`chat:error:${tabId}`, { error: msg })
      return
    }

    // Parse task blocks from the response
    const tasks = parseTaskBlocks(fullResponse)

    // Dispatch each task to its worker
    for (const task of tasks) {
      const taskId = crypto.randomUUID()

      // Notify frontend: task assigned
      this.window.webContents.send(`agent:event:${tabId}`, {
        type: 'worker_task_assigned',
        tabId,
        timestamp: Date.now(),
        payload: { worker: task.worker, taskId, title: task.task.slice(0, 80), context: task.task },
      })

      // Notify frontend: task started
      this.window.webContents.send(`agent:event:${tabId}`, {
        type: 'worker_task_started',
        tabId,
        timestamp: Date.now(),
        payload: { worker: task.worker, taskId },
      })

      // Execute the worker
      try {
        await this.runWorker(tabId, taskId, task.worker, task.task, systemPrompt)

        // Notify frontend: task done
        this.window.webContents.send(`agent:event:${tabId}`, {
          type: 'worker_task_done',
          tabId,
          timestamp: Date.now(),
          payload: { worker: task.worker, taskId, result: 'Task completed' },
        })
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Worker error'
        this.window.webContents.send(`agent:event:${tabId}`, {
          type: 'worker_task_error',
          tabId,
          timestamp: Date.now(),
          payload: { worker: task.worker, taskId, error: msg },
        })
      }
    }
  }

  private async runWorker(
    tabId: string,
    taskId: string,
    worker: WorkerType,
    task: string,
    basePrompt: string
  ): Promise<void> {
    const provider = getProviderManager()
    const workerPrompt = `${basePrompt}\n\n${WORKER_PROMPTS[worker]}`

    for await (const event of provider.streamChat({ message: task, systemPrompt: workerPrompt })) {
      if (event.type === 'text' && event.text) {
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
  }

  cancelAll(): void {
    for (const controller of this.activeWorkers.values()) {
      controller.abort()
    }
    this.activeWorkers.clear()
  }
}

/**
 * Parse task assignment blocks from Claude's dispatcher response.
 * Format: ```task:worker_type\nTask description\n```
 */
function parseTaskBlocks(response: string): TaskBlock[] {
  const blocks: TaskBlock[] = []
  const regex = /```task:(coder|author|review)\n([\s\S]*?)```/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(response)) !== null) {
    const worker = match[1] as WorkerType
    const task = match[2].trim()
    if (task) {
      blocks.push({ worker, task })
    }
  }

  return blocks
}
