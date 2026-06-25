'use client'

const MONO = { fontFamily: "'JetBrains Mono', monospace" }

const NODES = [
  {
    id: 'trigger',
    type: 'trigger',
    label: 'Pipeline Trigger',
    sublabel: 'Manual / Cron',
    icon: '▶',
    color: '#16a34a',
    bgColor: 'rgba(22,163,74,0.12)',
    borderColor: 'rgba(22,163,74,0.4)',
    x: 60,
    y: 200,
    status: 'idle',
    runs: 47,
  },
  {
    id: 'scraper',
    type: 'agent',
    label: 'Agente Scraper',
    sublabel: 'Google Maps → Leads',
    icon: '🔍',
    color: '#7c3aed',
    bgColor: 'rgba(124,58,237,0.12)',
    borderColor: 'rgba(124,58,237,0.4)',
    x: 340,
    y: 80,
    status: 'active',
    runs: 47,
    stats: { processed: '1.2k leads', rate: '~25/min' },
  },
  {
    id: 'contact',
    type: 'agent',
    label: 'Agente Contacto',
    sublabel: 'WhatsApp Outreach',
    icon: '💬',
    color: '#0ea5e9',
    bgColor: 'rgba(14,165,233,0.12)',
    borderColor: 'rgba(14,165,233,0.4)',
    x: 340,
    y: 260,
    status: 'active',
    runs: 47,
    stats: { processed: '847 msgs', rate: '3 líneas activas' },
  },
  {
    id: 'webpages',
    type: 'agent',
    label: 'Agente Web',
    sublabel: 'Crea páginas web',
    icon: '🌐',
    color: '#f59e0b',
    bgColor: 'rgba(245,158,11,0.12)',
    borderColor: 'rgba(245,158,11,0.4)',
    x: 340,
    y: 440,
    status: 'active',
    runs: 12,
    stats: { processed: '12 páginas', rate: 'Next.js + Vercel' },
  },
  {
    id: 'output',
    type: 'output',
    label: 'Conversiones',
    sublabel: 'CRM → Revenue',
    icon: '★',
    color: '#10b981',
    bgColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.4)',
    x: 620,
    y: 200,
    status: 'idle',
    runs: 4,
    stats: { processed: '€211', rate: '4 deals cerrados' },
  },
]

const EDGES = [
  { from: 'trigger', to: 'scraper' },
  { from: 'trigger', to: 'contact' },
  { from: 'trigger', to: 'webpages' },
  { from: 'scraper', to: 'output' },
  { from: 'contact', to: 'output' },
  { from: 'webpages', to: 'output' },
]

const NODE_W = 210
const NODE_H = 88

function getNodeCenter(node) {
  return { x: node.x + NODE_W / 2, y: node.y + NODE_H / 2 }
}

function getEdgePoints(fromNode, toNode) {
  const from = getNodeCenter(fromNode)
  const to = getNodeCenter(toNode)
  const dx = to.x - from.x
  const cx1 = from.x + dx * 0.5
  const cx2 = to.x - dx * 0.5
  return `M ${from.x} ${from.y} C ${cx1} ${from.y} ${cx2} ${to.y} ${to.x} ${to.y}`
}

const CANVAS_W = 900
const CANVAS_H = 600

export default function WorkflowPage() {
  const nodeMap = Object.fromEntries(NODES.map(n => [n.id, n]))

  return (
    <div style={{
      height: 'calc(100vh - var(--topnav-height))',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--bg)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 20px 10px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>
            ⚡ Workflow
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', letterSpacing: '0.04em' }}>
            Pipeline de automatización · Pepino AI
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ ...MONO, fontSize: '10px', color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '4px', padding: '3px 8px', letterSpacing: '0.08em' }}>
            ● ACTIVO
          </span>
          <span style={{ ...MONO, fontSize: '10px', color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '3px 8px' }}>
            47 ejecuciones
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        position: 'relative',
        background: 'var(--bg)',
      }}>
        {/* Dot grid background */}
        <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.35 }}>
          <defs>
            <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="var(--border)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>

        {/* Workflow SVG + nodes */}
        <div style={{ position: 'relative', width: `${CANVAS_W}px`, minHeight: `${CANVAS_H}px`, margin: '40px auto' }}>

          {/* Edges SVG */}
          <svg
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}
          >
            <defs>
              <marker id="arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                <path d="M0,0 L0,6 L8,3 z" fill="rgba(124,58,237,0.5)" />
              </marker>
            </defs>
            {EDGES.map((edge, i) => {
              const fromNode = nodeMap[edge.from]
              const toNode = nodeMap[edge.to]
              if (!fromNode || !toNode) return null
              return (
                <path
                  key={i}
                  d={getEdgePoints(fromNode, toNode)}
                  fill="none"
                  stroke="rgba(124,58,237,0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="none"
                  markerEnd="url(#arrow)"
                />
              )
            })}
          </svg>

          {/* Nodes */}
          {NODES.map(node => (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: `${node.x}px`,
                top: `${node.y}px`,
                width: `${NODE_W}px`,
                height: `${NODE_H}px`,
                background: 'var(--panel)',
                border: `1.5px solid ${node.borderColor}`,
                borderRadius: '10px',
                boxShadow: `0 0 20px ${node.bgColor}, 0 2px 8px rgba(0,0,0,0.3)`,
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'default',
                transition: 'box-shadow .2s',
              }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '30px', height: '30px', borderRadius: '7px',
                  background: node.bgColor,
                  border: `1px solid ${node.borderColor}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '15px', flexShrink: 0,
                }}>
                  {node.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {node.label}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {node.sublabel}
                  </div>
                </div>
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                  background: node.status === 'active' ? '#10b981' : 'var(--text-dim)',
                  boxShadow: node.status === 'active' ? '0 0 6px rgba(16,185,129,0.8)' : 'none',
                }} />
              </div>

              {/* Stats row */}
              {node.stats && (
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                  <span style={{ ...MONO, fontSize: '10px', color: node.color }}>
                    {node.stats.processed}
                  </span>
                  <span style={{ ...MONO, fontSize: '10px', color: 'var(--text-dim)' }}>
                    {node.stats.rate}
                  </span>
                </div>
              )}
              {!node.stats && (
                <div style={{ ...MONO, fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                  {node.runs} ejecuciones totales
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom legend */}
      <div style={{
        padding: '10px 20px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexShrink: 0,
        background: 'var(--panel)',
      }}>
        {[
          { color: '#7c3aed', label: 'Agente Scraper — extrae negocios de Google Maps' },
          { color: '#0ea5e9', label: 'Agente Contacto — envía mensajes por WhatsApp' },
          { color: '#f59e0b', label: 'Agente Web — genera landing pages automáticamente' },
        ].map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: item.color, flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
