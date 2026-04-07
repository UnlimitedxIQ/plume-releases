import { useState, useCallback } from 'react'
import { ipc } from '../lib/ipc'
import { useStyleStore } from '../stores/style-store'
import type { StyleProfile } from '../types/style'
import { profileToPromptAppendix } from '../types/style'

export function useWritingStyle() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isRewriting, setIsRewriting] = useState(false)
  const [error,       setError]       = useState<string | null>(null)

  const addProfile = useStyleStore((s) => s.addProfile)

  const analyzeAndSave = useCallback(
    async (samples: string[], name = 'My Writing Style'): Promise<StyleProfile | null> => {
      setIsAnalyzing(true)
      setError(null)
      try {
        const result = await ipc.analyzeWritingStyle(samples)

        const profile: StyleProfile = {
          id:          crypto.randomUUID(),
          name,
          createdAt:   Date.now(),
          updatedAt:   Date.now(),
          formality:   result.formality,
          vocabulary:  result.vocabulary as StyleProfile['vocabulary'],
          tone:        result.tone as StyleProfile['tone'],
          avgSentenceLength:  result.avgSentenceLength,
          punctuationFrequency: {
            commasPer100Words:     5,
            semicolonsPer100Words: 0,
            dashUsage:             'rare',
            parenthesesUsage:      'rare',
            ellipsisUsage:         'none',
          },
          positiveRules: result.positiveRules.map((desc) => ({
            id:          crypto.randomUUID(),
            description: desc,
            enabled:     true,
            weight:      80,
            source:      'detected' as const,
          })),
          negativeRules: result.negativeRules.map((desc) => ({
            id:          crypto.randomUUID(),
            description: desc,
            enabled:     true,
            weight:      80,
            source:      'detected' as const,
          })),
          quirks:      result.quirks,
          sampleCount: samples.length,
          source:      'analyzed',
        }

        addProfile(profile)
        return profile
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Analysis failed')
        return null
      } finally {
        setIsAnalyzing(false)
      }
    },
    [addProfile]
  )

  const rewriteInStyle = useCallback(
    async (text: string, profile: StyleProfile): Promise<string> => {
      setIsRewriting(true)
      setError(null)
      try {
        const prompt = profileToPromptAppendix(profile)
        // We use the chat stream via IPC to rewrite in style.
        // For simplicity, we call the main process directly via a one-shot approach.
        // In a real implementation, this would stream; here we simulate with analyzeWritingStyle
        // being repurposed, or we can call a dedicated endpoint.
        // We'll use a single-shot chat message approach via the stream API.
        const result = await new Promise<string>((resolve, reject) => {
          let accumulated = ''
          const tabId = `style-preview-${Date.now()}`

          const unsubChunk = ipc.onChatChunk(tabId, (chunk) => {
            if (chunk.type === 'text' && chunk.text) {
              accumulated += chunk.text
            }
          })

          const unsubDone = ipc.onChatDone(tabId, () => {
            unsubChunk()
            unsubDone()
            unsubError()
            resolve(accumulated)
          })

          const unsubError = ipc.onChatError(tabId, ({ error: e }) => {
            unsubChunk()
            unsubDone()
            unsubError()
            reject(new Error(e))
          })

          ipc.sendChatStream({
            messages: [
              {
                id:        crypto.randomUUID(),
                role:      'user',
                content:   { type: 'text', text: `Rewrite the following text in my personal writing style. Only return the rewritten text, nothing else.\n\nText to rewrite:\n${text}` },
                timestamp: Date.now(),
              }
            ],
            systemPrompt: `You are a writing style assistant. ${prompt}`,
            tabId,
          })
        })

        return result
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Rewrite failed'
        setError(msg)
        throw new Error(msg)
      } finally {
        setIsRewriting(false)
      }
    },
    []
  )

  return {
    analyzeAndSave,
    rewriteInStyle,
    isAnalyzing,
    isRewriting,
    error,
  }
}
