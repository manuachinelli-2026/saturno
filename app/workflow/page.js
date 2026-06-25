'use client'
import { useState, useRef, useEffect } from 'react'

const NW = 200
const NH = 78
const PORT = 7

const TYPES = {
  trigger: { color: '#60a5fa', bg: 'rgba(96,165,250,0.10)', tag: 'Trigger' },
  action:  { color: '#a06aff', bg: 'rgba(124,58,237,0.10)', tag: 'Acción' },
  delay:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', tag: 'Espera' },
  ai:      { color: '#23d18b', bg: 'rgba(35,209,139,0.10)', tag: 'IA' },
  end:     { color: '#f43f5e', bg: 'rgba(244,63,94,0.10)',  tag: 'Fin' },
  tool:    { color: '#e879f9', bg: 'rgba(232,121,249,0.10)', tag: 'Tool' },
}

let _id = 12
const uid = () => String(_id++)

const INIT_NODES = [
  { id:'1',  type:'trigger', icon:'📍', label:'Lead scrapeado',  x:60,   y:150 },
  { id:'2',  type:'action',  icon:'💬', label:'Mensaje inicial', x:330,  y:150 },
  { id:'3',  type:'delay',   icon:'⏱',  label:'Esperar 3 días',  x:600,  y:150 },
  { id:'4',  type:'action',  icon:'🔄', label:'Follow-up 1',     x:870,  y:150 },
  { id:'5',  type:'delay',   icon:'⏱',  label:'Esperar 7 días',  x:1140, y:150 },
  { id:'6',  type:'action',  icon:'🔄', label:'Follow-up 2',     x:1410, y:150 },
  { id:'7',  type:'ai',      icon:'🤖', label:'Agente IA',       x:600,  y:320 },
  { id:'8',  type:'end',     icon:'✅', label:'Conversión',      x:870,  y:320 },
  { id:'9',  type:'tool',    icon:'🔎', label:'WebAnalyser',     x:1140, y:320 },
  { id:'10', type:'tool',    icon:'🌐', label:'WebCreator',      x:1410, y:320 },
  { id:'11', type:'tool',    icon:'📦', label:'Collection',      x:1680, y:320 },
]

const INIT_EDGES = [
  { id:'e1',  s:'1',  t:'2'  },
  { id:'e2',  s:'2',  t:'3'  },
  { id:'e3',  s:'3',  t:'4'  },
  { id:'e4',  s:'4',  t:'5'  },
  { id:'e5',  s:'5',  t:'6'  },
  { id:'e6',  s:'2',  t:'7'  },
  { id:'e7',  s:'7',  t:'8'  },
  { id:'e8',  s:'8',  t:'9'  },
  { id:'e9',  s:'9',  t:'10' },
  { id:'e10', s:'10', t:'11' },
]

