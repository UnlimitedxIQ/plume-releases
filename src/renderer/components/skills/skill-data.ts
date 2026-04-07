import {
  Store, Search, Zap, Plug, Plus, Check, ChevronDown, ChevronUp,
  FileText, Palette, BookOpen, TrendingUp, Code2, BarChart3,
  Mail, DollarSign, HardDrive, GitBranch, Monitor, Share2,
  Image, Play, Calendar, FolderOpen, GraduationCap, MessageCircle,
  Package, Shield,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

export interface SkillPack {
  id: string
  name: string
  description: string
  icon: string
  color: string
  skills: string[]
  installed: boolean
  preInstalled: boolean
}

export interface McpCredential {
  vaultKey: string        // key name in the vault
  label: string           // human-readable: "GitHub Personal Access Token"
  placeholder: string     // input hint: "ghp_xxxxxxxxxxxx"
  category: string        // vault category: 'api_key' | 'token'
}

export interface McpServer {
  id: string
  name: string
  description: string
  icon: string
  category: 'data' | 'productivity' | 'development' | 'ai'
  installed: boolean
  preInstalled?: boolean
  requiresAccess?: string
  requiredCredentials?: McpCredential[]  // what API keys/tokens this MCP needs
}

// ── Icon map ───────────────────────────────────────────────────────────────

export const ICON_MAP: Record<string, React.ElementType> = {
  GraduationCap, BookOpen, Code2, TrendingUp, Zap, Palette,
  BarChart3, MessageCircle, HardDrive, FileText, Mail,
  DollarSign, GitBranch, Monitor, Share2, Image, Play,
  Calendar, FolderOpen, Package, Shield, Search, Store, Plug, Plus,
  Check, ChevronDown, ChevronUp,
}

export function getIcon(name: string): React.ElementType {
  return ICON_MAP[name] ?? Zap
}

// ── UO Brand Colors ────────────────────────────────────────────────────────

export const C = {
  bg: '#0a0f0d',
  surface: '#111916',
  surfaceLight: '#1a2420',
  border: '#1e2d26',
  borderLight: '#2a3a32',
  green: '#006747',
  greenDark: '#154733',
  yellow: '#FEE123',
  text: '#e8ede9',
  textSec: '#8a9b90',
  textMuted: '#5a6b60',
} as const

// ── Category labels ────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<string, string> = {
  data: 'Data',
  productivity: 'Productivity',
  development: 'Dev',
  ai: 'AI',
}

export const CATEGORY_COLORS: Record<string, string> = {
  data: '#3b82f6',
  productivity: '#f59e0b',
  development: '#22c55e',
  ai: '#a855f7',
}

// ── GitHub Marketplace Fetch ───────────────────────────────────────────────

const CATALOG_URL = 'https://raw.githubusercontent.com/UnlimitedxIQ/uo-claude-marketplace/main/catalog.json'

interface CatalogData {
  packs: SkillPack[]
  mcps: McpServer[]
}

export async function fetchMarketplaceCatalog(): Promise<CatalogData | null> {
  try {
    const response = await fetch(CATALOG_URL, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) return null
    const catalog = await response.json()

    // Map catalog packs to our SkillPack format
    const packs: SkillPack[] = (catalog.packs ?? []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      name: p.name as string,
      description: p.description as string,
      icon: p.icon as string,
      color: p.color as string ?? '#5a6b60',
      skills: (p.skillIds as string[]) ?? [],
      installed: (p.preInstalled as boolean) ?? false,
      preInstalled: (p.preInstalled as boolean) ?? false,
    }))

    // Map catalog MCPs to our McpServer format
    const mcps: McpServer[] = (catalog.mcps ?? []).map((m: Record<string, unknown>) => ({
      id: m.id as string,
      name: m.name as string,
      description: m.description as string,
      icon: m.icon as string,
      category: (m.category as McpServer['category']) ?? 'data',
      installed: (m.preInstalled as boolean) ?? false,
      preInstalled: (m.preInstalled as boolean) ?? false,
      requiresAccess: m.requiresAccess as string | undefined,
      requiredCredentials: m.requiredCredentials as McpCredential[] | undefined,
    }))

    return { packs, mcps }
  } catch {
    return null // Fall back to local data
  }
}

