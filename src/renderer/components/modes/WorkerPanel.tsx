import { useState } from 'react'
import { Code2, Pen, Search, InboxIcon } from 'lucide-react'
import type { WorkerType, WorkerState } from '../../types/agent'
import { WORKERS } from '../../lib/constants'
import WorkerTask from './WorkerTask'
import WorkerQueue from './WorkerQueue'

interface WorkerPanelProps {
  workers: Record<WorkerType, WorkerState>
}

const WORKER_ICONS: Record<WorkerType, React.ElementType> = {
  coder:  Code2,
  author: Pen,
  review: Search,
}

const WORKER_ORDER: WorkerType[] = ['coder', 'author', 'review']

export default function WorkerPanel({ workers }: WorkerPanelProps) {
  const [activeTab, setActiveTab] = useState<WorkerType>('coder')

  const currentWorker = workers[activeTab]
  const workerMeta    = WORKERS[activeTab]
  const workerColor   = workerMeta.color
  const WorkerIcon    = WORKER_ICONS[activeTab]

  return (
    <div
      style={{
        display:        'flex',
        flexDirection:  'column',
        height:         '100%',
        background:     '#111916',
        borderLeft:     '1px solid #2a3a32',
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display:      'flex',
          borderBottom: '1px solid #1a2420',
          flexShrink:   0,
        }}
      >
        {WORKER_ORDER.map((wType) => {
          const meta    = WORKERS[wType]
          const state   = workers[wType]
          const isActive = wType === activeTab
          const queueLen = state.queue.length
          const Icon    = WORKER_ICONS[wType]

          return (
            <button
              key={wType}
              onClick={() => setActiveTab(wType)}
              style={{
                flex:           1,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                gap:            '5px',
                padding:        '10px 6px 9px',
                border:         'none',
                borderBottom:   isActive
                  ? `2px solid ${meta.color}`
                  : '2px solid transparent',
                background:     'transparent',
                cursor:         'pointer',
                fontSize:       '10px',
                fontWeight:     isActive ? 700 : 500,
                color:          isActive ? meta.color : '#5a6b60',
                letterSpacing:  '0.06em',
                transition:     'color 0.15s ease, border-color 0.15s ease',
                whiteSpace:     'nowrap',
              }}
            >
              <Icon size={11} style={{ flexShrink: 0 }} />
              {meta.label}
              {queueLen > 0 && (
                <span
                  style={{
                    fontSize:    '9px',
                    fontWeight:  700,
                    color:       '#0a0f0d',
                    background:  meta.color,
                    borderRadius:'10px',
                    padding:     '1px 5px',
                    lineHeight:  1.4,
                    minWidth:    '16px',
                    textAlign:   'center',
                  }}
                >
                  {queueLen}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Worker content */}
      <div
        style={{
          flex:       1,
          overflowY:  'auto',
          padding:    '12px',
          display:    'flex',
          flexDirection: 'column',
          gap:        '10px',
        }}
      >
        {/* Idle empty state */}
        {currentWorker.status === 'idle' && currentWorker.completedTasks.length === 0 && (
          <div
            style={{
              flex:           1,
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              gap:            '10px',
              opacity:        0.4,
            }}
          >
            <WorkerIcon size={28} style={{ color: workerColor }} />
            <span style={{ fontSize: '12px', color: '#5a6b60' }}>No tasks yet</span>
            <span
              style={{
                fontSize:  '10px',
                color:     '#3a4a40',
                textAlign: 'center',
                maxWidth:  '160px',
              }}
            >
              {workerMeta.description}
            </span>
          </div>
        )}

        {/* Active task */}
        {currentWorker.activeTask && (
          <WorkerTask
            task={currentWorker.activeTask}
            workerType={activeTab}
          />
        )}

        {/* Queue */}
        {currentWorker.queue.length > 0 && (
          <WorkerQueue
            queue={currentWorker.queue}
            workerColor={workerColor}
          />
        )}

        {/* Last completed task summary (if idle and has history) */}
        {currentWorker.status === 'idle' &&
          currentWorker.activeTask === null &&
          currentWorker.completedTasks.length > 0 && (
            <CompletedSummary
              tasks={currentWorker.completedTasks}
              workerColor={workerColor}
              WorkerIcon={WorkerIcon}
            />
          )}
      </div>
    </div>
  )
}

// ── Completed summary ──────────────────────────────────────────────────────

function CompletedSummary({
  tasks,
  workerColor,
  WorkerIcon,
}: {
  tasks:       import('../../types/agent').WorkerTask[]
  workerColor: string
  WorkerIcon:  React.ElementType
}) {
  const lastTask = tasks[tasks.length - 1]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Completed count badge */}
      <div
        style={{
          display:     'flex',
          alignItems:  'center',
          gap:         '6px',
          fontSize:    '10px',
          color:       '#5a6b60',
          marginBottom:'2px',
        }}
      >
        <InboxIcon size={11} style={{ color: workerColor }} />
        {tasks.length} task{tasks.length !== 1 ? 's' : ''} completed
      </div>

      {/* Last task card */}
      <div
        style={{
          background:   '#0e1612',
          border:       `1px solid ${workerColor}20`,
          borderRadius: '8px',
          padding:      '10px 12px',
        }}
      >
        <div
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '7px',
            marginBottom: lastTask.result ? '6px' : '0',
          }}
        >
          <WorkerIcon size={12} style={{ color: workerColor, flexShrink: 0 }} />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#e8ede9' }}>
            {lastTask.title}
          </span>
          <span
            style={{
              marginLeft:  'auto',
              fontSize:    '10px',
              color:       lastTask.status === 'error' ? '#fca5a5' : workerColor,
              fontWeight:  600,
            }}
          >
            {lastTask.status === 'error' ? 'Failed' : 'Done'}
          </span>
        </div>

        {lastTask.result && (
          <p
            style={{
              fontSize:  '11px',
              color:     '#5a6b60',
              lineHeight: 1.5,
              margin:    0,
            }}
          >
            {lastTask.result.length > 160
              ? `${lastTask.result.slice(0, 160)}…`
              : lastTask.result}
          </p>
        )}
      </div>
    </div>
  )
}