export default function WorkflowPage() {
  const [nodes, setNodes] = useState(INIT_NODES)
  const [edges, setEdges] = useState(INIT_EDGES)
  const [hovEdge, setHovEdge] = useState(null)
  const [connecting, setConnecting] = useState(null)
  const [editId, setEditId] = useState(null)
  const [editLabel, setEditLabel] = useState('')
  const dragRef = useRef(null)
  const hoverTimer = useRef(null)

  useEffect(() => {
    const onMove = (e) => {
      if (!dragRef.current) return
      const { id, sx, sy, ox, oy } = dragRef.current
      setNodes(prev => prev.map(n =>
        n.id === id ? { ...n, x: Math.max(0, ox + e.clientX - sx), y: Math.max(0, oy + e.clientY - sy) } : n
      ))
    }
    const onUp = () => { dragRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  function startDrag(e, node) {
    e.preventDefault()
    e.stopPropagation()
    if (connecting) { connectTo(node.id); return }
    dragRef.current = { id: node.id, sx: e.clientX, sy: e.clientY, ox: node.x, oy: node.y }
  }

  function startConnect(e, fromId) {
    e.preventDefault()
    e.stopPropagation()
    setConnecting(fromId)
  }

  function connectTo(toId) {
    if (!connecting || connecting === toId) { setConnecting(null); return }
    const exists = edges.some(e => e.s === connecting && e.t === toId)
    if (!exists) setEdges(prev => [...prev, { id: 'e' + uid(), s: connecting, t: toId }])
    setConnecting(null)
  }

  function deleteEdge(id) {
    setEdges(prev => prev.filter(e => e.id !== id))
  }

  function deleteNode(id) {
    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.s !== id && e.t !== id))
  }

  function addNode() {
    const maxX = nodes.length ? Math.max(...nodes.map(n => n.x)) : 0
    const ref = nodes.find(n => n.x === maxX) || { x: 60, y: 150 }
    setNodes(prev => [...prev, {
      id: uid(), type: 'action', icon: '⚡', label: 'Nuevo paso',
      x: ref.x + NW + 60, y: ref.y,
    }])
  }

  function startEdit(e, node) {
    e.stopPropagation()
    setEditId(node.id)
    setEditLabel(node.label)
  }

  function commitEdit() {
    setNodes(prev => prev.map(n => n.id === editId ? { ...n, label: editLabel } : n))
    setEditId(null)
  }

  function hoverEdge(id) {
    clearTimeout(hoverTimer.current)
    setHovEdge(id)
  }

  function unhoverEdge() {
    hoverTimer.current = setTimeout(() => setHovEdge(null), 80)
  }

  const cW = nodes.length ? Math.max(...nodes.map(n => n.x + NW + 120), 900) : 900
  const cH = nodes.length ? Math.max(...nodes.map(n => n.y + NH + 120), 500) : 500

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: 'calc(100vh - var(--topnav-height))',
      padding: '20px', boxSizing: 'border-box', gap: '12px',
    }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexShrink: 0 }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Workflow</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
            Arrastrá nodos · hover en cable para eliminar · puerto derecho para conectar · doble clic para renombrar
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {connecting && (
            <div style={{
              padding: '6px 12px', borderRadius: 'var(--radius-sm)',
              background: 'var(--orange-dim)', border: '1px solid var(--orange)',
              color: 'var(--orange)', fontSize: '12px', fontWeight: 600,
            }}>
              Clic en otro nodo para conectar — ESC para cancelar
            </div>
          )}
          <button
            onClick={() => { setNodes(INIT_NODES); setEdges(INIT_EDGES) }}
            style={{
              padding: '7px 14px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-muted)', fontSize: '12px', fontWeight: 500,
            }}
          >Resetear</button>
          <button
            onClick={addNode}
            style={{
              padding: '7px 14px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--accent)', background: 'var(--accent-dim)',
              color: 'var(--accent-bright)', fontSize: '12px', fontWeight: 600,
            }}
          >+ Agregar nodo</button>
        </div>
      </div>

      {/* Canvas */}
      <div
        style={{
          flex: 1, overflow: 'auto',
          background: 'var(--surface)', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', position: 'relative',
          cursor: connecting ? 'crosshair' : 'default',
        }}
        onClick={() => connecting && setConnecting(null)}
      >
        <div style={{ position: 'relative', width: cW, height: cH }}>

          {/* SVG edges */}
          <svg style={{ position: 'absolute', inset: 0, width: cW, height: cH, pointerEvents: 'none', overflow: 'visible' }}>
            <defs>
              <marker id="arr" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                <path d="M0,1 L5,3.5 L0,6 Z" fill="#2c2c4a" />
              </marker>
              <marker id="arr-h" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
                <path d="M0,1 L5,3.5 L0,6 Z" fill="#a06aff" />
              </marker>
            </defs>

            {edges.map(edge => {
              const src = nodes.find(n => n.id === edge.s)
              const tgt = nodes.find(n => n.id === edge.t)
              if (!src || !tgt) return null
              const sx = src.x + NW, sy = src.y + NH / 2
              const tx = tgt.x,      ty = tgt.y + NH / 2
              const cp = Math.max(50, Math.abs(tx - sx) * 0.42)
              const d = `M${sx} ${sy} C${sx+cp} ${sy},${tx-cp} ${ty},${tx} ${ty}`
              const mx = (sx + tx) / 2
              const my = (sy + ty) / 2
              const hov = hovEdge === edge.id
              return (
                <g key={edge.id}>
                  <path d={d} stroke="transparent" strokeWidth={18} fill="none"
                    style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                    onMouseEnter={() => hoverEdge(edge.id)}
                    onMouseLeave={unhoverEdge}
                  />
                  <path d={d}
                    stroke={hov ? '#a06aff' : '#1c1c32'}
                    strokeWidth={hov ? 2 : 1.5}
                    fill="none"
                    markerEnd={hov ? 'url(#arr-h)' : 'url(#arr)'}
                    style={{ pointerEvents: 'none', transition: 'stroke 0.12s, stroke-width 0.12s' }}
                  />
                  {hov && (
                    <g transform={`translate(${mx},${my})`}
                      style={{ pointerEvents: 'all', cursor: 'pointer' }}
                      onMouseEnter={() => hoverEdge(edge.id)}
                      onMouseLeave={unhoverEdge}
                      onClick={ev => { ev.stopPropagation(); deleteEdge(edge.id) }}
                    >
                      <circle r={9} fill="#0d0d1c" stroke="#f43f5e" strokeWidth={1.5} />
                      <text x={0} y={4} textAnchor="middle" fontSize={13} fontWeight={700} fill="#f43f5e" style={{ userSelect: 'none' }}>×</text>
                    </g>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const T = TYPES[node.type] || TYPES.action
            return (
              <div
                key={node.id}
                onMouseDown={e => startDrag(e, node)}
                onDoubleClick={e => startEdit(e, node)}
                style={{
                  position: 'absolute', left: node.x, top: node.y,
                  width: NW, height: NH,
                  background: T.bg, border: `1.5px solid ${T.color}88`,
                  borderRadius: 'var(--radius)', userSelect: 'none',
                  cursor: connecting ? 'pointer' : 'grab',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center',
                  padding: '10px 14px 10px 12px', boxSizing: 'border-box', zIndex: 10,
                  boxShadow: connecting ? `0 0 0 1.5px ${T.color}` : 'none',
                  transition: 'box-shadow 0.15s',
                }}
              >
                <div style={{ fontSize: '9px', fontWeight: 700, color: T.color, textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: '5px' }}>
                  {T.tag}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <span style={{ fontSize: '15px', flexShrink: 0 }}>{node.icon}</span>
                  {editId === node.id ? (
                    <input
                      autoFocus
                      value={editLabel}
                      onChange={e => setEditLabel(e.target.value)}
                      onBlur={commitEdit}
                      onKeyDown={e => e.key === 'Enter' && commitEdit()}
                      onClick={e => e.stopPropagation()}
                      style={{
                        flex: 1, background: 'transparent', border: 'none',
                        borderBottom: '1px solid var(--accent)',
                        color: 'var(--text)', fontSize: '13px', fontWeight: 600,
                        outline: 'none', padding: '0 2px', minWidth: 0,
                      }}
                    />
                  ) : (
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {node.label}
                    </span>
                  )}
                </div>

                <button
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); deleteNode(node.id) }}
                  style={{
                    position: 'absolute', top: 5, right: 6,
                    width: 18, height: 18, border: 'none',
                    background: 'transparent', color: 'var(--text-dim)',
                    fontSize: '14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: 3, padding: 0, lineHeight: 1,
                  }}
                >×</button>

                {/* Input port (left) */}
                <div
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); if (connecting) connectTo(node.id) }}
                  style={{
                    position: 'absolute', left: -(PORT), top: '50%', transform: 'translateY(-50%)',
                    width: PORT * 2, height: PORT * 2, borderRadius: '50%',
                    background: 'var(--surface)', border: `2px solid ${T.color}`,
                    cursor: connecting ? 'pointer' : 'default', zIndex: 20,
                  }}
                />

                {/* Output port (right) */}
                <div
                  onMouseDown={e => startConnect(e, node.id)}
                  style={{
                    position: 'absolute', right: -(PORT), top: '50%', transform: 'translateY(-50%)',
                    width: PORT * 2, height: PORT * 2, borderRadius: '50%',
                    background: T.color, border: '2px solid var(--surface)',
                    cursor: 'crosshair', zIndex: 20,
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
        {Object.entries(TYPES).map(([, T]) => (
          <div key={T.tag} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.color }} />
            {T.tag}
          </div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--text-dim)' }}>
          Arrastrá · hover cable para borrar · puerto derecho (●) para conectar · doble clic para renombrar
        </div>
      </div>
    </div>
  )
}
