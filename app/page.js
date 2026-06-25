'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

const MONO = { fontFamily: "'JetBrains Mono', monospace" }

function Num({ v, prefix = '', suffix = '' }) {
  return (
    <span style={{ ...MONO, fontSize: '28px', fontWeight: 500, letterSpacing: '-0.02em', color: 'var(--text)' }}>
      {prefix}{v ?? '—'}{suffix}
    </span>
  )
}

function Tile({ label, value, prefix, suffix, accent, delta }) {
  return (
    <div style={{
      background: 'var(--panel)',
      border: `1px solid ${accent ? 'rgba(124,58,237,0.3)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)',
      padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: '6px',
      boxShadow: accent ? '0 0 20px rgba(124,58,237,0.08)' : 'var(--shadow)',
    }}>
      <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <Num v={value} prefix={prefix} suffix={suffix} />
      {delta && (
        <span style={{ ...MONO, fontSize: '11px', color: 'var(--green)' }}>{delta}</span>
      )}
    </div>
  )
}

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)',
      letterSpacing: '0.12em', textTransform: 'uppercase',
      marginBottom: '10px', paddingBottom: '8px',
      borderBottom: '1px solid var(--border)',
    }}>
      {children}
    </div>
  )
}

function StatusDot({ ok, pulse }) {
  return (
    <span style={{
      width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
      background: ok ? 'var(--green)' : 'var(--red)',
      boxShadow: ok ? '0 0 7px rgba(35,209,139,0.7)' : 'none',
      display: 'inline-block',
      animation: ok && pulse ? 'pulse 2s ease-in-out infinite' : 'none',
    }} />
  )
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60) return `hace ${diff}s`
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
}

// ─── Pipeline Launcher widget ────────────────────────────────────────────────
function Launcher({ onLaunch }) {
  const [industry, setIndustry] = useState('')
  const [city, setCity]         = useState('')
  const [count, setCount]       = useState(20)
  const [running, setRunning]   = useState(false)
  const [log, setLog]           = useState([])
  const logRef                  = useRef(null)

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [log])

  async function launch() {
    if (!industry || !city || running) return
    setRunning(true)
    setLog([`[${new Date().toLocaleTimeString()}] Iniciando pipeline...`])

    try {
      const res = await fetch('/api/pipeline/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, city, count: parseInt(count) }),
      })
      const d = await res.json()
      if (d.success) {
        setLog(p => [...p,
          `[${new Date().toLocaleTimeString()}] Job ID: ${d.jobId}`,
          `[${new Date().toLocaleTimeString()}] Scraping en proceso...`,
          `[${new Date().toLocaleTimeString()}] Los mensajes se envian al finalizar`,
        ])
        if (onLaunch) onLaunch()
      } else {
        setLog(p => [...p, `[ERROR] ${d.error || 'Error desconocido'}`])
      }
    } catch (e) {
      setLog(p => [...p, `[ERROR] ${e.message}`])
    }
    setRunning(false)
  }

  const inp = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    padding: '8px 12px',
    fontSize: '13px',
    outline: 'none',
    width: '100%',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <SectionTitle>Lanzar pipeline</SectionTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
        <div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.04em' }}>INDUSTRIA</div>
          <input value={industry} onChange={e => setIndustry(e.target.value)}
            placeholder="peluquerías, clínicas, restaurantes..."
            style={inp} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.04em' }}>CIUDAD</div>
            <input value={city} onChange={e => setCity(e.target.value)}
              placeholder="Madrid" style={inp} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', letterSpacing: '0.04em' }}>CANTIDAD</div>
            <input type="number" value={count} onChange={e => setCount(e.target.value)}
              min={5} max={200} style={inp} />
          </div>
        </div>
      </div>

      <button onClick={launch} disabled={!industry || !city || running}
        style={{
          width: '100%', padding: '10px',
          background: running || !industry || !city ? 'var(--surface)' : 'var(--accent)',
          border: '1px solid',
          borderColor: running || !industry || !city ? 'var(--border)' : 'rgba(124,58,237,0.5)',
          borderRadius: 'var(--radius-sm)',
          color: running || !industry || !city ? 'var(--text-muted)' : '#fff',
          cursor: running || !industry || !city ? 'not-allowed' : 'pointer',
          fontWeight: 600, fontSize: '13px', letterSpacing: '0.05em',
          transition: 'all .15s',
          boxShadow: !running && industry && city ? '0 0 16px rgba(124,58,237,0.3)' : 'none',
          marginBottom: '10px',
        }}>
        {running ? 'LANZANDO...' : 'LANZAR PIPELINE'}
      </button>

      {/* Log */}
      <div ref={logRef} style={{
        flex: 1,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        padding: '10px 12px',
        overflowY: 'auto',
        minHeight: 0,
      }}>
        {log.length === 0 ? (
          <div style={{ ...MONO, fontSize: '12px', color: 'var(--text-dim)' }}>
            _ esperando instrucciones
          </div>
        ) : log.map((line, i) => (
          <div key={i} style={{ ...MONO, fontSize: '11px', color: line.startsWith('[ERROR]') ? 'var(--red)' : 'var(--green)', marginBottom: '3px', lineHeight: 1.4 }}>
            {line}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Activity Feed ────────────────────────────────────────────────────────────
function ActivityFeed({ feed, loading }) {
  const ICONS = {
    entrante: '←',
    saliente: '→',
    conversion: '★',
  }
  const COLORS = {
    entrante: 'var(--blue)',
    saliente: 'var(--text-muted)',
    conversion: 'var(--green)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <SectionTitle>Actividad en vivo</SectionTitle>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {loading && (
          <div style={{ ...MONO, fontSize: '12px', color: 'var(--text-dim)', padding: '8px 0' }}>cargando...</div>
        )}
        {!loading && feed.length === 0 && (
          <div style={{ ...MONO, fontSize: '12px', color: 'var(--text-dim)', padding: '8px 0' }}>sin actividad reciente</div>
        )}
        {feed.map((item, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'flex-start', gap: '8px',
            padding: '7px 10px', borderRadius: '5px',
            background: i === 0 ? 'rgba(124,58,237,0.05)' : 'transparent',
            border: i === 0 ? '1px solid rgba(124,58,237,0.1)' : '1px solid transparent',
            transition: 'background .1s',
          }}>
            <span style={{ ...MONO, fontSize: '13px', color: COLORS[item.direction] || 'var(--text-muted)', flexShrink: 0, marginTop: '1px' }}>
              {ICONS[item.direction] || '·'}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.lead_name || item.phone}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                {item.content}
              </div>
            </div>
            <span style={{ ...MONO, fontSize: '10px', color: 'var(--text-dim)', flexShrink: 0 }}>
              {timeAgo(item.created_at)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Lines Status ─────────────────────────────────────────────────────────────
function LinesPanel({ lines, loading }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <SectionTitle>Líneas WhatsApp</SectionTitle>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {loading && <div style={{ ...MONO, fontSize: '12px', color: 'var(--text-dim)' }}>cargando...</div>}
        {!loading && lines.length === 0 && (
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Sin líneas configuradas.{' '}
            <Link href="/lines" style={{ color: 'var(--accent-bright)' }}>Agregar</Link>
          </div>
        )}
        {lines.map((line, i) => {
          const connected = line.live_status === 'connected'
          const pct = Math.min(100, ((line.daily_sent || 0) / (line.daily_limit || 80)) * 100)
          return (
            <div key={i} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <StatusDot ok={connected} pulse={connected} />
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{line.label}</span>
                </div>
                <span style={{
                  ...MONO, fontSize: '10px',
                  color: connected ? 'var(--green)' : 'var(--red)',
                  letterSpacing: '0.06em',
                }}>
                  {connected ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              {/* Usage bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ flex: 1, height: '3px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: pct > 80 ? 'var(--orange)' : 'var(--accent)', borderRadius: '2px', transition: 'width .4s' }} />
                </div>
                <span style={{ ...MONO, fontSize: '10px', color: 'var(--text-muted)', flexShrink: 0 }}>
                  {line.daily_sent || 0}/{line.daily_limit || 80}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Pending followups */}
      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Follow-ups pendientes
        </div>
        <Link href="/agent" style={{
          display: 'block', textAlign: 'center',
          padding: '8px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '12px', color: 'var(--text-muted)',
          fontWeight: 500,
        }}>
          Ver en Agente →
        </Link>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ControlPage() {
  const [stats, setStats]   = useState(null)
  const [feed, setFeed]     = useState([])
  const [lines, setLines]   = useState([])
  const [loading, setLoading] = useState(true)

  async function loadAll() {
    try {
      const [statsRes, feedRes, linesRes] = await Promise.all([
        fetch('/api/dashboard-stats'),
        fetch('/api/activity'),
        fetch('/api/lines'),
      ])
      const [s, f, l] = await Promise.all([
        statsRes.json(),
        feedRes.ok ? feedRes.json() : { items: [] },
        linesRes.ok ? linesRes.json() : { lines: [] },
      ])
      setStats(s)
      setFeed(f.items || [])
      setLines(l.lines || [])
    } catch {
      // silently retry
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAll()
    const id = setInterval(loadAll, 20_000)
    return () => clearInterval(id)
  }, [])

  const TILES = [
    { label: 'Total leads', value: stats?.totalLeads, accent: false },
    { label: 'Contactados', value: stats?.leadsContactados, accent: false },
    { label: 'Respondieron', value: stats?.leadsRespondieron, accent: false },
    { label: 'Conversiones mes', value: stats?.conversionesMes, accent: true },
    { label: 'Ingresos mes', value: '€211', accent: false },
  ]

  return (
    <div style={{
      height: 'calc(100vh - var(--topnav-height))',
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
      gap: '12px',
      padding: '14px 16px',
      overflow: 'hidden',
    }}>

      {/* ── Metrics row ────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '10px',
      }}>
        {TILES.map((t, i) => (
          <div key={i} style={{
            background: 'var(--panel)',
            border: `1px solid ${t.accent ? 'rgba(124,58,237,0.35)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)',
            padding: '14px 16px',
            boxShadow: t.accent ? '0 0 18px rgba(124,58,237,0.1)' : 'var(--shadow)',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '0.10em', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>
              {t.label}
            </div>
            <div style={{ ...MONO, fontSize: '26px', fontWeight: 500, color: t.accent ? 'var(--accent-bright)' : 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {loading ? '…' : t.value ?? '0'}
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom 3-column grid ────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.4fr 0.9fr',
        gap: '12px',
        minHeight: 0,
      }}>

        {/* Launcher */}
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow)',
        }}>
          <Launcher onLaunch={loadAll} />
        </div>

        {/* Activity feed */}
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow)',
        }}>
          <ActivityFeed feed={feed} loading={loading} />
        </div>

        {/* Lines */}
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '16px',
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow)',
        }}>
          <LinesPanel lines={lines} loading={loading} />
        </div>

      </div>
    </div>
  )
}
