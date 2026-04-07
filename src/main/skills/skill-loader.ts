import type { Skill, ProjectType } from './skill-types'
import { businessWritingSkill } from './business-writing'
import { resumeGuideSkill } from './resume-guide'
import { uiUxSkill } from './ui-ux'
import { researchPaperSkill } from './research-paper'
import { financialAnalysisSkill } from './financial-analysis'
import { presentationSkill } from './presentation'

const ALL_SKILLS: Skill[] = [
  businessWritingSkill,
  resumeGuideSkill,
  uiUxSkill,
  researchPaperSkill,
  financialAnalysisSkill,
  presentationSkill
]

export function getAllSkills(): Skill[] {
  return ALL_SKILLS
}

export function getSkillsForProject(projectType: string): Skill[] {
  return ALL_SKILLS.filter(skill =>
    skill.projectTypes.includes(projectType as ProjectType) ||
    skill.projectTypes.includes('general')
  )
}

export function getSkillById(id: string): Skill | undefined {
  return ALL_SKILLS.find(s => s.id === id)
}
