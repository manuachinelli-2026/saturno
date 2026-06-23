'use client'
import { useEffect, useState, useCallback } from 'react'

// Product registry — single source of truth for labels + colors
const PRODUCTS = {
  agente_ia:     { label: 'Agente IA',       color: '#7c3aed' },
  bot:           { label: 'Bot WhatsApp',    color: '#2563eb' },
  pagina_web:    { label: 'Pagina Web',      color: '#d97706' },
  pack_completo: { label: 'Pack Completo',   color: '#059669' },
}

const DEFAULT_FORM = { lead_id: '', product: 'agente_ia', amount: '', notes: '' }

// Currency formatter: €X.XXX
function fmt(n) {
  if (n === null || n === undefined) return '—'
  return '€' + Number(n).toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Metric card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accentColor }) {
  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '22px 24px',
      boxShadow: 'var(--shadow)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* left accent stripe — each card gets its own color */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: '3px',
        background: accentColor || 'var(--accent)',
        borderRadius: '3px 0 0 3px',
      }} />
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--text-muted)',
        letterSpacing: '.07em',
        textTransform: 'uppercase',
        marginBottom: '12px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '30px',
        fontWeight: 700,
        color: 'var(--text)',
        lineHeight: 1,
        letterSpacing: '-0.03em',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '7px' }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ── Bar chart (pure CSS divs) ────────────────────────────────────────────────

