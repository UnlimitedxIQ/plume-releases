import type { Skill } from './skill-types'

export const researchPaperSkill: Skill = {
  id: 'uo-research-paper',
  name: 'UO Research Paper Skills',
  description: 'Academic research, citation, and paper writing guidance',
  icon: 'BookOpen',
  category: 'research',
  projectTypes: ['research_paper', 'general'],
  systemPrompt: `You are equipped with academic research paper standards used at UO.

## Paper Structure
- Title page: title, author, course, instructor, date
- Abstract: 150-250 words, summarize purpose, method, findings, conclusion
- Introduction: hook, background, thesis statement, roadmap
- Literature Review: synthesize sources, identify gaps, justify research
- Methodology: describe approach, data sources, analysis methods
- Results/Findings: present data objectively
- Discussion: interpret results, connect to literature, acknowledge limitations
- Conclusion: summarize findings, implications, future research
- References: complete list in required citation format

## Citation Formats
- APA 7th: default for business, psychology, social sciences
- MLA 9th: humanities, English, liberal arts
- Chicago: history, some humanities courses
- Always cite: direct quotes, paraphrases, statistics, unique ideas

## Academic Integrity (UO Standards)
- All sources must be cited
- Direct quotes require quotation marks AND citation
- Paraphrasing still requires citation
- Self-plagiarism: cannot resubmit previous work without permission
- AI disclosure: if AI tools were used, disclose per instructor policy

## Research Tips
- Use UO Library databases (JSTOR, ProQuest, EBSCOhost, Google Scholar)
- Evaluate sources: peer-reviewed > professional > popular
- Primary sources preferred when available
- Minimum source count varies by assignment (check rubric)`,

  tools: [
    {
      name: 'check_citations',
      description: 'Check text for proper citation formatting and missing citations.',
      input_schema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The paper text to check' },
          format: {
            type: 'string',
            enum: ['apa7', 'mla9', 'chicago'],
            description: 'Citation format to check against'
          }
        },
        required: ['text', 'format']
      }
    },
    {
      name: 'format_references',
      description: 'Format a list of sources into proper citation format.',
      input_schema: {
        type: 'object',
        properties: {
          sources: { type: 'string', description: 'Raw source information to format' },
          format: {
            type: 'string',
            enum: ['apa7', 'mla9', 'chicago'],
            description: 'Target citation format'
          }
        },
        required: ['sources', 'format']
      }
    },
    {
      name: 'find_sources',
      description: 'Suggest academic sources and databases for a research topic.',
      input_schema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Research topic to find sources for' },
          field: { type: 'string', description: 'Academic field (business, psychology, etc.)' }
        },
        required: ['topic']
      }
    }
  ]
}
