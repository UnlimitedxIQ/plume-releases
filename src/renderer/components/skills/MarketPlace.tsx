import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Store, Search, Plug, Plus, Check, ChevronDown, ChevronUp, Package, Zap,
} from 'lucide-react'
import {
  C,
  getIcon,
  type SkillPack, type McpServer,
} from './skill-data'
import { useMarketplaceStore } from '../../stores/marketplace-store'
import McpCard from './McpCard'

// ── Main component ─────────────────────────────────────────────────────────

export default function MarketPlace() {
  const [search, setSearch] = useState('')
  const packs = useMarketplaceStore(s => s.packs)
  const mcps = useMarketplaceStore(s => s.mcps)
  const storeInstallPack = useMarketplaceStore(s => s.installPack)
  const storeInstallMcp = useMarketplaceStore(s => s.installMcp)
  const refreshCatalog = useMarketplaceStore(s => s.refreshCatalog)
  const catalogFetched = useMarketplaceStore(s => s.catalogFetched)

  // Fetch latest catalog from GitHub on first load
  useEffect(() => {
    if (!catalogFetched) {
      refreshCatalog()
    }
  }, [catalogFetched, refreshCatalog])

  const q = search.toLowerCase()
  const matches = (name: string, extra = '') =>
    !q || name.toLowerCase().includes(q) || extra.toLowerCase().includes(q)

  const installPack = (id: string) => storeInstallPack(id)
  const installMcp = (id: string) => storeInstallMcp(id)

  // Installed skill names (for filtering individual skills)
  const installedSkillNames = new Set(
    packs.filter(p => p.installed).flatMap(p => p.skills)
  )

  // All packs for the featured section (installed shown as "Installed")
  const allMatchedPacks = packs.filter(p => matches(p.name, p.description))
  const installedPacks = allMatchedPacks.filter(p => p.installed)
  const marketPacks = allMatchedPacks.filter(p => !p.installed)

  // Individual skills not in any installed pack
  const uniqueMarketSkills = [
    ...new Set(
      packs.filter(p => !p.installed).flatMap(p => p.skills)
    ),
  ].filter(s => !installedSkillNames.has(s) && matches(s, ''))

  // MCPs
  const marketMcps = mcps.filter(m => !m.installed && matches(m.name, m.description))
  const installedMcps = mcps.filter(m => m.installed && matches(m.name, m.description))

  const leftCount = marketPacks.length + installedPacks.length + uniqueMarketSkills.length
  const rightCount = marketMcps.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, background: C.bg }}>
      {/* ── Header ── */}
      <div style={{
        padding: '14px 20px 14px',
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
      }}>
        {/* Title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: 'rgba(254,225,35,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Store size={15} style={{ color: C.yellow }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, letterSpacing: '-0.01em' }}>
            MarketPlace
          </span>
        </div>

        {/* Big centered search */}
        <div style={{
          maxWidth: 540, margin: '0 auto',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '11px 16px',
          background: C.surface,
          border: `1px solid ${C.borderLight}`,
          borderRadius: 14,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          <Search size={15} style={{ color: C.textMuted, flexShrink: 0 }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search skills, packs, and MCPs..."
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: C.text, fontSize: 13, fontFamily: 'inherit',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: 'none', border: 'none', color: C.textMuted,
                cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 16,
              }}
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* ── 50/50 split ── */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, padding: 12, gap: 10 }}>
        {/* Left: Packs + individual skills */}
        <MarketColumn
          label="SKILLS"
          icon={<Package size={12} />}
          count={leftCount}
        >
          {/* Featured Packs */}
          {(installedPacks.length > 0 || marketPacks.length > 0) && (
            <div style={{ marginBottom: 18 }}>
              <SectionLabel text="FEATURED PACKS" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {installedPacks.map((p, i) => (
                  <PackCard key={p.id} pack={p} index={i} onInstall={() => installPack(p.id)} />
                ))}
                {marketPacks.map((p, i) => (
                  <PackCard key={p.id} pack={p} index={installedPacks.length + i} onInstall={() => installPack(p.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Individual skills */}
          {uniqueMarketSkills.length > 0 && (
            <div>
              <SectionLabel text="INDIVIDUAL SKILLS" />
              <TwoColGrid>
                {uniqueMarketSkills.map((name, i) => (
                  <MktSkillCard key={name} name={name} index={i} />
                ))}
              </TwoColGrid>
            </div>
          )}

          {leftCount === 0 && (
            <EmptyState msg="No skills found" icon={<Package size={18} style={{ color: C.textMuted }} />} />
          )}
        </MarketColumn>

        {/* Right: MCPs */}
        <MarketColumn
          label="MCP SERVERS"
          icon={<Plug size={12} />}
          count={rightCount}
        >
          {/* Already installed MCPs */}
          {installedMcps.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <SectionLabel text="INSTALLED" />
              <TwoColGrid>
                {installedMcps.map((m, i) => (
                  <McpCard key={m.id} mcp={{ ...m, installed: true }} mode="marketplace" index={i} />
                ))}
              </TwoColGrid>
            </div>
          )}

          {/* Available MCPs */}
          {marketMcps.length > 0 && (
            <div>
              {installedMcps.length > 0 && <SectionLabel text="AVAILABLE" />}
              <TwoColGrid>
                {marketMcps.map((m, i) => (
                  <McpCard key={m.id} mcp={m} mode="marketplace" index={i} onInstall={() => installMcp(m.id)} />
                ))}
              </TwoColGrid>
            </div>
          )}

          {marketMcps.length === 0 && installedMcps.length === 0 && (
            <EmptyState msg="No MCPs found" icon={<Plug size={18} style={{ color: C.textMuted }} />} />
          )}
        </MarketColumn>
      </div>
    </div>
  )
}

// ── Column wrapper ─────────────────────────────────────────────────────────

function MarketColumn({ label, icon, count, children }: {
  label: string
  icon: React.ReactNode
  count: number
  children: React.ReactNode
}) {
  return (
    <div style={{
      width: '50%', display: 'flex', flexDirection: 'column',
      background: C.surface, border: `1px solid ${C.border}`,
      borderRadius: 12, overflow: 'hidden', minHeight: 0,
    }}>
      <div style={{
        padding: '10px 14px 8px',
        borderBottom: `1px solid ${C.border}`,
        flexShrink: 0,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ color: C.textMuted }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, letterSpacing: '0.08em' }}>
          {label}
        </span>
        <span style={{
          fontSize: 9, fontWeight: 700,
          color: C.greenDark, background: C.yellow,
          borderRadius: 10, padding: '1px 6px', marginLeft: 2,
        }}>
          {count}
        </span>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
        {children}
      </div>
    </div>
  )
}

// ── Pack card ──────────────────────────────────────────────────────────────

function PackCard({ pack, index, onInstall }: {
  pack: SkillPack
  index: number
  onInstall: () => void
}) {
  const [hovered, setHovered] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const Icon = getIcon(pack.icon)

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        background: hovered ? C.surfaceLight : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? pack.color + '50' : C.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: hovered ? `0 6px 24px ${pack.color}1a` : 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 0 }}>
        {/* Color accent bar */}
        <div style={{ width: 4, background: pack.color, flexShrink: 0 }} />

        <div style={{ flex: 1, padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            {/* Pack icon */}
            <div style={{
              width: 36, height: 36, borderRadius: 9, flexShrink: 0,
              background: `${pack.color}18`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={18} style={{ color: pack.color }} />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{pack.name}</span>
                {pack.preInstalled && (
                  <span style={{
                    fontSize: 8, fontWeight: 700,
                    color: C.greenDark, background: C.yellow,
                    borderRadius: 4, padding: '1px 5px',
                  }}>
                    DEFAULT
                  </span>
                )}
              </div>
              <p style={{ fontSize: 11, color: C.textSec, margin: 0, lineHeight: 1.4 }}>
                {pack.description}
              </p>
            </div>

            {/* Install action */}
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              {pack.installed ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
                  <Check size={13} /> Installed
                </div>
              ) : (
                <motion.button
                  onClick={onInstall}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    padding: '5px 12px', borderRadius: 7, border: 'none',
                    background: C.green, color: C.text,
                    fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Install Pack
                </motion.button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 10,
          }}>
            <span style={{ fontSize: 10, color: C.textMuted }}>
              <span style={{ color: pack.color, fontWeight: 600 }}>{pack.skills.length}</span> skills included
            </span>
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: 'none', border: 'none', color: C.textMuted,
                fontSize: 10, cursor: 'pointer', padding: 0, fontFamily: 'inherit',
              }}
            >
              {expanded ? 'Hide' : 'Show'} skills
              {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          </div>

          {/* Expandable skill list */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {pack.skills.map(skill => (
                    <span key={skill} style={{
                      fontSize: 10, fontWeight: 500, color: C.textSec,
                      background: C.surfaceLight, border: `1px solid ${C.borderLight}`,
                      borderRadius: 5, padding: '2px 7px',
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

// ── Marketplace: individual skill card ────────────────────────────────────

function MktSkillCard({ name, index }: { name: string; index: number }) {
  const [added, setAdded] = useState(false)
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      style={{
        padding: '10px',
        background: hovered ? C.surfaceLight : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hovered ? C.borderLight : C.border}`,
        borderRadius: 9,
        transition: 'all 0.15s ease',
        transform: hovered ? 'translateY(-1px)' : 'none',
        boxShadow: hovered ? '0 3px 12px rgba(0,0,0,0.25)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginBottom: 8 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: 'rgba(254,225,35,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Zap size={12} style={{ color: C.yellow }} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{name}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {added ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#22c55e', fontWeight: 600 }}>
            <Check size={11} /> Added
          </span>
        ) : (
          <motion.button
            onClick={() => setAdded(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 3,
              padding: '3px 9px', borderRadius: 6, border: 'none',
              background: C.green, color: C.text,
              fontSize: 10, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Plus size={10} /> Add
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

// ── Layout helpers ─────────────────────────────────────────────────────────

function TwoColGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7 }}>
      {children}
    </div>
  )
}

function SectionLabel({ text }: { text: string }) {
  return (
    <div style={{
      fontSize: 9, fontWeight: 700, color: C.textMuted,
      letterSpacing: '0.1em', marginBottom: 8,
    }}>
      {text}
    </div>
  )
}

function EmptyState({ msg, icon }: { msg: string; icon: React.ReactNode }) {
  return (
    <div style={{ padding: '40px 16px', textAlign: 'center' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: 'rgba(254,225,35,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 12px',
      }}>
        {icon}
      </div>
      <p style={{ fontSize: 12, color: C.textMuted, margin: 0 }}>{msg}</p>
    </div>
  )
}