function MonthlyChart({ monthly }) {
  const maxVal = Math.max(...monthly.map(m => m.total), 1)
  const BAR_MAX_H = 140 // px

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '24px 28px 18px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Evolucion mensual</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>Ultimos 6 meses</div>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 500 }}>
          {monthly.reduce((s, m) => s + m.count, 0)} conversiones totales
        </div>
      </div>

      {/* Bars row */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '10px',
        height: (BAR_MAX_H + 24) + 'px', // extra for amount labels above
        paddingTop: '24px',
        borderBottom: '1px solid var(--border)',
      }}>
        {monthly.map((m, i) => {
          const pct = m.total > 0 ? m.total / maxVal : 0
          const barH = Math.max(pct * BAR_MAX_H, m.total > 0 ? 4 : 0)
          const isCurrentMonth = i === monthly.length - 1

          return (
            <div
              key={i}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
            >
              {/* Amount label above bar — always occupies space to keep bars aligned */}
              <div style={{
                fontSize: '11px',
                fontWeight: 600,
                color: m.total > 0 ? (isCurrentMonth ? '#7c3aed' : 'var(--text-muted)') : 'transparent',
                marginBottom: '5px',
                whiteSpace: 'nowrap',
                userSelect: 'none',
              }}>
                {m.total > 0 ? fmt(m.total) : '·'}
              </div>

              {/* Bar itself */}
              <div
                title={`${m.month}: ${fmt(m.total)} — ${m.count} venta${m.count !== 1 ? 's' : ''}`}
                style={{
                  width: '100%',
                  height: barH > 0 ? barH + 'px' : '2px',
                  background: isCurrentMonth
                    ? 'linear-gradient(180deg, #7c3aed 0%, #a78bfa 100%)'
                    : m.total > 0
                      ? 'linear-gradient(180deg, rgba(124,58,237,0.45) 0%, rgba(124,58,237,0.18) 100%)'
                      : 'var(--border)',
                  borderRadius: '4px 4px 0 0',
                  cursor: 'default',
                }}
              />
            </div>
          )
        })}
      </div>

      {/* Month labels */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        {monthly.map((m, i) => (
          <div key={i} style={{
            flex: 1,
            textAlign: 'center',
            fontSize: '11px',
            fontWeight: i === monthly.length - 1 ? 700 : 400,
            color: i === monthly.length - 1 ? 'var(--text)' : 'var(--text-muted)',
            textTransform: 'capitalize',
          }}>
            {m.month}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Conversion table ─────────────────────────────────────────────────────────

function ConversionTable({ conversiones }) {
  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border-light)' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Historial de conversiones</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
          {conversiones.length} {conversiones.length === 1 ? 'registro' : 'registros'}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
          <thead>
            <tr style={{ background: 'var(--surface)' }}>
              {['Lead', 'Producto', 'Monto', 'Fecha', 'Notas'].map(h => (
                <th key={h} style={{
                  textAlign: 'left',
                  padding: '10px 16px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  letterSpacing: '.07em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {conversiones.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '56px 24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '14px' }}>
                  Todavia no hay conversiones. Registra la primera venta.
                </td>
              </tr>
            ) : conversiones.map((c, idx) => {
              const prod = PRODUCTS[c.product] || { label: c.product || '—', color: '#78716c' }
              return (
                <tr
                  key={c.id}
                  style={{ borderTop: '1px solid var(--border-light)', background: idx % 2 === 0 ? 'transparent' : 'var(--surface)' }}
                >
                  <td style={{ padding: '13px 16px', fontSize: '14px', fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap' }}>
                    {c.leads?.name || '—'}
                  </td>
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      borderRadius: '100px',
                      fontSize: '12px',
                      fontWeight: 600,
                      background: prod.color + '18',
                      color: prod.color,
                      whiteSpace: 'nowrap',
                    }}>
                      {prod.label}
                    </span>
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '15px', fontWeight: 700, color: 'var(--green)', whiteSpace: 'nowrap' }}>
                    {fmt(c.amount)}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {fmtDate(c.converted_at)}
                  </td>
                  <td style={{ padding: '13px 16px', fontSize: '13px', color: 'var(--text-muted)', maxWidth: '240px' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {c.notes || '—'}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────────────────────

function ConversionModal({ leads, onClose, onSaved }) {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function submit() {
    const amount = parseFloat(form.amount)
    if (!form.amount || isNaN(amount) || amount <= 0) {
      setErr('El monto debe ser un numero mayor que cero.')
      return
    }
    setSaving(true)
    setErr('')
    try {
      const res = await fetch('/api/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: form.lead_id || null,
          product: form.product,
          amount,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      if (data.error) { setErr(data.error); setSaving(false); return }
      onSaved()
    } catch {
      setErr('Error de red. Intenta de nuevo.')
      setSaving(false)
    }
  }

  const inputStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    color: 'var(--text)',
    padding: '10px 14px',
    fontSize: '14px',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: 'var(--text-muted)',
    marginBottom: '6px',
    letterSpacing: '.07em',
    textTransform: 'uppercase',
  }

  const canSave = form.amount && !saving

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Registrar conversion"
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(28,25,23,0.5)',
        backdropFilter: 'blur(3px)',
        zIndex: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '32px',
        width: '100%',
        maxWidth: '460px',
        boxShadow: 'var(--shadow-md)',
        animation: 'fadeIn 0.18s ease',
      }}>
        {/* Modal header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Registrar conversion</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>Registra una venta cerrada</div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '18px', cursor: 'pointer', padding: '2px 6px', borderRadius: '4px', lineHeight: 1 }}
          >
            x
          </button>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Lead</label>
            <select value={form.lead_id} onChange={e => set('lead_id', e.target.value)} style={inputStyle}>
              <option value="">Sin lead especifico</option>
              {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Producto *</label>
            <select value={form.product} onChange={e => set('product', e.target.value)} style={inputStyle}>
              {Object.entries(PRODUCTS).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Monto (EUR) *</label>
            <input
              type="number"
              min="1"
              placeholder="497"
              value={form.amount}
              onChange={e => set('amount', e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') submit() }}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Notas</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              placeholder="Detalles del acuerdo, condiciones..."
              style={{ ...inputStyle, resize: 'vertical', minHeight: '72px' }}
            />
          </div>

          {err && (
            <div style={{
              fontSize: '13px',
              color: 'var(--red)',
              background: 'var(--red-dim)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid rgba(220,38,38,0.2)',
            }}>
              {err}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              padding: '10px 18px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={!canSave}
            style={{
              background: canSave ? 'var(--accent)' : 'var(--border)',
              color: canSave ? '#fff' : 'var(--text-muted)',
              padding: '10px 22px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: canSave ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: '14px',
              transition: 'background 0.15s',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar venta'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function RevenuePage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/revenue')
      const json = await res.json()
      setData(json)
    } catch {
      // leave data as null — table shows empty state
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function handleSaved() {
    setShowModal(false)
    load()
  }

  const totalConv = data?.conversiones?.length ?? 0

  const metrics = [
    {
      label: 'Total ingresos',
      value: loading ? '...' : fmt(data?.totalIngresos ?? 0),
      sub: 'Facturacion acumulada',
      color: '#059669',
    },
    {
      label: 'Ingresos este mes',
      value: loading ? '...' : fmt(data?.ingresosMes ?? 0),
      sub: !loading && data ? `${data.conversionesMes} ${data.conversionesMes === 1 ? 'venta' : 'ventas'} en el mes` : '',
      color: '#7c3aed',
    },
    {
      label: 'Numero de conversiones',
      value: loading ? '...' : totalConv,
      sub: 'Total historico',
      color: '#2563eb',
    },
    {
      label: 'Ticket promedio',
      value: loading ? '...' : fmt(data?.ticketPromedio ?? 0),
      sub: 'Por venta cerrada',
      color: '#d97706',
    },
  ]

  return (
    <div style={{ padding: '32px', maxWidth: '1160px', margin: '0 auto' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.025em' }}>
            Ingresos
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '5px' }}>
            Control de conversiones y revenue
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            background: 'var(--accent)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            flexShrink: 0,
            boxShadow: '0 2px 8px rgba(124,58,237,0.25)',
            transition: 'background 0.15s',
          }}
        >
          Registrar conversion
        </button>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        {metrics.map(m => (
          <StatCard key={m.label} label={m.label} value={m.value} sub={m.sub} accentColor={m.color} />
        ))}
      </div>

      {/* Monthly bar chart */}
      <div style={{ marginBottom: '20px' }}>
        {loading ? (
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '56px 28px',
            textAlign: 'center',
            color: 'var(--text-dim)',
            fontSize: '14px',
          }}>
            Cargando datos...
          </div>
        ) : (
          <MonthlyChart monthly={data?.monthly || []} />
        )}
      </div>

      {/* Conversions table */}
      {loading ? (
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '56px 28px',
          textAlign: 'center',
          color: 'var(--text-dim)',
          fontSize: '14px',
        }}>
          Cargando conversiones...
        </div>
      ) : (
        <ConversionTable conversiones={data?.conversiones || []} />
      )}

      {/* Modal */}
      {showModal && (
        <ConversionModal
          leads={data?.leads || []}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
