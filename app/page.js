'use client'
import { useEffect, useState, useCallback } from 'react'
import MetricCard from '@/components/MetricCard'
import { Icon } from '@/components/Icons'

const STATUS_META = {
  nuevo:      { color: 'var(--blue)',   bg: 'var(--blue-dim)',   label: 'Nuevo' },
  contactado: { color: 'var(--orange)', bg: 'var(--orange-dim)', label: 'Contactado' },
  respondido: { color: 'var(--accent)', bg: 'var(--accent-dim)', label: 'Respondido' },
  convertido: { color: 'var(--green)',  bg: 'var(--green-dim)',  label: 'Convertido' },
  rechazado:  { color: 'var(--red)',    bg: 'var(--red-dim)',    label: 'Rechazado' },
  pendiente:  { color: 'var(--text-muted)', bg: 'var(--surface)', label: 'Pendiente' },
}

function fmtMoney(n) {
  return '€' + Number(n).toLocaleString('es-ES', { minimumFractionDigits: 0 })
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function todayLabel() {
  return new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// Plain-div bar chart — no recharts
function StatusBarChart({ statusCounts }) {
  const entries = Object.entries(statusCounts || {}).sort((a, b) => b[1] - a[1])
  if (entries.length === 0) return (
    <div style={{ color: 'var(--text-dim)', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
      Sin datos todavía
    </div>
  )
  const max = Math.max(...entries.map(([, v]) => v), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {entries.map(([status, count]) => {
        const meta = STATUS_META[status] || { color: 'var(--accent)', bg: 'var(--accent-dim)', label: status }
        const pct = Math.max(4, (count / max) * 100)
        return (
          <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '86px', flexShrink: 0, fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', textAlign: 'right' }}>
              {meta.label}
            </div>
            <div style={{ flex: 1, background: 'var(--surface)', borderRadius: '100px', height: '10px', overflow: 'hidden' }}>
              <div style={{
                width: pct + '%',
                height: '100%',
                background: meta.color,
                borderRadius: '100px',
                transition: 'width .5s ease',
              }} />
            </div>
            <div style={{ width: '32px', flexShrink: 0, fontSize: '12px', fontWeight: 600, color: 'var(--text)', textAlign: 'right' }}>
              {count}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// WhatsApp line status indicator
function LineStatusBadge({ connected }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '12px', fontWeight: 500, padding: '3px 9px',
      borderRadius: '100px',
      background: connected ? 'var(--green-dim)' : 'var(--red-dim)',
      color: connected ? 'var(--green)' : 'var(--red)',
    }}>
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%',
        background: connected ? 'var(--green)' : 'var(--red)',
        display: 'inline-block',
        boxShadow: connected ? '0 0 0 2px rgba(5,150,105,.25)' : 'none',
      }} />
      {connected ? 'Conectada' : 'Desconectada'}
    </span>
  )
}

// Skeleton shimmer for loading state
function Skeleton({ width = '100%', height = '20px', radius = '6px' }) {
  return (
    <div style={{
      width, height, borderRadius: radius,
      background: 'linear-gradient(90deg, var(--surface) 25%, var(--border-light) 50%, var(--surface) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }} />
  )
}

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard-stats')
      if (!res.ok) throw new Error('Error ' + res.status)
      const json = await res.json()
      setData(json)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(() => load(true), 30000)
    return () => clearInterval(interval)
  }, [load])

  const v = (val, suffix = '') => loading ? <Skeleton width="60px" height="28px" radius="4px" /> : (val ?? '—') + suffix

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{ padding: '28px 32px', maxWidth: '1400px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.4px' }}>
              Dashboard
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'capitalize' }}>
              {todayLabel()}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {lastUpdated && (
              <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                Actualizado {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => load(true)}
              disabled={refreshing}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '7px 13px', borderRadius: '7px', fontSize: '13px', fontWeight: 500,
                background: 'var(--panel)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', cursor: refreshing ? 'wait' : 'pointer',
                boxShadow: 'var(--shadow)',
              }}
            >
              <span className={refreshing ? 'spin' : ''} style={{ display: 'flex' }}>
                <Icon name="refresh" size={13} />
              </span>
              Actualizar
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            background: 'var(--red-dim)', border: '1px solid var(--red)',
            borderRadius: 'var(--radius)', padding: '12px 16px',
            color: 'var(--red)', fontSize: '14px', marginBottom: '24px',
          }}>
            <Icon name="alert" size={16} color="var(--red)" />
            No se pudieron cargar los datos: {error}
          </div>
        )}

        {/* Metric cards — 4 per row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '14px',
          marginBottom: '24px',
        }}>
          <MetricCard
            label="Total leads contactados"
            value={loading ? '…' : data?.leadsContactados ?? 0}
            color="orange"
            icon={<Icon name="send" size={14} color="var(--orange)" />}
            delta={loading ? null : `de ${data?.totalLeads ?? 0} leads totales`}
          />
          <MetricCard
            label="Respuestas recibidas"
            value={loading ? '…' : data?.leadsRespondieron ?? 0}
            color="blue"
            icon={<Icon name="conversations" size={14} color="var(--blue)" />}
            delta={loading ? null : `Tasa ${data?.tasaRespuesta ?? 0}%`}
          />
          <MetricCard
            label="Conversiones este mes"
            value={loading ? '…' : data?.conversionesMes ?? 0}
            color="green"
            icon={<Icon name="check" size={14} color="var(--green)" />}
          />
          <MetricCard
            label="Ingresos este mes"
            value={loading ? '…' : fmtMoney(data?.ingresosMes ?? 0)}
            color="green"
            icon={<Icon name="revenue" size={14} color="var(--green)" />}
          />
          <MetricCard
            label="Tasa de respuesta"
            value={loading ? '…' : (data?.tasaRespuesta ?? 0) + '%'}
            color="blue"
            icon={<Icon name="trending" size={14} color="var(--blue)" />}
          />
          <MetricCard
            label="Tasa de conversion"
            value={loading ? '…' : (data?.tasaConversion ?? 0) + '%'}
            color="accent"
            icon={<Icon name="trending" size={14} color="var(--accent)" />}
          />
          <MetricCard
            label="Mensajes enviados hoy"
            value={loading ? '…' : data?.mensajesHoy ?? 0}
            color="orange"
            icon={<Icon name="send" size={14} color="var(--orange)" />}
          />
          <MetricCard
            label="Follow-ups pendientes"
            value={loading ? '…' : data?.followupsPendientes ?? 0}
            color={!loading && (data?.followupsPendientes ?? 0) > 0 ? 'red' : 'accent'}
            icon={<Icon name="alert" size={14} color={!loading && (data?.followupsPendientes ?? 0) > 0 ? 'var(--red)' : 'var(--accent)'} />}
            delta={!loading && (data?.followupsPendientes ?? 0) > 0 ? 'Requieren atencion' : null}
          />
        </div>

        {/* Middle row: bar chart + recent conversions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '16px', marginBottom: '16px' }}>

          {/* Leads by status */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '24px',
            boxShadow: 'var(--shadow)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Leads por estado</span>
              <Icon name="pipeline" size={15} color="var(--text-dim)" />
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[80, 65, 50, 35, 20].map((w, i) => (
                  <Skeleton key={i} width="100%" height="10px" radius="100px" />
                ))}
              </div>
            ) : (
              <StatusBarChart statusCounts={data?.statusCounts} />
            )}
          </div>

          {/* Last 5 conversions */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '24px',
            boxShadow: 'var(--shadow)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Ultimas conversiones</span>
              <Icon name="revenue" size={15} color="var(--text-dim)" />
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[1,2,3,4,5].map(i => <Skeleton key={i} width="100%" height="36px" />)}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '320px' }}>
                  <thead>
                    <tr>
                      {['Lead', 'Importe', 'Fecha'].map(h => (
                        <th key={h} style={{
                          textAlign: 'left', padding: '8px 14px',
                          color: 'var(--text-muted)', fontSize: '11.5px',
                          fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em',
                          borderBottom: '1px solid var(--border)',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.ultimasConversiones || []).length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ padding: '32px 14px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '14px' }}>
                          Sin conversiones este mes
                        </td>
                      </tr>
                    ) : (data?.ultimasConversiones || []).map((c, i) => (
                      <tr key={i} style={{ transition: 'background .12s' }}>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-light)', color: 'var(--text)', fontSize: '14px', fontWeight: 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              background: 'var(--green-dim)', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}>
                              <Icon name="user" size={12} color="var(--green)" />
                            </span>
                            {c.leads?.name || '—'}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-light)', fontSize: '14px', fontWeight: 600, color: 'var(--green)' }}>
                          {c.amount != null ? fmtMoney(c.amount) : '—'}
                        </td>
                        <td style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-light)', color: 'var(--text-muted)', fontSize: '13px' }}>
                          {fmtDate(c.converted_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* WhatsApp lines status */}
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px',
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Lineas WhatsApp</span>
              {!loading && data?.whatsappLines?.length > 0 && (
                <span style={{
                  fontSize: '12px', fontWeight: 600, padding: '2px 8px',
                  borderRadius: '100px', background: 'var(--surface)', color: 'var(--text-muted)',
                }}>
                  {data.whatsappLines.filter(l => l.live_status === 'connected' || l.connected).length} / {data.whatsappLines.length} activas
                </span>
              )}
            </div>
            <Icon name="phone" size={15} color="var(--text-dim)" />
          </div>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
              {[1,2,3].map(i => <Skeleton key={i} width="100%" height="64px" radius="var(--radius-sm)" />)}
            </div>
          ) : (data?.whatsappLines || []).length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: '14px', textAlign: 'center', padding: '32px 0' }}>
              No hay lineas configuradas
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '10px' }}>
              {(data?.whatsappLines || []).map((line, i) => {
                const connected = line.live_status === 'connected' || line.connected
                return (
                  <div key={i} style={{
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 16px',
                    background: 'var(--surface)',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <div>
                      <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                        {line.label || line.instance_name}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                        {line.instance_name}
                      </div>
                    </div>
                    <LineStatusBadge connected={connected} />
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </>
  )
}
