'use client'
import { useState, useEffect, useCallback } from 'react'
import { Icon } from '@/components/Icons'

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS = {
  activo:  { label: 'Activo',   bg: 'var(--green-dim)',  color: 'var(--green)'  },
  pausado: { label: 'Pausado',  bg: 'var(--orange-dim)', color: 'var(--orange)' },
  perdido: { label: 'Perdido',  bg: 'var(--red-dim)',    color: 'var(--red)'    },
}

const STATUS_OPTIONS = [
  { value: '',        label: 'Todos los estados' },
  { value: 'activo',  label: 'Activo'  },
  { value: 'pausado', label: 'Pausado' },
  { value: 'perdido', label: 'Perdido' },
]

const PRODUCTS = [
  { value: 'agente_ia',     label: 'Agente IA'      },
  { value: 'bot',           label: 'Bot WhatsApp'   },
  { value: 'pagina_web',    label: 'Página Web'     },
  { value: 'pack_completo', label: 'Pack Completo'  },
  { value: 'otro',          label: 'Otro'           },
]

const EMPTY_FORM = {
  name: '', phone: '', email: '', company: '',
  product_purchased: 'agente_ia', amount_paid: '',
  start_date: '', notes: '', status: 'activo',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtMoney(n) {
  if (!n && n !== 0) return '—'
  return '€' + Number(n).toLocaleString('es-ES', { minimumFractionDigits: 0 })
}

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isThisMonth(d) {
  if (!d) return false
  const now = new Date()
  const dt  = new Date(d)
  return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth()
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = STATUS[status] || { label: status, bg: 'var(--surface)', color: 'var(--text-muted)' }
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px',
      borderRadius: '100px',
      fontSize: '12px',
      fontWeight: 600,
      background: s.bg,
      color: s.color,
      letterSpacing: '0.01em',
      whiteSpace: 'nowrap',
    }}>
      {s.label}
    </span>
  )
}

function InputField({ label, required, children }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '6px',
      }}>
        {label}{required && <span style={{ color: 'var(--red)', marginLeft: '3px' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const INPUT_STYLE = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text)',
  padding: '10px 14px',
  fontSize: '14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '20px 24px',
      boxShadow: 'var(--shadow)',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
    }}>
      <div style={{
        fontSize: '26px',
        fontWeight: 700,
        color: accent || 'var(--text)',
        lineHeight: 1.1,
        letterSpacing: '-0.5px',
      }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
    </div>
  )
}

