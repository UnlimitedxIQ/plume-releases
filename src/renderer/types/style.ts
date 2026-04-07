// ── Writing Style Types ───────────────────────────────────────────────────

export interface StyleProfile {
  id:          string
  name:        string
  createdAt:   number
  updatedAt:   number
  /** 0–100: 0 = very informal, 100 = very formal */
  formality:   number
  /** vocabulary richness level */
  vocabulary:  VocabularyLevel
  /** overall tone */
  tone:        ToneSetting
  /** average words per sentence */
  avgSentenceLength: number
  /** common punctuation patterns */
  punctuationFrequency: PunctuationFrequency
  /** positive style rules to apply */
  positiveRules: StyleRule[]
  /** negative rules (things to avoid) */
  negativeRules: StyleRule[]
  /** quirks and idiosyncrasies */
  quirks: string[]
  /** source samples used for analysis */
  sampleCount: number
  /** whether this profile is from analysis or manually created */
  source: 'analyzed' | 'manual'
}

export type VocabularyLevel = 'simple' | 'moderate' | 'advanced' | 'technical'

export type ToneSetting =
  | 'formal'
  | 'conversational'
  | 'academic'
  | 'casual'
  | 'persuasive'
  | 'analytical'

// ── Style Rule ────────────────────────────────────────────────────────────

export interface StyleRule {
  id:          string
  description: string
  example?:    string
  enabled:     boolean
  /** How strongly to apply this rule (0–100) */
  weight:      number
  /** Whether this was user-created or AI-detected */
  source:      'detected' | 'user'
}

// ── Analysis Input ────────────────────────────────────────────────────────

export interface StyleAnalysisInput {
  samples:  string[]
  name?:    string
}

// ── Punctuation Frequency ─────────────────────────────────────────────────

export interface PunctuationFrequency {
  commasPer100Words:    number
  semicolonsPer100Words:number
  dashUsage:            'none' | 'rare' | 'moderate' | 'frequent'
  parenthesesUsage:     'none' | 'rare' | 'moderate' | 'frequent'
  ellipsisUsage:        'none' | 'rare' | 'moderate' | 'frequent'
}

// ── Preview ───────────────────────────────────────────────────────────────

export interface StylePreviewResult {
  original:  string
  rewritten: string
  profileId: string
  model:     string
}

// ── Factories ─────────────────────────────────────────────────────────────

export function createStyleRule(
  description: string,
  source: 'detected' | 'user' = 'user'
): StyleRule {
  return {
    id:          crypto.randomUUID(),
    description,
    enabled:     true,
    weight:      80,
    source,
  }
}

export function createBlankProfile(name: string): StyleProfile {
  return {
    id:                   crypto.randomUUID(),
    name,
    createdAt:            Date.now(),
    updatedAt:            Date.now(),
    formality:            50,
    vocabulary:           'moderate',
    tone:                 'conversational',
    avgSentenceLength:    18,
    punctuationFrequency: {
      commasPer100Words:     5,
      semicolonsPer100Words: 0,
      dashUsage:             'rare',
      parenthesesUsage:      'rare',
      ellipsisUsage:         'none',
    },
    positiveRules: [],
    negativeRules: [],
    quirks:        [],
    sampleCount:   0,
    source:        'manual',
  }
}

// ── Style Profile to System Prompt Appendix ───────────────────────────────

export function profileToPromptAppendix(profile: StyleProfile): string {
  const rules = [
    ...profile.positiveRules.filter(r => r.enabled).map(r => `- DO: ${r.description}`),
    ...profile.negativeRules.filter(r => r.enabled).map(r => `- AVOID: ${r.description}`),
  ].join('\n')

  return `
## Writing Style Profile: ${profile.name}

Match the user's personal writing style when generating text:
- Formality level: ${profile.formality}/100 (${profile.formality < 40 ? 'informal' : profile.formality > 70 ? 'formal' : 'neutral'})
- Vocabulary: ${profile.vocabulary}
- Tone: ${profile.tone}
- Average sentence length: ~${profile.avgSentenceLength} words
${profile.quirks.length > 0 ? `- Style quirks: ${profile.quirks.join(', ')}` : ''}

Style rules:
${rules || 'None specified'}
`.trim()
}
