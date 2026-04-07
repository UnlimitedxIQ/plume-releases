interface DiffViewerProps {
  diff:      string
  filePath?: string
}

/**
 * Simple unified diff viewer.
 * Parses standard unified diff format and renders with red/green coloring.
 */
export default function DiffViewer({ diff, filePath }: DiffViewerProps) {
  const lines = diff.split('\n')

  return (
    <div
      style={{
        background:  '#0a0f0d',
        fontFamily:  "'JetBrains Mono', 'Fira Code', monospace",
        fontSize:    '11px',
        lineHeight:  1.5,
        overflowX:   'auto',
        maxHeight:   '300px',
        overflowY:   'auto',
      }}
    >
      {/* File path header */}
      {filePath && (
        <div
          style={{
            padding:      '5px 10px',
            background:   '#111916',
            color:        '#8a9b90',
            borderBottom: '1px solid #1a2420',
            fontSize:     '10px',
          }}
        >
          {filePath}
        </div>
      )}

      {/* Diff lines */}
      <div>
        {lines.map((line, i) => {
          const type = getDiffLineType(line)
          return (
            <div
              key={i}
              style={{
                display:         'flex',
                background:      DIFF_BG[type],
                color:           DIFF_COLOR[type],
                borderLeft:      `2px solid ${DIFF_BORDER[type]}`,
                paddingLeft:     '8px',
                paddingRight:    '10px',
                minHeight:       '20px',
              }}
            >
              {/* Line number / gutter */}
              <span
                style={{
                  minWidth:    '28px',
                  color:       '#3a4a40',
                  paddingRight:'10px',
                  flexShrink:  0,
                  userSelect:  'none',
                  textAlign:   'right',
                }}
              >
                {type !== 'meta' && type !== 'hunk' ? i + 1 : ''}
              </span>

              {/* Diff symbol */}
              <span
                style={{
                  minWidth:    '12px',
                  flexShrink:  0,
                  userSelect:  'none',
                  opacity:     0.7,
                }}
              >
                {DIFF_SYMBOL[type]}
              </span>

              {/* Content */}
              <span style={{ flex: 1, whiteSpace: 'pre', overflowX: 'auto' }}>
                {line.startsWith('+') || line.startsWith('-') ? line.slice(1) : line}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

type DiffLineType = 'add' | 'remove' | 'context' | 'hunk' | 'meta'

function getDiffLineType(line: string): DiffLineType {
  if (line.startsWith('+++') || line.startsWith('---')) return 'meta'
  if (line.startsWith('@@'))  return 'hunk'
  if (line.startsWith('+'))   return 'add'
  if (line.startsWith('-'))   return 'remove'
  return 'context'
}

const DIFF_BG: Record<DiffLineType, string> = {
  add:     'rgba(34, 197, 94, 0.07)',
  remove:  'rgba(239, 68, 68, 0.07)',
  context: 'transparent',
  hunk:    'rgba(59, 130, 246, 0.07)',
  meta:    'rgba(138, 155, 144, 0.05)',
}

const DIFF_COLOR: Record<DiffLineType, string> = {
  add:     '#86efac',
  remove:  '#fca5a5',
  context: '#5a6b60',
  hunk:    '#60a5fa',
  meta:    '#8a9b90',
}

const DIFF_BORDER: Record<DiffLineType, string> = {
  add:     '#22c55e',
  remove:  '#ef4444',
  context: 'transparent',
  hunk:    '#3b82f6',
  meta:    'transparent',
}

const DIFF_SYMBOL: Record<DiffLineType, string> = {
  add:     '+',
  remove:  '-',
  context: ' ',
  hunk:    '@',
  meta:    ' ',
}