// ── Initial data (local fallback) ─────────────────────────────────────────

export const INITIAL_PACKS: SkillPack[] = [
  // Pre-installed
  {
    id: 'student-essentials',
    name: 'Student Essentials',
    description: 'Canvas integration, study tools, and AI writing assistance',
    icon: 'GraduationCap',
    color: '#FEE123',
    skills: ['Canvas Integration', 'Humanize Writing', 'Study Flashcards'],
    installed: true,
    preInstalled: true,
  },
  {
    id: 'academic-writing',
    name: 'Academic Writing',
    description: 'UO writing standards, citations, research papers, and presentations',
    icon: 'BookOpen',
    color: '#3b82f6',
    skills: ['UO Business Writing', 'UO Resume Guide', 'UO Research Paper', 'Article Writing', 'UO Presentation'],
    installed: true,
    preInstalled: true,
  },
  {
    id: 'code-toolkit',
    name: 'Code Toolkit',
    description: 'Coding standards, patterns, and test-driven development',
    icon: 'Code2',
    color: '#22c55e',
    skills: ['Coding Standards', 'Python Patterns', 'Frontend Patterns', 'Backend Patterns', 'TDD Workflow'],
    installed: true,
    preInstalled: true,
  },
  // Marketplace
  {
    id: 'business-finance',
    name: 'Business & Finance',
    description: 'Financial analysis, market research, competitive intelligence',
    icon: 'TrendingUp',
    color: '#f59e0b',
    skills: ['Financial Analysis', 'Financial Analyst', 'Market Research', 'Competitive Teardown', 'Pricing Strategy'],
    installed: false,
    preInstalled: false,
  },
  {
    id: 'entrepreneurship',
    name: 'Entrepreneurship',
    description: 'MVP building, customer acquisition, launch strategy',
    icon: 'Zap',
    color: '#ec4899',
    skills: ['MVP Builder', 'First Customers', 'Launch Strategy', 'Investor Materials', 'Investor Outreach'],
    installed: false,
    preInstalled: false,
  },
  {
    id: 'design-creative',
    name: 'Design & Creative',
    description: 'UI/UX, 3D web, premium design, Canva integration',
    icon: 'Palette',
    color: '#a855f7',
    skills: ['UO UI/UX Skills', 'Frontend Design', '3D Immersive', 'Overkill Web Design', 'Canva Presentation'],
    installed: false,
    preInstalled: false,
  },
  {
    id: 'devops-infra',
    name: 'DevOps & Infrastructure',
    description: 'Docker, CI/CD, databases, API design, security',
    icon: 'HardDrive',
    color: '#14b8a6',
    skills: ['Docker Patterns', 'Deployment Patterns', 'Database Migrations', 'PostgreSQL Patterns', 'API Design', 'Security Review'],
    installed: false,
    preInstalled: false,
  },
  {
    id: 'data-analytics',
    name: 'Data & Analytics',
    description: 'Data visualization, testing, and interactive tutorials',
    icon: 'BarChart3',
    color: '#6366f1',
    skills: ['Data Visualization', 'Python Testing', 'E2E Testing', 'Codebase to Course'],
    installed: false,
    preInstalled: false,
  },
  {
    id: 'content-marketing',
    name: 'Content & Marketing',
    description: 'Copywriting, social media, email outreach, landing pages',
    icon: 'MessageCircle',
    color: '#f97316',
    skills: ['Copywriting', 'Content Engine', 'Cold Email', 'Marketing Psychology', 'Landing Page Generator'],
    installed: false,
    preInstalled: false,
  },
]

