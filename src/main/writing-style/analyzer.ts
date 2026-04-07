import Anthropic from '@anthropic-ai/sdk'

interface StyleProfile {
  name: string
  sentencePacing: {
    avgLength: number
    variation: string
    examples: string[]
  }
  vocabulary: {
    level: string
    score: number
    preferredWords: string[]
    avoidedWords: string[]
  }
  punctuation: {
    patterns: Record<string, number>
    preferences: string[]
  }
  formality: {
    level: number
    markers: string[]
  }
  tone: {
    primary: string
    secondary: string
    examples: string[]
  }
  grammarQuirks: string[]
  rules: StyleRule[]
}

interface StyleRule {
  id: string
  type: 'positive' | 'negative'
  description: string
  example: string
  enabled: boolean
}

const ANALYSIS_PROMPT = `Analyze the following writing samples and create a detailed writing style profile. Return your analysis as a JSON object with this exact structure:

{
  "name": "Writing Style Profile",
  "sentencePacing": {
    "avgLength": <number of words>,
    "variation": "<low|medium|high> - how much sentence length varies",
    "examples": ["<3 characteristic sentences from the samples>"]
  },
  "vocabulary": {
    "level": "<simple|moderate|advanced|academic>",
    "score": <1-10 complexity score>,
    "preferredWords": ["<words/phrases the writer uses often>"],
    "avoidedWords": ["<words/phrases the writer avoids>"]
  },
  "punctuation": {
    "patterns": {
      "em_dashes": <frequency 0-10>,
      "semicolons": <frequency 0-10>,
      "colons": <frequency 0-10>,
      "parentheses": <frequency 0-10>,
      "exclamation_marks": <frequency 0-10>,
      "ellipsis": <frequency 0-10>
    },
    "preferences": ["<notable punctuation habits>"]
  },
  "formality": {
    "level": <1-10, where 1 is very casual and 10 is very formal>,
    "markers": ["<indicators of formality level>"]
  },
  "tone": {
    "primary": "<main tone: confident, analytical, conversational, authoritative, etc.>",
    "secondary": "<secondary tone>",
    "examples": ["<sentences that exemplify the tone>"]
  },
  "grammarQuirks": ["<notable grammar patterns, like starting sentences with 'And' or using fragments>"],
  "rules": [
    {
      "id": "<unique id>",
      "type": "positive",
      "description": "<rule to follow when writing in this style>",
      "example": "<example from the samples>",
      "enabled": true
    },
    {
      "id": "<unique id>",
      "type": "negative",
      "description": "<thing to avoid when writing in this style>",
      "example": "<counter-example>",
      "enabled": true
    }
  ]
}

Generate at least 8 rules (mix of positive and negative). Be specific and actionable.
Return ONLY the JSON object, no other text.`

export async function analyzeWritingSamples(apiKey: string, samples: string[]): Promise<StyleProfile> {
  const client = new Anthropic({ apiKey })

  const combinedSamples = samples.map((s, i) => `--- Sample ${i + 1} ---\n${s}`).join('\n\n')

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `${ANALYSIS_PROMPT}\n\n${combinedSamples}`
      }
    ]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse style profile from AI response')
  }

  return JSON.parse(jsonMatch[0]) as StyleProfile
}

export function styleProfileToSystemPrompt(profile: StyleProfile): string {
  const enabledRules = profile.rules.filter(r => r.enabled)
  const positiveRules = enabledRules.filter(r => r.type === 'positive')
  const negativeRules = enabledRules.filter(r => r.type === 'negative')

  return `## Personal Writing Style: ${profile.name}

When writing on behalf of this user, match their personal style:

**Tone:** ${profile.tone.primary} with ${profile.tone.secondary} undertones
**Formality:** ${profile.formality.level}/10
**Vocabulary:** ${profile.vocabulary.level} (complexity ${profile.vocabulary.score}/10)
**Sentence pacing:** Average ${profile.sentencePacing.avgLength} words, ${profile.sentencePacing.variation} variation

**DO (positive style rules):**
${positiveRules.map(r => `- ${r.description}`).join('\n')}

**DON'T (negative style rules):**
${negativeRules.map(r => `- ${r.description}`).join('\n')}

**Preferred words/phrases:** ${profile.vocabulary.preferredWords.join(', ')}
**Avoid these words:** ${profile.vocabulary.avoidedWords.join(', ')}

**Punctuation habits:**
${profile.punctuation.preferences.map(p => `- ${p}`).join('\n')}

**Grammar quirks to replicate:**
${profile.grammarQuirks.map(q => `- ${q}`).join('\n')}`
}

export type { StyleProfile, StyleRule }
