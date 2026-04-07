import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useStyleStore } from '../../stores/style-store'
import type { StyleProfile, StyleRule } from '../../types/style'
import { createStyleRule } from '../../types/style'
import SkillToggle from '../skills/SkillToggle'

interface StyleRulesProps {
  profile: StyleProfile
}

export default function StyleRules({ profile }: StyleRulesProps) {
  const updateProfile = useStyleStore((s) => s.updateProfile)
  const [addingPositive, setAddingPositive] = useState(false)
  const [addingNegative, setAddingNegative] = useState(false)
  const [newRule, setNewRule] = useState('')

  function toggleRule(type: 'positive' | 'negative', ruleId: string) {
    const key = type === 'positive' ? 'positiveRules' : 'negativeRules'
    const rules = profile[key].map((r: StyleRule) =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    )
    updateProfile(profile.id, { [key]: rules })
  }

  function removeRule(type: 'positive' | 'negative', ruleId: string) {
    const key = type === 'positive' ? 'positiveRules' : 'negativeRules'
    updateProfile(profile.id, {
      [key]: profile[key].filter((r: StyleRule) => r.id !== ruleId),
    })
  }

  function addRule(type: 'positive' | 'negative') {
    if (!newRule.trim()) return
    const key  = type === 'positive' ? 'positiveRules' : 'negativeRules'
    const rule = createStyleRule(newRule.trim(), 'user')
    updateProfile(profile.id, { [key]: [...profile[key], rule] })
    setNewRule('')
    type === 'positive' ? setAddingPositive(false) : setAddingNegative(false)
  }

  return (
    <div
      style={{
        background:   '#111916',
        border:       '1px solid #2a3a32',
        borderRadius: '12px',
        padding:      '16px',
      }}
    >
      <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#e8ede9', marginBottom: '14px' }}>
        Style Rules
      </h3>

      {/* Positive rules */}
      <RuleSection
        title="DO — Apply these patterns"
        accentColor="#22c55e"
        borderColor="rgba(34,197,94,0.25)"
        bgColor="rgba(34,197,94,0.05)"
        rules={profile.positiveRules}
        onToggle={(id) => toggleRule('positive', id)}
        onRemove={(id) => removeRule('positive', id)}
        onAdd={() => setAddingPositive(true)}
        isAdding={addingPositive}
        newRule={newRule}
        setNewRule={setNewRule}
        onSubmit={() => addRule('positive')}
        onCancel={() => { setAddingPositive(false); setNewRule('') }}
      />

      <div style={{ marginTop: '16px' }}>
        {/* Negative rules */}
        <RuleSection
          title="AVOID — Skip these patterns"
          accentColor="#ef4444"
          borderColor="rgba(239,68,68,0.25)"
          bgColor="rgba(239,68,68,0.05)"
          rules={profile.negativeRules}
          onToggle={(id) => toggleRule('negative', id)}
          onRemove={(id) => removeRule('negative', id)}
          onAdd={() => setAddingNegative(true)}
          isAdding={addingNegative}
          newRule={newRule}
          setNewRule={setNewRule}
          onSubmit={() => addRule('negative')}
          onCancel={() => { setAddingNegative(false); setNewRule('') }}
        />
      </div>
    </div>
  )
}

interface RuleSectionProps {
  title:       string
  accentColor: string
  borderColor: string
  bgColor:     string
  rules:       StyleRule[]
  onToggle:    (id: string) => void
  onRemove:    (id: string) => void
  onAdd:       () => void
  isAdding:    boolean
  newRule:     string
  setNewRule:  (v: string) => void
  onSubmit:    () => void
  onCancel:    () => void
}

function RuleSection({
  title, accentColor, borderColor, bgColor,
  rules, onToggle, onRemove,
  onAdd, isAdding, newRule, setNewRule, onSubmit, onCancel,
}: RuleSectionProps) {
  return (
    <div
      style={{
        background:   bgColor,
        border:       `1px solid ${borderColor}`,
        borderRadius: '10px',
        padding:      '12px',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          style={{
            fontSize:   '11px',
            fontWeight: 700,
            color:      accentColor,
            textTransform:'uppercase',
            letterSpacing:'0.05em',
          }}
        >
          {title}
        </span>
        <button
          onClick={onAdd}
          style={{
            display:    'flex',
            alignItems: 'center',
            gap:        '3px',
            background: 'transparent',
            border:     'none',
            color:      accentColor,
            fontSize:   '11px',
            cursor:     'pointer',
            padding:    '2px 6px',
            borderRadius:'4px',
            opacity:    0.7,
          }}
        >
          <Plus size={11} /> Add
        </button>
      </div>

      {/* Rule list */}
      <div className="flex flex-col gap-1.5">
        {rules.map((rule) => (
          <div
            key={rule.id}
            style={{
              display:    'flex',
              alignItems: 'center',
              gap:        '8px',
              padding:    '6px 8px',
              borderRadius:'6px',
              background: '#111916',
              border:     '1px solid #1a2420',
              opacity:    rule.enabled ? 1 : 0.5,
            }}
          >
            <SkillToggle enabled={rule.enabled} onChange={() => onToggle(rule.id)} size="sm" />
            <span style={{ flex: 1, fontSize: '12px', color: '#8a9b90', lineHeight: 1.4 }}>
              {rule.description}
            </span>
            <button
              onClick={() => onRemove(rule.id)}
              style={{
                background:  'transparent',
                border:      'none',
                cursor:      'pointer',
                color:       '#3a4a40',
                padding:     0,
                flexShrink:  0,
                transition:  'color 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#3a4a40' }}
            >
              <X size={11} />
            </button>
          </div>
        ))}

        {rules.length === 0 && !isAdding && (
          <p style={{ fontSize: '11px', color: '#5a6b60', fontStyle: 'italic', paddingLeft: '4px' }}>
            No rules yet. Click "Add" to create one.
          </p>
        )}

        {/* Add rule input */}
        {isAdding && (
          <div
            style={{
              display:      'flex',
              gap:          '6px',
              padding:      '6px 8px',
              borderRadius: '6px',
              background:   '#111916',
              border:       '1px solid #2a3a32',
            }}
          >
            <input
              autoFocus
              value={newRule}
              onChange={(e) => setNewRule(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSubmit()
                if (e.key === 'Escape') onCancel()
              }}
              placeholder="Describe the rule…"
              style={{
                flex:       1,
                background: 'transparent',
                border:     'none',
                outline:    'none',
                color:      '#e8ede9',
                fontSize:   '12px',
              }}
            />
            <button onClick={onSubmit} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: accentColor, fontSize: '11px', fontWeight: 600 }}>
              Add
            </button>
            <button onClick={onCancel} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#5a6b60' }}>
              <X size={11} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