export const INITIAL_MCPS: McpServer[] = [
  // Pre-installed (no credentials needed — use OS-level auth or built-in)
  { id: 'canvas-lms', name: 'Canvas LMS', description: 'Assignments, rubrics, due dates', icon: 'GraduationCap', category: 'data', installed: true, preInstalled: true, requiredCredentials: [
    { vaultKey: 'canvas-token', label: 'Canvas Access Token', placeholder: 'Paste token from canvas.uoregon.edu/profile/settings', category: 'token' },
  ]},
  { id: 'google-calendar', name: 'Google Calendar', description: 'Schedule and events', icon: 'Calendar', category: 'productivity', installed: true, preInstalled: true },
  { id: 'web-search', name: 'Web Search', description: 'Search current information', icon: 'Search', category: 'data', installed: true, preInstalled: true },
  { id: 'filesystem', name: 'Local Files', description: 'Read and write local files', icon: 'FolderOpen', category: 'development', installed: true, preInstalled: true },
  { id: 'git', name: 'Git', description: 'Repository management', icon: 'GitBranch', category: 'development', installed: true, preInstalled: true },
  // Marketplace — data sources
  { id: 'bloomberg', name: 'Bloomberg Terminal', description: 'Financial data and market analytics', icon: 'TrendingUp', category: 'data', installed: false, requiresAccess: 'Requires UO Finance Lab access', requiredCredentials: [
    { vaultKey: 'bloomberg-key', label: 'Bloomberg API Key', placeholder: 'Enter your Bloomberg API key', category: 'api_key' },
  ]},
  { id: 'capital-iq', name: 'Capital IQ', description: 'Business research and company data', icon: 'BarChart3', category: 'data', installed: false, requiresAccess: 'Requires UO Finance Lab access', requiredCredentials: [
    { vaultKey: 'capiq-key', label: 'Capital IQ API Key', placeholder: 'Enter your CapIQ API key', category: 'api_key' },
  ]},
  { id: 'pitchbook', name: 'PitchBook', description: 'VC and PE deal data', icon: 'DollarSign', category: 'data', installed: false, requiresAccess: 'Requires UO Finance Lab access', requiredCredentials: [
    { vaultKey: 'pitchbook-key', label: 'PitchBook API Key', placeholder: 'Enter your PitchBook API key', category: 'api_key' },
  ]},
  { id: 'uo-library', name: 'UO Library', description: 'Academic databases and journals', icon: 'BookOpen', category: 'data', installed: false },
  // Marketplace — productivity
  { id: 'notion', name: 'Notion', description: 'Pages and databases', icon: 'FileText', category: 'productivity', installed: false, requiredCredentials: [
    { vaultKey: 'notion-token', label: 'Notion Integration Token', placeholder: 'secret_xxxxxxxxxx', category: 'token' },
  ]},
  { id: 'gmail', name: 'Gmail', description: 'Email management', icon: 'Mail', category: 'productivity', installed: false, requiredCredentials: [
    { vaultKey: 'gmail-oauth', label: 'Gmail OAuth Token', placeholder: 'Connect via Google OAuth', category: 'token' },
  ]},
  { id: 'google-drive', name: 'Google Drive', description: 'Docs, Sheets, Slides', icon: 'HardDrive', category: 'productivity', installed: false, requiredCredentials: [
    { vaultKey: 'gdrive-oauth', label: 'Google Drive OAuth Token', placeholder: 'Connect via Google OAuth', category: 'token' },
  ]},
  { id: 'youtube-transcript', name: 'YouTube Transcript', description: 'Video transcripts with timestamps', icon: 'Play', category: 'data', installed: false },
  // Marketplace — development
  { id: 'github', name: 'GitHub', description: 'Repos, PRs, code search', icon: 'GitBranch', category: 'development', installed: false, requiredCredentials: [
    { vaultKey: 'github-pat', label: 'GitHub Personal Access Token', placeholder: 'ghp_xxxxxxxxxxxx', category: 'token' },
  ]},
  { id: 'playwright', name: 'Playwright', description: 'Browser automation', icon: 'Monitor', category: 'development', installed: false },
  { id: 'mermaid', name: 'Mermaid Diagrams', description: 'Flowcharts and diagrams', icon: 'Share2', category: 'development', installed: false },
  // Marketplace — AI
  { id: 'image-gen', name: 'Image Generator', description: 'AI image generation', icon: 'Image', category: 'ai', installed: false, requiredCredentials: [
    { vaultKey: 'openai-key', label: 'OpenAI API Key', placeholder: 'sk-xxxxxxxxxx', category: 'api_key' },
  ]},
  { id: 'canva', name: 'Canva', description: 'Design platform', icon: 'Palette', category: 'ai', installed: false, requiredCredentials: [
    { vaultKey: 'canva-token', label: 'Canva API Token', placeholder: 'Enter your Canva API token', category: 'token' },
  ]},
]
