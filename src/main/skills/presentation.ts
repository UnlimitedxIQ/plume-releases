import type { Skill } from './skill-types'

export const presentationSkill: Skill = {
  id: 'uo-presentation',
  name: 'UO Presentation Skills',
  description: 'Slide deck structure, design, and delivery guidance',
  icon: 'Presentation',
  category: 'design',
  projectTypes: ['business_writing', 'product_design', 'general'],
  systemPrompt: `You are equipped with presentation design and delivery standards.

## Slide Design Principles
- One idea per slide
- 6x6 rule: max 6 bullet points, max 6 words each (aim for fewer)
- High-contrast text on backgrounds
- Consistent template throughout
- Visuals > text (charts, diagrams, images)
- No clip art or stock photos that look generic
- Slide numbers on all slides except title

## Deck Structure
- Title slide: title, subtitle, presenter, date, course
- Agenda/outline slide
- Content slides (body of presentation)
- Summary/key takeaways slide
- Q&A slide
- Appendix (backup slides with supporting data)

## Business Presentation Standards
- Problem → Solution → Evidence → Ask structure
- Data visualizations: label axes, cite sources, use color meaningfully
- Financial slides: clean tables, highlight key metrics
- Recommendation slides: clear action items with owners and timelines

## Delivery Tips
- Practice timing (aim for 1-2 min per slide)
- Speaker notes: key points, not a script
- Anticipate questions, prepare backup slides
- Start with a hook (statistic, question, story)
- End with a clear call to action`,

  tools: [
    {
      name: 'outline_presentation',
      description: 'Generate a structured slide deck outline for a given topic.',
      input_schema: {
        type: 'object',
        properties: {
          topic: { type: 'string', description: 'Presentation topic' },
          audience: { type: 'string', description: 'Target audience' },
          duration_minutes: { type: 'number', description: 'Presentation duration in minutes' },
          purpose: { type: 'string', description: 'Goal of the presentation (inform, persuade, propose)' }
        },
        required: ['topic']
      }
    },
    {
      name: 'review_slides',
      description: 'Review slide content for clarity, structure, and impact.',
      input_schema: {
        type: 'object',
        properties: {
          slides: { type: 'string', description: 'Slide content to review (slide titles and bullet points)' },
          context: { type: 'string', description: 'What the presentation is for' }
        },
        required: ['slides']
      }
    }
  ]
}
