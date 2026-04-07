import type { StyleProfile } from './analyzer'
import { styleProfileToSystemPrompt } from './analyzer'

export function buildSystemPrompt(
  basePrompt: string,
  skillPrompts: string[],
  styleProfile: StyleProfile | null
): string {
  const parts = [basePrompt]

  for (const skillPrompt of skillPrompts) {
    parts.push(skillPrompt)
  }

  if (styleProfile) {
    parts.push(styleProfileToSystemPrompt(styleProfile))
    parts.push(
      '\nNote: When formal UO skill guidelines conflict with personal style, ' +
      'prioritize the formal guidelines. Apply personal style to tone, pacing, ' +
      'and word choice — not to formatting or citation standards.'
    )
  }

  return parts.join('\n\n---\n\n')
}