// ─── Expanded row ─────────────────────────────────────────────────────────────
function ExpandedRow({ client, onStatusChange, onDelete, colSpan }) {
  const [deleting, setDeleting] = useState(false)
  const lead = client.leads || {}

  async function handleStatus(newStatus) {
    await fetch(`/api/clients/${client.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    onStatusChange(client.id, newStatus)
  }

  async function handleDelete() {
    if (!confirm(`Eliminar a ${client.name}? Esta acción no se puede deshacer.`)) return
    setDeleting(true)
    await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
    onDelete(client.id)
  }

  return (
    <tr>
      <td colSpan={colSpan} style={{ padding: 0 }}>
        <div style={{
          background: 'var(--bg)',
          borderLeft: '3px solid var(--accent)',
          borderBottom: '1px solid var(--border)',
          padding: '20px 24px 20px 28px',
          animation: 'expandRow 0.18s ease',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '24px', alignItems: 'start' }}>
            {/* Contact */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Contacto
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {client.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <Icon name="phone" size={13} color="var(--text-dim)" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
                    <Icon name="send" size={13} color="var(--text-dim)" />
                    <span>{client.email}</span>
                  </div>
                )}
                {!client.phone && !client.email && (
                  <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Sin datos de contacto</span>
                )}
              </div>
            </div>

            {/* Lead origin */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Lead de origen
              </div>
              {lead.name ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{lead.name}</div>
                  {(lead.industry || lead.city) && (
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {[lead.industry, lead.city].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              ) : (
                <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Sin lead asociado</span>
              )}
            </div>

            {/* Notes */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Notas
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                {client.notes || <span style={{ color: 'var(--text-dim)' }}>Sin notas</span>}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end', minWidth: '120px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px', alignSelf: 'flex-end' }}>
                Estado
              </div>
              {Object.entries(STATUS).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => handleStatus(key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: client.status === key ? `1px solid ${cfg.color}` : '1px solid var(--border)',
                    background: client.status === key ? cfg.bg : 'transparent',
                    color: client.status === key ? cfg.color : 'var(--text-muted)',
                    fontSize: '12px',
                    fontWeight: client.status === key ? 700 : 400,
                    cursor: 'pointer',
                    width: '100%',
                    transition: 'all 0.12s',
                  }}
                >
                  {cfg.label}
                </button>
              ))}
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  marginTop: '4px',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--red)',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  width: '100%',
                  opacity: deleting ? 0.5 : 1,
                }}
              >
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      </td>
    </tr>
  )
}

// ─── New client modal ─────────────────────────────────────────────────────────
function NewClientModal({ onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleSave() {
    if (!form.name.trim()) { setError('El nombre es obligatorio.'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:              form.name.trim(),
        phone:             form.phone.trim() || null,
        email:             form.email.trim() || null,
        company:           form.company.trim() || null,
        product_purchased: form.product_purchased || null,
        amount_paid:       form.amount_paid ? parseFloat(form.amount_paid) : null,
        start_date:        form.start_date || null,
        notes:             form.notes.trim() || null,
        status:            form.status,
      }),
    })
    const data = await res.json()
    setSaving(false)
    if (data.error) { setError(data.error); return }
    onSaved(data.client)
  }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(28,25,23,0.65)',
        zIndex: 400,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '32px',
        width: '100%',
        maxWidth: '560px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: 'var(--shadow-md)',
        animation: 'fadeIn 0.18s ease',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>Nuevo cliente</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>
              Registrar un cliente convertido manualmente
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}
            aria-label="Cerrar"
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Form grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <InputField label="Nombre" required>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Peluquería Marta"
                style={INPUT_STYLE}
                autoFocus
              />
            </InputField>
          </div>

          <InputField label="Teléfono">
            <input
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="+34 612 345 678"
              style={INPUT_STYLE}
            />
          </InputField>

          <InputField label="Email">
            <input
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="hola@empresa.com"
              style={INPUT_STYLE}
            />
          </InputField>

          <InputField label="Empresa">
            <input
              value={form.company}
              onChange={e => set('company', e.target.value)}
              placeholder="Nombre del negocio"
              style={INPUT_STYLE}
            />
          </InputField>

          <InputField label="Estado">
            <select value={form.status} onChange={e => set('status', e.target.value)} style={INPUT_STYLE}>
              <option value="activo">Activo</option>
              <option value="pausado">Pausado</option>
              <option value="perdido">Perdido</option>
            </select>
          </InputField>

          <InputField label="Producto contratado">
            <select value={form.product_purchased} onChange={e => set('product_purchased', e.target.value)} style={INPUT_STYLE}>
              {PRODUCTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </InputField>

          <InputField label="Monto pagado (€)">
            <input
              type="number"
              min="0"
              value={form.amount_paid}
              onChange={e => set('amount_paid', e.target.value)}
              placeholder="497"
              style={INPUT_STYLE}
            />
          </InputField>

          <div style={{ gridColumn: '1 / -1' }}>
            <InputField label="Fecha de inicio">
              <input
                type="date"
                value={form.start_date}
                onChange={e => set('start_date', e.target.value)}
                style={INPUT_STYLE}
              />
            </InputField>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <InputField label="Notas">
              <textarea
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={3}
                placeholder="Contexto relevante sobre este cliente…"
                style={{ ...INPUT_STYLE, resize: 'vertical', lineHeight: '1.5' }}
              />
            </InputField>
          </div>
        </div>

        {error && (
          <div style={{
            marginTop: '16px',
            padding: '10px 14px',
            background: 'var(--red-dim)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--red)',
            fontSize: '13px',
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: 'var(--text-muted)',
              padding: '10px 20px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name.trim()}
            style={{
              background: form.name.trim() ? 'var(--accent)' : 'var(--border)',
              color: '#fff',
              padding: '10px 24px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: form.name.trim() && !saving ? 'pointer' : 'not-allowed',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {saving ? 'Guardando…' : 'Guardar cliente'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const [clients, setClients]       = useState([])
  const [loading, setLoading]       = useState(true)
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatus]   = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [showModal, setShowModal]   = useState(false)

  const fetchClients = useCallback(async (q, s) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (s) params.set('status', s)
    const res  = await fetch(`/api/clients?${params}`)
    const data = await res.json()
    setClients(data.clients || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => fetchClients(search, statusFilter), 250)
    return () => clearTimeout(t)
  }, [search, statusFilter, fetchClients])

  // ── Derived stats ──
  const total    = clients.length
  const revenue  = clients.reduce((s, c) => s + (Number(c.amount_paid) || 0), 0)
  const newMonth = clients.filter(c => isThisMonth(c.created_at)).length
  const avg      = total > 0 ? revenue / total : 0

  function handleStatusChange(id, newStatus) {
    setClients(cs => cs.map(c => c.id === id ? { ...c, status: newStatus } : c))
  }

  function handleDelete(id) {
    setClients(cs => cs.filter(c => c.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  function handleSaved(client) {
    setClients(cs => [client, ...cs])
    setShowModal(false)
    setExpandedId(client.id)
  }

  const COLS = ['Nombre', 'Empresa', 'Producto', 'Monto', 'Estado', 'Fecha', '']

  const productLabel = v => PRODUCTS.find(p => p.value === v)?.label || v || '—'

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes expandRow {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div style={{ padding: '32px', maxWidth: '1200px' }}>

        {/* ── Page header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.3px' }}>
              Clientes
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '5px' }}>
              Clientes convertidos y activos
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              background: 'var(--accent)',
              color: '#fff',
              padding: '10px 18px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            <Icon name="plus" size={14} color="#fff" />
            Nuevo cliente
          </button>
        </div>

        {/* ── Stats row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '28px' }}>
          <StatCard label="Total clientes"      value={loading ? '…' : total}              accent="var(--text)"    />
          <StatCard label="Ingresos totales"     value={loading ? '…' : fmtMoney(revenue)}  accent="var(--green)"   />
          <StatCard label="Nuevos este mes"      value={loading ? '…' : newMonth}           accent="var(--accent)"  />
          <StatCard label="Valor promedio"       value={loading || !total ? '—' : fmtMoney(avg)} accent="var(--blue)"  />
        </div>

        {/* ── Filters bar ── */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '16px',
          alignItems: 'center',
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 260px', maxWidth: '340px' }}>
            <span style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
              <Icon name="scraper" size={14} color="var(--text-dim)" />
            </span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, empresa o teléfono…"
              style={{
                ...INPUT_STYLE,
                paddingLeft: '34px',
                width: '100%',
              }}
            />
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatus(e.target.value)}
            style={{ ...INPUT_STYLE, width: 'auto', paddingRight: '32px', cursor: 'pointer', flexShrink: 0 }}
          >
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* ── Table ── */}
        <div style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {COLS.map((h, i) => (
                    <th
                      key={i}
                      style={{
                        textAlign: 'left',
                        padding: '11px 16px',
                        color: 'var(--text-muted)',
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        whiteSpace: 'nowrap',
                        background: 'var(--surface)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={COLS.length} style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '14px' }}>
                      Cargando clientes…
                    </td>
                  </tr>
                )}

                {!loading && clients.length === 0 && (
                  <tr>
                    <td colSpan={COLS.length} style={{ padding: '52px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                        <Icon name="clients" size={28} color="var(--text-dim)" />
                        <div style={{ color: 'var(--text-dim)', fontSize: '14px' }}>
                          {search || statusFilter ? 'Ningún cliente coincide con los filtros.' : 'Aún no hay clientes. Agrega el primero.'}
                        </div>
                        {!search && !statusFilter && (
                          <button
                            onClick={() => setShowModal(true)}
                            style={{
                              marginTop: '6px',
                              background: 'var(--accent-dim)',
                              color: 'var(--accent)',
                              border: '1px solid transparent',
                              padding: '8px 18px',
                              borderRadius: 'var(--radius-sm)',
                              cursor: 'pointer',
                              fontSize: '13px',
                              fontWeight: 600,
                            }}
                          >
                            Nuevo cliente
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && clients.map(client => {
                  const isExpanded = expandedId === client.id
                  return (
                    <>
                      <tr
                        key={client.id}
                        onClick={() => setExpandedId(isExpanded ? null : client.id)}
                        style={{
                          cursor: 'pointer',
                          borderBottom: isExpanded ? 'none' : '1px solid var(--border-light)',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = isExpanded ? 'var(--surface)' : '' }}
                      >
                        {/* Nombre */}
                        <td style={{ padding: '14px 16px', color: 'var(--text)', fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '30px', height: '30px', borderRadius: '50%',
                              background: 'var(--accent-dim)',
                              color: 'var(--accent)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '12px', fontWeight: 700, flexShrink: 0,
                            }}>
                              {(client.name || '?').charAt(0).toUpperCase()}
                            </div>
                            <span>{client.name}</span>
                          </div>
                        </td>

                        {/* Empresa */}
                        <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '13px', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {client.company || <span style={{ color: 'var(--text-dim)' }}>—</span>}
                        </td>

                        {/* Producto */}
                        <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '100px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: 'var(--accent-dim)',
                            color: 'var(--accent)',
                          }}>
                            {productLabel(client.product_purchased)}
                          </span>
                        </td>

                        {/* Monto */}
                        <td style={{ padding: '14px 16px', color: 'var(--green)', fontSize: '15px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          {fmtMoney(client.amount_paid)}
                        </td>

                        {/* Estado */}
                        <td style={{ padding: '14px 16px' }}>
                          <StatusBadge status={client.status} />
                        </td>

                        {/* Fecha */}
                        <td style={{ padding: '14px 16px', color: 'var(--text-dim)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                          {fmtDate(client.start_date || client.created_at)}
                        </td>

                        {/* Expand toggle */}
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <span style={{
                            display: 'inline-flex',
                            color: 'var(--text-dim)',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            transition: 'transform 0.15s',
                          }}>
                            <Icon name="trending" size={14} style={{ transform: 'rotate(90deg)' }} />
                          </span>
                        </td>
                      </tr>

                      {isExpanded && (
                        <ExpandedRow
                          key={`exp-${client.id}`}
                          client={client}
                          onStatusChange={handleStatusChange}
                          onDelete={handleDelete}
                          colSpan={COLS.length}
                        />
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && clients.length > 0 && (
            <div style={{
              padding: '10px 16px',
              borderTop: '1px solid var(--border)',
              background: 'var(--surface)',
              fontSize: '12px',
              color: 'var(--text-dim)',
            }}>
              {clients.length} {clients.length === 1 ? 'cliente' : 'clientes'}
              {(search || statusFilter) ? ' encontrados' : ' en total'}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <NewClientModal
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </>
  )
}
