import { useProjectStore } from '../../stores/project-store'
import { gridLayoutToCSS } from '../../types/project'
import { ipc } from '../../lib/ipc'
import { BASE_SYSTEM_PROMPT } from '../../lib/constants'
import TabBar from '../layout/TabBar'
import ProjectTab from './ProjectTab'

export default function WorkspaceGrid() {
  const { tabs: allTabs, activeTabId, gridLayout, addTab } = useProjectStore()
  const { gridTemplateColumns, gridTemplateRows, maxCells } = gridLayoutToCSS(gridLayout)

  function handleAddTab() {
    const tabId = addTab('general', 'New Chat')
    ipc.providerStartSession({ tabId, systemPrompt: BASE_SYSTEM_PROMPT })
  }

  // Only show open (non-parked) tabs
  const tabs = allTabs.filter(t => !t.parked)
  const visibleTabs = tabs.slice(0, maxCells)

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <TabBar />

      {tabs.length === 0 ? (
        <EmptyWorkspace onNewTab={handleAddTab} />
      ) : (
        <div
          className="flex-1 min-h-0"
          style={{
            display:             'grid',
            gridTemplateColumns,
            gridTemplateRows,
            gap:                 '1px',
            background:          '#1a2420',
            overflow:            'hidden',
          }}
        >
          {gridLayout === 'single' ? (
            // Single mode: always show the active tab
            <ProjectTab
              tabId={activeTabId ?? tabs[0]?.id ?? ''}
              isActive
            />
          ) : (
            // Multi-cell mode: show tabs in grid
            Array.from({ length: maxCells }).map((_, i) => {
              const tab = visibleTabs[i]
              if (!tab) {
                return (
                  <EmptyCell key={i} onAdd={handleAddTab} />
                )
              }
              return (
                <ProjectTab
                  key={tab.id}
                  tabId={tab.id}
                  isActive={tab.id === activeTabId}
                />
              )
            })
          )}
        </div>
      )}

    </div>
  )
}

function EmptyWorkspace({ onNewTab }: { onNewTab: () => void }) {
  return (
    <div
      className="flex-1 flex items-center justify-center"
      style={{ background: '#0a0f0d' }}
    >
      <div className="text-center space-y-5">
        <div
          className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-4xl font-black"
          style={{
            background: 'linear-gradient(135deg, rgba(21,71,51,0.3), rgba(0,103,71,0.2))',
            color:      '#FEE123',
            border:     '1px solid rgba(42,58,50,0.5)',
          }}
        >
          O
        </div>
        <div>
          <h2
            className="text-xl font-bold mb-2"
            style={{ color: '#e8ede9' }}
          >
            Welcome to Plume
          </h2>
          <p style={{ color: '#5a6b60', fontSize: '14px' }}>
            Start a new session to get help with your coursework.
          </p>
        </div>
        <button
          onClick={onNewTab}
          style={{
            padding:      '10px 24px',
            borderRadius: '8px',
            border:       '1px solid #006747',
            background:   'rgba(0, 103, 71, 0.15)',
            color:        '#FEE123',
            fontWeight:   600,
            fontSize:     '14px',
            cursor:       'pointer',
            transition:   'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 103, 71, 0.3)'
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0,103,71,0.25)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 103, 71, 0.15)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          + New Session
        </button>
      </div>
    </div>
  )
}

function EmptyCell({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ background: '#0a0f0d' }}
    >
      <button
        onClick={onAdd}
        style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           '8px',
          padding:       '20px',
          borderRadius:  '12px',
          border:        '1px dashed #2a3a32',
          background:    'transparent',
          color:         '#5a6b60',
          cursor:        'pointer',
          transition:    'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#006747'
          e.currentTarget.style.color = '#8a9b90'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#2a3a32'
          e.currentTarget.style.color = '#5a6b60'
        }}
      >
        <span style={{ fontSize: '24px', lineHeight: 1 }}>+</span>
        <span style={{ fontSize: '12px' }}>New session</span>
      </button>
    </div>
  )
}
