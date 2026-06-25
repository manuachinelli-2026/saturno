'use client'
import { useState, useRef } from 'react'

const MONO = { fontFamily: "'JetBrains Mono', monospace" }
const NODE_W = 215
const NODE_H = 92
const PORT_R = 7
const INNER_PAD = 40

const INITIAL_NODES = [
  {
    id: 'trigger',
    label: 'Pipeline Trigger',
    sublabel: 'Manual / Cron',
    icon: '▶',
    color: '#22c55e',
    border: 'rgba(34,197,94,0.55)',
    glow: 'rgba(34,197,94,0.13)',
    x: 60,
    y: 260,
    status: 'idle',
    stat: '47 ejecuciones totales',
  },
  {
    id: 'scraper',
    label: 'Agente Scraper',
    sublabel: 'Google Maps → Leads',
    icon: '🔍',
    color: '#a78bfa',
    border: 'rgba(167,139,250,0.6)',
    glow: 'rgba(124,58,237,0.14)',
    x: 370,
    y: 70,
    status: 'active',
    stat: '1.2k leads · 25/min',
  },
  {
    id: 'contact',
    label: 'Agente Contacto',
    sublabel: 'WhatsApp Outreach',
    icon: '💬',
    color: '#38bdf8',
    border: 'rgba(56,189,248,0.55)',
    glow: 'rgba(14,165,233,0.13)',
    x: 370,
    y: 260,
    status: 'active',
    stat: '847 msgs · 3 líneas',
  },
  {
    id: 'webpages',
    label: 'Agente Web',
    sublabel: 'Crea landing pages',
    icon: '🌐',
    color: '#fbbf24',
    border: 'rgba(251,191,36,0.55)',
    glow: 'rgba(245,158,11,0.13)',
    x: 370,
    y: 450,
    status: 'active',
    stat: '12 páginas · Vercel',
  },
  {
    id: 'output',
    label: 'Conversiones',
    sublabel: 'CRM · Revenue',
    icon: '★',
    color: '#34d399',
    border: 'rgba(52,211,153,0.55)',
    glow: 'rgba(16,185,129,0.13)',
    x: 680,
    y: 260,
    status: 'active',
    stat: '€211 · 2 deals cerrados',
  },
]

const INITIAL_EDGES = [
  { id: 'e1', from: 'trigger', to: 'scraper' },
  { id: 'e2', from: 'trigger', to: 'contact' },
  { id: 'e3', from: 'trigger', to: 'webpages' },
  { id: 'e4', from: 'scraper', to: 'output' },
  { id: 'e5', from: 'contact', to: 'output' },
  { id: 'e6', from: 'webpages', to: 'output' },
]

function outPort(node) {
  return { x: node.x + NODE_W, y: node.y + NODE_H / 2 }
}
function inPort(node) {
  return { x: node.x, y: node.y + NODE_H / 2 }
}
function curve(x1, y1, x2, y2) {
  const d = Math.max(60, Math.abs(x2 - x1) * 0.5)
  return `M ${x1} ${y1} C ${x1 + d} ${y1} ${x2 - d} ${y2} ${x2} ${y2}`
}

