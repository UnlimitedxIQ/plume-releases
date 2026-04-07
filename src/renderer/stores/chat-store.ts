import { create } from 'zustand'
import type { Message } from '../types/chat'

interface ChatState {
  // ── Messages per tab ──────────────────────────────────────────────────
  messages: Record<string, Message[]>

  // ── Loading state per tab ─────────────────────────────────────────────
  loading: Record<string, boolean>

  // ── Streaming text per tab ────────────────────────────────────────────
  streamingText: Record<string, string>

  // ── Streaming message ID per tab ──────────────────────────────────────
  streamingMessageId: Record<string, string | null>

  // ── Message Actions ───────────────────────────────────────────────────
  addMessage:     (tabId: string, message: Message) => void
  updateMessage:  (tabId: string, messageId: string, patch: Partial<Message>) => void
  removeMessage:  (tabId: string, messageId: string) => void
  clearMessages:  (tabId: string) => void

  // ── Streaming Actions ─────────────────────────────────────────────────
  updateStreamingText: (tabId: string, text: string) => void
  appendStreamingText: (tabId: string, chunk: string) => void
  clearStreamingText:  (tabId: string) => void
  setStreamingMessageId: (tabId: string, id: string | null) => void

  // ── Loading Actions ───────────────────────────────────────────────────
  setLoading: (tabId: string, loading: boolean) => void

  // ── Selectors ─────────────────────────────────────────────────────────
  getMessages:      (tabId: string) => Message[]
  isLoading:        (tabId: string) => boolean
  getStreamingText: (tabId: string) => string
}

export const useChatStore = create<ChatState>()((set, get) => ({
  messages:           {},
  loading:            {},
  streamingText:      {},
  streamingMessageId: {},

  // ── Message Actions ──────────────────────────────────────────────────
  addMessage: (tabId, message) => {
    set((s) => ({
      messages: {
        ...s.messages,
        [tabId]: [...(s.messages[tabId] ?? []), message],
      },
    }))
  },

  updateMessage: (tabId, messageId, patch) => {
    set((s) => {
      const msgs = s.messages[tabId]
      if (!msgs) return s
      return {
        messages: {
          ...s.messages,
          [tabId]: msgs.map((m) =>
            m.id === messageId ? { ...m, ...patch } : m
          ),
        },
      }
    })
  },

  removeMessage: (tabId, messageId) => {
    set((s) => {
      const msgs = s.messages[tabId]
      if (!msgs) return s
      return {
        messages: {
          ...s.messages,
          [tabId]: msgs.filter((m) => m.id !== messageId),
        },
      }
    })
  },

  clearMessages: (tabId) => {
    set((s) => ({
      messages:      { ...s.messages,      [tabId]: [] },
      streamingText: { ...s.streamingText, [tabId]: '' },
      loading:       { ...s.loading,       [tabId]: false },
    }))
  },

  // ── Streaming Actions ────────────────────────────────────────────────
  updateStreamingText: (tabId, text) => {
    set((s) => ({ streamingText: { ...s.streamingText, [tabId]: text } }))
  },

  appendStreamingText: (tabId, chunk) => {
    set((s) => ({
      streamingText: {
        ...s.streamingText,
        [tabId]: (s.streamingText[tabId] ?? '') + chunk,
      },
    }))
  },

  clearStreamingText: (tabId) => {
    set((s) => ({ streamingText: { ...s.streamingText, [tabId]: '' } }))
  },

  setStreamingMessageId: (tabId, id) => {
    set((s) => ({ streamingMessageId: { ...s.streamingMessageId, [tabId]: id } }))
  },

  // ── Loading Actions ──────────────────────────────────────────────────
  setLoading: (tabId, loading) => {
    set((s) => ({ loading: { ...s.loading, [tabId]: loading } }))
  },

  // ── Selectors ────────────────────────────────────────────────────────
  getMessages:      (tabId) => get().messages[tabId] ?? [],
  isLoading:        (tabId) => get().loading[tabId] ?? false,
  getStreamingText: (tabId) => get().streamingText[tabId] ?? '',
}))
