import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface StreamingTextProps {
  text: string
}

/**
 * Renders live streaming text with a blinking cursor at the end.
 * Uses a lightweight markdown renderer so partial markdown looks reasonable.
 */
export default function StreamingText({ text }: StreamingTextProps) {
  return (
    <div className="prose-uo selectable" style={{ position: 'relative' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {text}
      </ReactMarkdown>
      {/* Blinking cursor */}
      <span
        className="animate-cursor-blink"
        style={{
          display:       'inline-block',
          width:         '2px',
          height:        '1em',
          background:    '#006747',
          marginLeft:    '2px',
          verticalAlign: 'text-bottom',
          borderRadius:  '1px',
        }}
      />
    </div>
  )
}
