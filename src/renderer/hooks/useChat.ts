import { useCallback, useEffect, useRef, useMemo } from 'react'
import { ipc } from '../lib/ipc'
import type { PickedFile } from '../lib/ipc'
import { useChatStore } from '../stores/chat-store'
import { useProjectStore } from '../stores/project-store'
import { useStyleStore } from '../stores/style-store'
import { BASE_SYSTEM_PROMPT } from '../lib/constants'
import { useMarketplaceStore } from '../stores/marketplace-store'
import {
  createUserMessage,
  createAssistantMessage,
  getMessageText,
  type Message,
} from '../types/chat'
import type { ToolCall } from '../types/chat'
import { profileToPromptAppendix } from '../types/style'

export function useChat(tabId: string) {
  const {
    addMessage,
    updateMessage,
    setLoading,
    appendStreamingText,
    clearStreamingText,
    setStreamingMessageId,
    getMessages,
    isLoading,
    getStreamingText,
  } = useChatStore()

  const getTab              = useProjectStore((s) => s.getTab)
  const activeProfile       = useStyleStore((s) => s.activeProfile)
  const packs = useMarketplaceStore((s) => s.packs)
  const installedSkillNames = useMemo(
    () => packs.filter(p => p.installed).flatMap(p => p.skills),
    [packs]
  )

  // Cleanup IPC listeners on unmount
  const unsubsRef = useRef<Array<() => void>>([])
  useEffect(() => {
    return () => {
      unsubsRef.current.forEach((fn) => fn())
      unsubsRef.current = []
    }
  }, [tabId])

  function buildSystemPrompt(): string {
    const tab     = getTab(tabId)
    const profile = activeProfile()

    let prompt = BASE_SYSTEM_PROMPT

    if (tab?.systemPromptOverride) {
      prompt = tab.systemPromptOverride
    }

    // Append installed skill names so Claude knows what's available
    if (installedSkillNames.length > 0) {
      prompt += `\n\n## Active Skills\nThe following skills are installed and available to assist you:\n${installedSkillNames.map(s => `- ${s}`).join('\n')}\nUse your knowledge of these skill areas when relevant to the user's request.`
    }

    if (profile) {
      prompt += '\n\n' + profileToPromptAppendix(profile)
    }

    return prompt
  }

  function buildApiMessages(userText: string, attachments: PickedFile[]): Message[] {
    const messages = getMessages(tabId)

    // Add file contents as additional context
    const attachmentContext = attachments.length > 0
      ? '\n\n' + attachments
          .filter((f) => f.content)
          .map((f) => `[File: ${f.name}]\n${f.content}`)
          .join('\n\n---\n\n')
      : ''

    const fullText = userText + attachmentContext

    return [
      ...messages.filter((m) => !m.streaming),
      createUserMessage(fullText),
    ]
  }

  const sendMessage = useCallback(
    async (text: string, attachments: PickedFile[] = []) => {
      if (isLoading(tabId)) return

      // Add user message to store
      const mappedAttachments = attachments.map((f) => ({
        name:     f.name,
        path:     f.path,
        size:     f.size,
        mimeType: 'text/plain',
        content:  f.content,
      }))
      const userMsg = createUserMessage(text, mappedAttachments)
      addMessage(tabId, userMsg)

      // Create streaming assistant message placeholder
      const assistantMsg = createAssistantMessage()
      addMessage(tabId, assistantMsg)
      setStreamingMessageId(tabId, assistantMsg.id)
      setLoading(tabId, true)
      clearStreamingText(tabId)

      const messages     = buildApiMessages(text, attachments)
      const systemPrompt = buildSystemPrompt()

      let accumulatedText = ''
      const toolCallMap   = new Map<string, Partial<ToolCall>>()

      // Register IPC event handlers
      const unsubChunk = ipc.onChatChunk(tabId, (chunk) => {
        if (chunk.type === 'text' && chunk.text) {
          accumulatedText += chunk.text
          appendStreamingText(tabId, chunk.text)
          updateMessage(tabId, assistantMsg.id, {
            content: { type: 'text', text: accumulatedText },
          })
        }

        if (chunk.type === 'tool_use' && chunk.toolUse) {
          const { id, name, input } = chunk.toolUse
          toolCallMap.set(id, {
            id,
            name,
            input,
            status:    'running',
            startedAt: Date.now(),
          })
          // Update message with tool calls
          updateMessage(tabId, assistantMsg.id, {
            toolCalls: Array.from(toolCallMap.values()) as ToolCall[],
          })
        }

        if (chunk.type === 'tool_result' && chunk.toolResult) {
          const { toolUseId, content, isError } = chunk.toolResult
          const existing = toolCallMap.get(toolUseId)
          if (existing) {
            toolCallMap.set(toolUseId, {
              ...existing,
              output:  content,
              isError,
              status:  isError ? 'error' : 'success',
              endedAt: Date.now(),
            })
            updateMessage(tabId, assistantMsg.id, {
              toolCalls: Array.from(toolCallMap.values()) as ToolCall[],
            })
          }
        }
      })

      const unsubDone = ipc.onChatDone(tabId, () => {
        updateMessage(tabId, assistantMsg.id, { streaming: false })
        setLoading(tabId, false)
        clearStreamingText(tabId)
        setStreamingMessageId(tabId, null)
        cleanup()
      })

      const unsubError = ipc.onChatError(tabId, ({ error }) => {
        updateMessage(tabId, assistantMsg.id, {
          streaming: false,
          error:     `Error: ${error}`,
          content:   { type: 'text', text: accumulatedText },
        })
        setLoading(tabId, false)
        clearStreamingText(tabId)
        setStreamingMessageId(tabId, null)
        cleanup()
      })

      function cleanup() {
        unsubChunk()
        unsubDone()
        unsubError()
      }

      unsubsRef.current.push(cleanup)

      // Build the message — just the new user text + attachments.
      // The provider uses --continue to maintain session history,
      // so we don't need to resend the full conversation.
      const attachmentContext = attachments.length > 0
        ? '\n\n' + attachments
            .filter(f => f.content)
            .map(f => `[File: ${f.name}]\n${f.content}`)
            .join('\n\n---\n\n')
        : ''

      // Send via provider CLI (Claude Code / Codex)
      ipc.providerChat({
        message: text + attachmentContext,
        systemPrompt,
        tabId,
      })
    },
    [tabId, isLoading, addMessage, setLoading, appendStreamingText, clearStreamingText, setStreamingMessageId, updateMessage, getMessages, getTab, activeProfile]
  )

  function cancelMessage() {
    ipc.providerChatCancel()
    setLoading(tabId, false)
    clearStreamingText(tabId)
    setStreamingMessageId(tabId, null)
  }

  return {
    messages:       getMessages(tabId),
    isLoading:      isLoading(tabId),
    streamingText:  getStreamingText(tabId),
    sendMessage,
    cancelMessage,
  }
}
