import type { Skill } from './skill-types'

export const resumeGuideSkill: Skill = {
  id: 'uo-resume-guide',
  name: 'UO Resume Guide',
  description: 'UO Career Center resume formatting and content guidelines',
  icon: 'User',
  category: 'writing',
  projectTypes: ['business_writing', 'general'],
  systemPrompt: `You are equipped with UO Career Center resume standards.

## Resume Format
- One page for undergrads, two pages max for grad students with extensive experience
- Consistent formatting: same font, spacing, and bullet style throughout
- Sections: Contact Info, Education, Experience, Skills, Activities/Leadership
- Education section first for current students
- GPA included if 3.0+ (UO GPA and/or major GPA)
- Use reverse chronological order within each section

## Content Guidelines
- Start each bullet with a strong action verb (Led, Developed, Analyzed, Created)
- Quantify achievements where possible (increased sales 15%, managed team of 8)
- Tailor content to the target role/industry
- Include relevant coursework if limited work experience
- List technical skills, languages, and certifications
- No personal pronouns (I, me, my)
- No references section (provide separately when requested)

## UO-Specific
- Include "University of Oregon" (not "UO" alone) in Education
- List Lundquist College of Business if applicable
- Include relevant student organizations (ASUO, Ducks Finance Club, etc.)
- Career Center offers free resume reviews — mention as resource`,

  tools: [
    {
      name: 'review_resume',
      description: 'Review a resume against UO Career Center standards. Returns feedback and improvement suggestions.',
      input_schema: {
        type: 'object',
        properties: {
          resume_text: { type: 'string', description: 'The resume text to review' },
          target_role: { type: 'string', description: 'Target job role or industry (optional)' }
        },
        required: ['resume_text']
      }
    },
    {
      name: 'format_resume',
      description: 'Reformat resume content to meet UO Career Center standards.',
      input_schema: {
        type: 'object',
        properties: {
          resume_text: { type: 'string', description: 'Raw resume content to format' }
        },
        required: ['resume_text']
      }
    }
  ]
}
