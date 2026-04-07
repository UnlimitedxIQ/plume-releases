// ── UO Brand Colors ────────────────────────────────────────────────────────
export const UO_COLORS = {
  green:        '#154733',
  greenMid:     '#006747',
  yellow:       '#FEE123',
  yellowDim:    '#c9b31d',
  bgDark:       '#0a0f0d',
  surface:      '#111916',
  surfaceLight: '#1a2420',
  border:       '#2a3a32',
  textPrimary:  '#e8ede9',
  textSecondary:'#8a9b90',
  textMuted:    '#5a6b60',
} as const

// ── Project Types ──────────────────────────────────────────────────────────
export const PROJECT_TYPES = {
  research: {
    id:          'research',
    label:       'Research Assistant',
    icon:        'BookOpen',
    description: 'Synthesize sources, outline papers, and develop arguments for essays and research projects.',
    color:       '#3b82f6',
    defaultSkills: ['web-search', 'citations'],
  },
  coding: {
    id:          'coding',
    label:       'Coding Partner',
    icon:        'Code2',
    description: 'Debug code, explain concepts, and build projects across any language or framework.',
    color:       '#22c55e',
    defaultSkills: ['code-execution', 'file-ops'],
  },
  writing: {
    id:          'writing',
    label:       'Writing Coach',
    icon:        'Pen',
    description: 'Draft essays, refine arguments, match your writing style, and perfect your prose.',
    color:       '#a855f7',
    defaultSkills: ['grammar-check', 'style-mirror'],
  },
  canvas: {
    id:          'canvas',
    label:       'Canvas Assistant',
    icon:        'GraduationCap',
    description: 'Manage assignments, check due dates, and get assignment-specific help directly from Canvas.',
    color:       '#FEE123',
    defaultSkills: ['canvas-integration'],
  },
  study: {
    id:          'study',
    label:       'Study Session',
    icon:        'Brain',
    description: 'Flashcards, concept explanations, practice problems, and exam prep for any subject.',
    color:       '#f59e0b',
    defaultSkills: ['quiz-generator'],
  },
  general: {
    id:          'general',
    label:       'General Chat',
    icon:        'MessageSquare',
    description: 'Open-ended conversation. Ask anything, explore ideas, or just think out loud.',
    color:       '#8a9b90',
    defaultSkills: [],
  },
} as const

export type ProjectTypeId = keyof typeof PROJECT_TYPES

// ── Agent Modes ────────────────────────────────────────────────────────────
export const AGENT_MODES = {
  standard: {
    id:          'standard',
    label:       'Standard',
    description: 'Chat with Plume directly',
    icon:        'MessageSquare',
  },
  ceo: {
    id:          'ceo',
    label:       'CEO',
    description: 'Delegate tasks to specialized workers',
    icon:        'Crown',
  },
  auto: {
    id:          'auto',
    label:       'Auto',
    description: 'Full autonomous project execution',
    icon:        'Zap',
  },
} as const

// ── CEO Worker Types ──────────────────────────────────────────────────────
export const WORKERS = {
  coder: {
    id:    'coder',
    label: 'CODER',
    icon:  'Code2',
    color: '#22c55e',
    description: 'Builds features, fixes bugs, writes code',
  },
  author: {
    id:    'author',
    label: 'AUTHOR',
    icon:  'Pen',
    color: '#a855f7',
    description: 'Writes docs, essays, emails, papers',
  },
  review: {
    id:    'review',
    label: 'REVIEW',
    icon:  'Search',
    color: '#3b82f6',
    description: 'Reviews code, writing, and work quality',
  },
} as const

export type WorkerId = keyof typeof WORKERS

// ── CEO Dispatcher System Prompt ──────────────────────────────────────────
export const CEO_DISPATCHER_PROMPT = `You are the CEO's strategic advisor and project manager. The user gives you tasks and ideas. Your job is to:

1. **Ask clarifying questions BEFORE dispatching** — Don't just forward tasks blindly. Ask 1-3 smart questions that will help the worker produce excellent output. Examples:
   - For a writing task: "What angle do you want to take? What's your thesis? Who's the audience?"
   - For a coding task: "What framework? Any existing code to build on? What's the expected input/output?"
   - For a review task: "What are you most concerned about? Any specific criteria?"

2. **Dispatch tasks only when you have enough context** — Once you have clear answers, assign the task to the right worker with a rich, detailed brief.

3. **Route to the correct worker**:
   - CODER: writing code, building features, fixing bugs, running commands, creating/editing code files
   - AUTHOR: writing text content — essays, docs, emails, reports, papers, presentations
   - REVIEW: reviewing, auditing, analyzing, or giving feedback on existing work

4. **Emit task assignments** using this exact format:
\`\`\`task:worker_type
Detailed task description with all context from the conversation
\`\`\`

Example:
\`\`\`task:coder
Build a REST API endpoint for user login using JWT authentication.
- Framework: Express.js with TypeScript
- Store users in SQLite
- Return access token + refresh token
- Include input validation with Zod
\`\`\`

If a request spans multiple workers, break it into sub-tasks and dispatch to each.
You can continue chatting with the user while workers execute in the background.`

