import type { Skill } from './skill-types'

export const financialAnalysisSkill: Skill = {
  id: 'uo-financial-analysis',
  name: 'UO Financial Analysis Skills',
  description: 'Quantitative analysis frameworks for finance coursework',
  icon: 'TrendingUp',
  category: 'finance',
  projectTypes: ['financial_analysis', 'business_writing'],
  systemPrompt: `You are equipped with financial analysis frameworks taught at UO Lundquist.

## Financial Ratios
- Liquidity: Current Ratio, Quick Ratio, Cash Ratio
- Profitability: Gross Margin, Operating Margin, Net Margin, ROE, ROA, ROIC
- Leverage: Debt/Equity, Debt/EBITDA, Interest Coverage
- Efficiency: Asset Turnover, Inventory Turnover, DSO, DPO
- Valuation: P/E, P/B, EV/EBITDA, EV/Revenue, PEG

## Valuation Methods
- DCF: project FCF, calculate WACC, terminal value (Gordon Growth or Exit Multiple)
- Comparable Companies: select peers, normalize metrics, apply multiples
- Precedent Transactions: identify relevant M&A deals, derive implied multiples
- LBO: model acquisition with debt, project returns to equity sponsor

## Financial Modeling
- Build from revenue drivers (units x price, or growth rate)
- Three-statement model: Income Statement → Balance Sheet → Cash Flow
- Check: BS balances, CF ties to BS changes, circular references resolved
- Sensitivity tables: key variable x key variable matrix
- Scenario analysis: base, bull, bear cases

## Formatting Standards
- Currency in thousands or millions (state clearly)
- Percentages to 1 decimal place
- Consistent color coding: blue = input, black = formula, green = linked
- Sources cited for all market data and assumptions`,

  tools: [
    {
      name: 'calculate_ratios',
      description: 'Calculate financial ratios from provided financial data.',
      input_schema: {
        type: 'object',
        properties: {
          financial_data: { type: 'string', description: 'Financial statement data (revenue, costs, assets, liabilities, etc.)' },
          ratio_types: {
            type: 'array',
            items: { type: 'string' },
            description: 'Types of ratios to calculate (liquidity, profitability, leverage, efficiency, valuation)'
          }
        },
        required: ['financial_data']
      }
    },
    {
      name: 'build_model',
      description: 'Help build a financial model structure with formulas and assumptions.',
      input_schema: {
        type: 'object',
        properties: {
          model_type: {
            type: 'string',
            enum: ['dcf', 'comps', 'lbo', 'three_statement'],
            description: 'Type of financial model'
          },
          inputs: { type: 'string', description: 'Available inputs and assumptions' }
        },
        required: ['model_type', 'inputs']
      }
    },
    {
      name: 'format_table',
      description: 'Format financial data into a clean, professional table.',
      input_schema: {
        type: 'object',
        properties: {
          data: { type: 'string', description: 'Raw financial data to format' },
          title: { type: 'string', description: 'Table title' }
        },
        required: ['data']
      }
    }
  ]
}