export default function WorkflowPage() {
  const [nodes, setNodes] = useState(INITIAL_NODES)
  const [edges, setEdges] = useState(INITIAL_EDGES)
  const [dragging, setDragging] = useState(null)
  const [conn, setConn] = useState(null)
  const [selEdge, setSelEdge] = useState(null)
  const canvasRef = useRef(null)
  const edgeCtr = useRef(20)

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))

  function innerXY(e) {
    const r = canvasRef.current.getBoundingClientRect()
    return {
      x: e.clientX - r.left + canvasRef.current.scrollLeft - INNER_PAD,
      y: e.clientY - r.top + canvasRef.current.scrollTop - INNER_PAD,
    }
  }

  function onNodeDown(e, nodeId) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    const { x, y } = innerXY(e)
    const node = nodeMap[nodeId]
    setDragging({ nodeId, ox: x - node.x, oy: y - node.y })
    setSelEdge(null)
  }

  function onOutPortDown(e, nodeId) {
    e.preventDefault()
    e.stopPropagation()
    const { x, y } = innerXY(e)
    setConn({ fromId: nodeId, x, y })
    setDragging(null)
  }

  function onInPortUp(e, nodeId) {
    if (!conn || conn.fromId === nodeId) return
    e.stopPropagation()
    const exists = edges.some(ed => ed.from === conn.fromId && ed.to === nodeId)
    if (!exists) {
      edgeCtr.current++
      setEdges(p => [...p, { id: `e${edgeCtr.current}`, from: conn.fromId, to: nodeId }])
    }
    setConn(null)
  }

  function onMouseMove(e) {
    if (!dragging && !conn) return
    const { x, y } = innerXY(e)
    if (dragging) {
      setNodes(p => p.map(n =>
        n.id === dragging.nodeId ? { ...n, x: x - dragging.ox, y: y - dragging.oy } : n
      ))
    }
    if (conn) setConn(p => ({ ...p, x, y }))
  }

  function onMouseUp() {
    setDragging(null)
    setConn(null)
  }

  return (
    <div style={{
      height: 'calc(100vh - var(--topnav-height))',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', userSelect: 'none',
    }}>
      <style>{`
        @keyframes flowDash { to { stroke-dashoffset: -18; } }
        @keyframes glow { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>

      {/* Toolbar */}
      <div style={{
        padding: '10px 20px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--panel)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginRight: '14px' }}>⚡ Workflow</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Arrastrá nodos · Puerto derecho <span style={{ color: '#7c3aed' }}>●</span> para conectar · Click en flecha para seleccionar
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ ...MONO, fontSize: '10px', color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '4px', padding: '3px 8px' }}>
            ● ACTIVO
          </span>
          {selEdge && (
            <button
              onClick={() => { setEdges(p => p.filter(e => e.id !== selEdge)); setSelEdge(null) }}
              style={{ ...MONO, fontSize: '10px', color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: '4px', padding: '3px 10px', cursor: 'pointer' }}
            >
              ✕ Borrar conexión
            </button>
          )}
          <button
            onClick={() => { setNodes(INITIAL_NODES); setEdges(INITIAL_EDGES); setSelEdge(null) }}
            style={{ ...MONO, fontSize: '10px', color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '3px 10px', cursor: 'pointer' }}
          >
            ↺ Reset
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onClick={() => setSelEdge(null)}
        style={{
          flex: 1, overflow: 'auto', position: 'relative',
          cursor: dragging ? 'grabbing' : conn ? 'crosshair' : 'default',
          background: 'var(--bg)',
        }}
      >
        {/* Dot grid */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
          <defs>
            <pattern id="wf-grid" x="0" y="0" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="1.5" cy="1.5" r="1.5" fill="var(--border)" opacity="0.4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#wf-grid)" />
        </svg>

        {/* Inner workspace */}
        <div style={{ position: 'relative', width: '980px', minHeight: '660px', margin: `${INNER_PAD}px` }}>

          {/* Edges SVG */}
          <svg style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            overflow: 'visible', pointerEvents: 'none',
          }}>
            <defs>
              <marker id="wf-arrow" markerWidth="9" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0,9 3,0 6" fill="rgba(167,139,250,0.75)" />
              </marker>
              <marker id="wf-arrow-sel" markerWidth="9" markerHeight="6" refX="8" refY="3" orient="auto">
                <polygon points="0 0,9 3,0 6" fill="#f87171" />
              </marker>
            </defs>

            {edges.map(edge => {
              const fn = nodeMap[edge.from]
              const tn = nodeMap[edge.to]
              if (!fn || !tn) return null
              const p1 = outPort(fn)
              const p2 = inPort(tn)
              const sel = selEdge === edge.id
              const d = curve(p1.x, p1.y, p2.x, p2.y)
              return (
                <g key={edge.id}>
                  {/* Wide hit area */}
                  <path d={d} fill="none" stroke="transparent" strokeWidth="14"
                    style={{ cursor: 'pointer', pointerEvents: 'stroke' }}
                    onClick={e => { e.stopPropagation(); setSelEdge(sel ? null : edge.id) }}
                  />
                  {/* Glow halo when selected */}
                  {sel && (
                    <path d={d} fill="none" stroke="rgba(248,113,113,0.18)" strokeWidth="10"
                      style={{ pointerEvents: 'none' }} />
                  )}
                  {/* Main line */}
                  <path d={d} fill="none"
                    stroke={sel ? '#f87171' : 'rgba(167,139,250,0.6)'}
                    strokeWidth={sel ? 2.5 : 1.8}
                    strokeDasharray="6 3"
                    markerEnd={sel ? 'url(#wf-arrow-sel)' : 'url(#wf-arrow)'}
                    style={{
                      pointerEvents: 'none',
                      animation: sel ? 'none' : 'flowDash 0.7s linear infinite',
                    }}
                  />
                </g>
              )
            })}

            {/* Live connecting line */}
            {conn && (() => {
              const fn = nodeMap[conn.fromId]
              if (!fn) return null
              const p1 = outPort(fn)
              return (
                <path
                  d={curve(p1.x, p1.y, conn.x, conn.y)}
                  fill="none"
                  stroke="rgba(167,139,250,0.85)"
                  strokeWidth="1.8"
                  strokeDasharray="5 4"
                  style={{ pointerEvents: 'none', animation: 'flowDash 0.5s linear infinite' }}
                />
              )
            })()}
          </svg>

          {/* Nodes */}
          {nodes.map(node => (
            <div key={node.id} style={{
              position: 'absolute',
              left: node.x, top: node.y,
              width: NODE_W, height: NODE_H,
              zIndex: dragging?.nodeId === node.id ? 30 : 10,
            }}>
              {/* Input port */}
              <div
                onMouseUp={e => onInPortUp(e, node.id)}
                style={{
                  position: 'absolute',
                  left: -PORT_R, top: '50%',
                  width: PORT_R * 2, height: PORT_R * 2,
                  borderRadius: '50%',
                  background: conn ? 'rgba(167,139,250,0.7)' : 'var(--surface)',
                  border: `2px solid ${node.border}`,
                  cursor: conn ? 'copy' : 'default',
                  transform: conn ? 'translateY(-50%) scale(1.45)' : 'translateY(-50%)',
                  transition: 'transform .12s, background .12s',
                  zIndex: 5, pointerEvents: 'auto',
                }}
              />

              {/* Node card */}
              <div
                onMouseDown={e => onNodeDown(e, node.id)}
                style={{
                  width: '100%', height: '100%',
                  background: 'var(--panel)',
                  border: `1.5px solid ${node.border}`,
                  borderRadius: '12px',
                  padding: '13px 15px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  cursor: dragging?.nodeId === node.id ? 'grabbing' : 'grab',
                  boxShadow: `0 0 32px ${node.glow}, 0 4px 18px rgba(0,0,0,0.4)`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '33px', height: '33px', borderRadius: '8px',
                    background: node.glow,
                    border: `1.5px solid ${node.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '16px', flexShrink: 0,
                  }}>
                    {node.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.25, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {node.label}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {node.sublabel}
                    </div>
                  </div>
                  <div style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: node.status === 'active' ? '#10b981' : '#6b7280',
                    boxShadow: node.status === 'active' ? '0 0 8px rgba(16,185,129,0.9)' : 'none',
                    animation: node.status === 'active' ? 'glow 2.5s ease-in-out infinite' : 'none',
                    flexShrink: 0,
                  }} />
                </div>
                {node.stat && (
                  <div style={{ ...MONO, fontSize: '10px', color: node.color, marginTop: '4px', letterSpacing: '0.02em' }}>
                    {node.stat}
                  </div>
                )}
              </div>

              {/* Output port */}
              <div
                onMouseDown={e => onOutPortDown(e, node.id)}
                title="Arrastrá para conectar"
                style={{
                  position: 'absolute',
                  right: -PORT_R, top: '50%',
                  transform: 'translateY(-50%)',
                  width: PORT_R * 2, height: PORT_R * 2,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  border: '2px solid rgba(167,139,250,0.9)',
                  cursor: 'crosshair',
                  boxShadow: '0 0 10px rgba(124,58,237,0.6)',
                  zIndex: 5, pointerEvents: 'auto',
                  animation: 'glow 2s ease-in-out infinite',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '7px 20px',
        borderTop: '1px solid var(--border)',
        background: 'var(--panel)',
        display: 'flex', gap: '20px', alignItems: 'center',
        flexShrink: 0, fontSize: '11px', color: 'var(--text-muted)',
      }}>
        <span>Puerto izq = entrada &nbsp;·&nbsp; <span style={{ color: '#7c3aed' }}>●</span> Puerto der = salida, arrastrá para conectar</span>
        <span>Click en flecha para seleccionar · Toolbar → Borrar conexión</span>
        <span>Botón ↺ Reset para volver al estado inicial</span>
      </div>
    </div>
  )
}