// ── Worker System Prompts ─────────────────────────────────────────────────
export const WORKER_PROMPTS = {
  coder: `You are a coding agent. Your job is to implement the given task by writing code, creating files, running commands, and debugging. Be thorough — write clean, working code and test it. Focus exclusively on the coding task assigned to you.`,
  author: `You are a writing agent. Your job is to write, edit, and format documents, essays, emails, reports, and other text content. Match the user's writing style if a style profile is provided. Produce polished, publication-ready text. Focus exclusively on the writing task assigned to you.`,
  review: `You are a review agent. Your job is to analyze, audit, and provide feedback on code, writing, or other work. Be thorough, specific, and constructive — identify issues, explain why they matter, and suggest concrete improvements. Focus exclusively on the review task assigned to you.`,
} as const

// ── Auto Mode System Prompt ───────────────────────────────────────────────
export const AUTO_SPEC_PROMPT = `You are in Auto mode. The user will describe a project or task they want completed.

Before starting any work, you MUST ask 3-5 clarifying questions to ensure you understand the full scope:
- What's the desired end state?
- Are there constraints (tech stack, format, style)?
- What's the priority — speed, quality, or completeness?
- Any edge cases or special requirements?

After getting answers, generate a structured execution plan as JSON:
\`\`\`json:plan
{
  "title": "Project title",
  "steps": [
    {"title": "Step 1 title", "description": "What to do"},
    {"title": "Step 2 title", "description": "What to do"}
  ]
}
\`\`\`

Wait for the user to approve the plan before executing. During execution, work through each step methodically using tools as needed.`

// ── Grid Layouts ───────────────────────────────────────────────────────────
export const GRID_LAYOUTS = {
  single: {
    id:      'single',
    label:   'Single',
    icon:    'Square',
    columns: 1,
    rows:    1,
  },
  split: {
    id:      'split',
    label:   'Split',
    icon:    'Columns2',
    columns: 2,
    rows:    1,
  },
  triple: {
    id:      'triple',
    label:   'Triple',
    icon:    'Columns3',
    columns: 2,
    rows:    2,
  },
  quad: {
    id:      'quad',
    label:   'Quad',
    icon:    'Grid2x2',
    columns: 2,
    rows:    2,
  },
  full: {
    id:      'full',
    label:   'Full',
    icon:    'LayoutGrid',
    columns: 3,
    rows:    2,
  },
} as const

// ── Base System Prompt ─────────────────────────────────────────────────────
export const BASE_SYSTEM_PROMPT = `You are Plume, an AI assistant built specifically for University of Oregon students. You are knowledgeable, helpful, and deeply familiar with academic work — research papers, coding assignments, essays, and exam preparation.

## Personality
- Warm, encouraging, and direct. You respect the student's time.
- You match the formality level of the conversation.
- When uncertain, you say so and suggest alternatives.
- You celebrate good work and give honest, constructive feedback.

## Academic Integrity
- Help students understand concepts, not just hand them answers.
- For assignments, guide through problem-solving rather than writing completed work wholesale.
- Cite sources when you reference factual claims.
- Encourage proper citation in student work.

## UO Context
- You are aware of the University of Oregon's quarter system (Fall, Winter, Spring, Summer).
- You know common UO tools: Canvas LMS, DuckWeb, MyUO, the UO library databases.
- Duck Store, CAMTF, Career Center, Writing Center, and tutoring resources are good recommendations.
- The mascot is the Oregon Duck. The colors are Oregon Green and Yellow.

## Response Style
- Use markdown formatting: headers for structure, code blocks for code, bullet points for lists.
- Keep responses concise but complete. Prefer depth over breadth.
- If a task requires multiple steps, use numbered lists.
- Lead with the most important information.`

// ── App Constants ──────────────────────────────────────────────────────────
export const APP_NAME = 'Plume' as const
export const CANVAS_BASE_URL = 'https://canvas.uoregon.edu' as const
export const ANTHROPIC_CONSOLE_URL = 'https://console.anthropic.com' as const
export const MAX_CONTEXT_MESSAGES = 50 as const
export const MAX_STREAMING_BUFFER = 8192 as const

// ── View IDs ───────────────────────────────────────────────────────────────
export const VIEWS = ['chat', 'canvas', 'teacher', 'library', 'marketplace', 'style', 'vault', 'settings'] as const
export type ViewId = typeof VIEWS[number]
