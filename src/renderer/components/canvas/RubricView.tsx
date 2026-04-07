import type { Rubric } from '../../types/canvas'

interface RubricViewProps {
  rubric: Rubric
}

export default function RubricView({ rubric }: RubricViewProps) {
  return (
    <div
      style={{
        background:   '#0c1510',
        border:       '1px solid #2a3a32',
        borderRadius: '8px',
        overflow:     'hidden',
        fontSize:     '12px',
      }}
    >
      {/* Rubric header */}
      <div
        style={{
          padding:      '8px 12px',
          borderBottom: '1px solid #1a2420',
          display:      'flex',
          alignItems:   'center',
          justifyContent:'space-between',
        }}
      >
        <span style={{ fontWeight: 700, color: '#e8ede9' }}>
          {rubric.title || 'Rubric'}
        </span>
        <span style={{ color: '#5a6b60' }}>
          {rubric.points} pts total
        </span>
      </div>

      {/* Criteria table */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width:           '100%',
            borderCollapse:  'collapse',
            minWidth:        '400px',
          }}
        >
          <thead>
            <tr style={{ background: '#111916' }}>
              <th
                style={{
                  padding:    '8px 12px',
                  textAlign:  'left',
                  color:      '#5a6b60',
                  fontWeight: 600,
                  fontSize:   '10px',
                  textTransform:'uppercase',
                  letterSpacing:'0.05em',
                  borderBottom:'1px solid #1a2420',
                  minWidth:   '140px',
                }}
              >
                Criteria
              </th>
              <th
                style={{
                  padding:    '8px 12px',
                  textAlign:  'right',
                  color:      '#5a6b60',
                  fontWeight: 600,
                  fontSize:   '10px',
                  textTransform:'uppercase',
                  letterSpacing:'0.05em',
                  borderBottom:'1px solid #1a2420',
                  width:      '60px',
                }}
              >
                Pts
              </th>
              {rubric.criteria[0]?.ratings.map((r) => (
                <th
                  key={r.id}
                  style={{
                    padding:    '8px 10px',
                    textAlign:  'center',
                    color:      '#5a6b60',
                    fontWeight: 600,
                    fontSize:   '10px',
                    textTransform:'uppercase',
                    letterSpacing:'0.05em',
                    borderBottom:'1px solid #1a2420',
                    minWidth:   '80px',
                  }}
                >
                  {r.description}
                  <div style={{ fontWeight: 400, marginTop: '2px', color: '#3a4a40' }}>
                    {r.points} pts
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rubric.criteria.map((criterion, ci) => (
              <tr
                key={criterion.id}
                style={{
                  borderBottom:ci < rubric.criteria.length - 1 ? '1px solid #1a2420' : 'none',
                }}
              >
                <td
                  style={{
                    padding:   '10px 12px',
                    color:     '#e8ede9',
                    fontWeight:600,
                    lineHeight:1.4,
                    verticalAlign:'top',
                  }}
                >
                  {criterion.description}
                  {criterion.longDescription && (
                    <p style={{ fontWeight: 400, color: '#5a6b60', marginTop: '4px', fontSize: '11px' }}>
                      {criterion.longDescription}
                    </p>
                  )}
                </td>
                <td
                  style={{
                    padding:    '10px 12px',
                    textAlign:  'right',
                    color:      '#FEE123',
                    fontWeight: 700,
                    verticalAlign:'top',
                  }}
                >
                  {criterion.points}
                </td>
                {criterion.ratings.map((rating) => (
                  <td
                    key={rating.id}
                    style={{
                      padding:    '10px',
                      color:      '#8a9b90',
                      fontSize:   '11px',
                      lineHeight: 1.4,
                      textAlign:  'center',
                      verticalAlign:'top',
                    }}
                  >
                    {rating.longDescription || rating.description}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
