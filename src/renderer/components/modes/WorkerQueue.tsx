import type { WorkerTask } from '../../types/agent'

interface WorkerQueueProps {
  queue:       WorkerTask[]
  workerColor: string
}

export default function WorkerQueue({ queue, workerColor }: WorkerQueueProps) {
  if (queue.length === 0) return null

  return (
    <div
      style={{
        borderTop: '1px solid #1a2420',
        paddingTop: '10px',
      }}
    >
      {/* Header */}
      <div
        style={{
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
          padding:        '0 0 6px',
        }}
      >
        <span
          style={{
            fontSize:   '10px',
            fontWeight: 600,
            color:      '#5a6b60',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Queue
        </span>
        <span
          style={{
            fontSize:    '10px',
            fontWeight:  700,
            color:       workerColor,
            background:  `${workerColor}18`,
            border:      `1px solid ${workerColor}30`,
            borderRadius:'4px',
            padding:     '1px 6px',
          }}
        >
          {queue.length}
        </span>
      </div>

      {/* Queue items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {queue.map((task, index) => (
          <div
            key={task.id}
            style={{
              display:      'flex',
              alignItems:   'center',
              gap:          '8px',
              padding:      '6px 9px',
              background:   '#0e1612',
              border:       '1px solid #1a2420',
              borderRadius: '6px',
            }}
          >
            {/* Position badge */}
            <span
              style={{
                fontSize:    '10px',
                fontWeight:  700,
                color:       '#3a4a40',
                minWidth:    '16px',
                textAlign:   'right',
                flexShrink:  0,
              }}
            >
              {index + 1}
            </span>

            {/* Separator */}
            <div
              style={{
                width:        '1px',
                height:       '12px',
                background:   '#2a3a32',
                flexShrink:   0,
              }}
            />

            {/* Task title */}
            <span
              style={{
                fontSize:  '11px',
                color:     '#5a6b60',
                flex:       1,
                overflow:   'hidden',
                textOverflow:'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {task.title}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
