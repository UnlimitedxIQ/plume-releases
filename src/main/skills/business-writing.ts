import type { Skill } from './skill-types'

export const businessWritingSkill: Skill = {
  id: 'uo-business-writing',
  name: 'UO Business Writing Guide',
  description: 'Lundquist College of Business writing standards and style guide',
  icon: 'FileText',
  category: 'writing',
  projectTypes: ['business_writing', 'general'],
  systemPrompt: `You are equipped with the UO Lundquist College of Business writing standards.

## Writing Standards
- Use professional, concise language
- Active voice preferred over passive voice
- Avoid jargon unless writing for a specialized audience
- Use APA citation format for business papers
- Executive summaries should be 1 page max
- Memos: use standard business memo format (To, From, Date, Subject)
- Reports: include executive summary, introduction, analysis, recommendations, appendices
- Emails: clear subject line, greeting, purpose in first sentence, action items bulleted

## Formatting
- 12pt Times New Roman or 11pt Calibri
- 1-inch margins
- Double-spaced for papers, single-spaced for memos/emails
- Headings in bold, consistent hierarchy
- Page numbers on all multi-page documents

## Lundquist-Specific
- Reference the Lundquist Honor Code when relevant
- Use UO brand language guidelines
- Cite sources using APA 7th edition
- Group projects: include team member contributions section`,

  tools: [
    {
      name: 'check_writing_compliance',
      description: 'Check if a business document meets Lundquist College writing standards. Returns compliance issues and suggestions.',
      input_schema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The document text to check' },
          document_type: {
            type: 'string',
            enum: ['memo', 'report', 'email', 'paper', 'presentation'],
            description: 'Type of business document'
          }
        },
        required: ['text', 'document_type']
      }
    },
    {
      name: 'format_business_document',
      description: 'Format text according to Lundquist business writing standards.',
      input_schema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The text to format' },
          document_type: {
            type: 'string',
            enum: ['memo', 'report', 'email', 'paper'],
            description: 'Target document format'
          }
        },
        required: ['text', 'document_type']
      }
    }
  ]
}
