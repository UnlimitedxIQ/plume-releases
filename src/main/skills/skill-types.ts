export interface ToolDefinition {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

export type SkillCategory = 'writing' | 'research' | 'code' | 'finance' | 'design' | 'general'

export interface Skill {
  id: string
  name: string
  description: string
  icon: string
  category: SkillCategory
  projectTypes: ProjectType[]
  systemPrompt: string
  tools: ToolDefinition[]
}

export type ProjectType =
  | 'research_paper'
  | 'website_app'
  | 'product_design'
  | 'business_writing'
  | 'financial_analysis'
  | 'general'

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  research_paper: 'Research Paper',
  website_app: 'Website / App',
  product_design: 'Product Design',
  business_writing: 'Business Writing',
  financial_analysis: 'Financial Analysis',
  general: 'General'
}

export const PROJECT_TYPE_ICONS: Record<ProjectType, string> = {
  research_paper: 'BookOpen',
  website_app: 'Globe',
  product_design: 'Palette',
  business_writing: 'FileText',
  financial_analysis: 'TrendingUp',
  general: 'Sparkles'
}
