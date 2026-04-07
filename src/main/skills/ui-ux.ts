import type { Skill } from './skill-types'

export const uiUxSkill: Skill = {
  id: 'uo-ui-ux',
  name: 'UO UI/UX Skills',
  description: 'Design and layout best practices for web and product design',
  icon: 'Palette',
  category: 'design',
  projectTypes: ['website_app', 'product_design', 'general'],
  systemPrompt: `You are equipped with UI/UX design best practices.

## Design Principles
- Hierarchy: guide the eye with size, color, and spacing
- Consistency: same patterns for same actions throughout
- Accessibility: WCAG 2.1 AA minimum (contrast ratios, keyboard nav, screen readers)
- Responsiveness: mobile-first design, test at 320px, 768px, 1024px, 1440px
- White space: generous padding and margins, never crowded
- Typography: max 2 font families, clear hierarchy (h1 > h2 > h3 > body)

## Interaction Design
- Every interactive element needs: default, hover, focus, active, disabled states
- Loading states for all async operations
- Error states with clear recovery paths
- Empty states with helpful guidance
- Transitions: 150-300ms ease for state changes
- Feedback: immediate visual response to user actions

## Layout Patterns
- F-pattern for content-heavy pages
- Z-pattern for landing pages
- Card grid for collections
- Sidebar + content for dashboards
- Full-bleed hero for marketing

## Color Usage
- Primary: brand action color (buttons, links, CTAs)
- Secondary: supporting accent
- Neutral: text, borders, backgrounds (use gray scale)
- Semantic: success (green), warning (amber), error (red), info (blue)
- Dark mode: don't just invert — adjust contrast and saturation`,

  tools: [
    {
      name: 'audit_ui_design',
      description: 'Audit a UI design or component for usability, accessibility, and best practices.',
      input_schema: {
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Description of the UI or component code to audit' },
          context: { type: 'string', description: 'What the UI is for (e.g., "dashboard sidebar", "checkout form")' }
        },
        required: ['description']
      }
    },
    {
      name: 'suggest_improvements',
      description: 'Suggest specific UI/UX improvements for a described interface.',
      input_schema: {
        type: 'object',
        properties: {
          current_ui: { type: 'string', description: 'Description of the current UI' },
          goal: { type: 'string', description: 'What the UI should accomplish' }
        },
        required: ['current_ui', 'goal']
      }
    }
  ]
}
