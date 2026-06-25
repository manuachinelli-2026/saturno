'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const STATUSES = [
  { key: 'todos',       label: 'Todos',       color: null },
  { key: 'nuevo',       label: 'Nuevo',       color: '#3b82f6' },
  { key: 'contactado',  label: 'Contactado',  color: '#f59e0b' },
  { key: 'respondio',   label: 'Respondió',   color: '#8b5cf6' },
  { key: 'conversion',  label: 'Conversión',  color: '#10b981' },
]

const STATUS_COLORS = {
  nuevo:      { bg: 'rgba(59,130,246,.14)',  text: '#60a5fa' },
  contactado: { bg: 'rgba(245,158,11,.14)',  text: '#fbbf24' },
  respondio:  { bg: 'rgba(139,92,246,.14)',  text: '#a78bfa' },
  conversion: { bg: 'rgba(16,185,129,.14)',  text: '#34d399' },
}

const ALL_STATUSES = ['nuevo','contactado','respondio','conversion']

export default function LeadsPage() {
  const [leads, setLeads] = useState([])
  const [counts, setCounts] = useState({})
  const [activeStatus, setActiveStatus] = useState('todos')
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [openDropdown, setOpenDropdown] = useState(null)

  useEffect(() => { loadLeads() }, [activeStatus])

  async function loadLeads() {
    setLoading(true)
    let q = supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(300)
    if (activeStatus !== 'todos') q = q.eq('status', activeStatus)
    const { data } = await q
    const rows = data || []
    setLeads(rows)
    // recount from full set when on "todos"
    if (activeStatus === 'todos') {
      const c = { todos: rows.length }
      rows.forEach(r => { c[r.status] = (c[r.status] || 0) + 1 })
      setCounts(c)
    } else {
      // fetch counts separately
      loadCounts()
    }
    setLoading(false)
  }

  async function loadCounts() {
    const { data } = await supabase.from('leads').select('status')
    const c = { todos: data?.length || 0 }
    data?.forEach(r => { c[r.status] = (c[r.status] || 0) + 1 })
    setCounts(c)
  }

  async function updateStatus(id, newStatus) {
    await supabase.from('leads').update({ status: newStatus }).eq('id', id)
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status: newStatus } : l))
    loadCounts()
    setOpenDropdown(null)
  }

  const filtered = search
    ? leads.filter(l =>
        l.name?.toLowerCase().includes(search.toLowerCase()) ||
        l.phone?.includes(search) ||
        l.industry?.toLowerCase().includes(search.toLowerCase()) ||
        l.city?.toLowerCase().includes(search.toLowerCase())
      )
    : leads

  return (
    <div style={{ padding: '32px' }} onClick={() => setOpenDropdown(null)}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Leads</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
          Base de datos de leads y su estado en el pipeline
        </p>
      </div>

      {/* Status tabs + search */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {STATUSES.map(s => {
          const active = activeStatus === s.key
          return (
            <button
              key={s.key}
              onClick={() => setActiveStatus(s.key)}
              style={{
                padding: '7px 14px', borderRadius: '999px',
                border: active ? 'none' : '1px solid var(--border)',
                background: active ? (s.color || 'var(--accent)') : 'transparent',
                color: active ? '#fff' : 'var(--text-muted)',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all .15s',
              }}
            >
              {s.label}
              <span style={{
                background: active ? 'rgba(255,255,255,.25)' : 'var(--surface)',
                color: active ? '#fff' : 'var(--text-muted)',
                borderRadius: '999px', padding: '1px 7px', fontSize: '11px', fontWeight: 700,
              }}>
                {counts[s.key] ?? '…'}
              </span>
            </button>
          )
        })}
        <div style={{ marginLeft: 'auto' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar nombre, teléfono, industria…"
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)', color: 'var(--text)',
              padding: '8px 14px', fontSize: '13px', outline: 'none', width: '260px',
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            Cargando leads…
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
            {activeStatus !== 'todos' ? `No hay leads con estado "${activeStatus}"` : 'Aún no hay leads. Scrapea algunos primero.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface)' }}>
                  {['Nombre','Teléfono','Industria','Ciudad','Rating','Estado','Agregado'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '11px 16px',
                      color: 'var(--text-muted)', fontSize: '11px',
                      fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em',
                      borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(lead => {
                  const sc = STATUS_COLORS[lead.status] || { bg: 'var(--border)', text: 'var(--text-muted)' }
                  const nextStatuses = ALL_STATUSES.filter(s => s !== lead.status)
                  const isOpen = openDropdown === lead.id

                  return (
                    <tr key={lead.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ color: 'var(--text)', fontSize: '14px', fontWeight: 500 }}>{lead.name || '—'}</div>
                        {lead.website && (
                          <a href={lead.website} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none' }}
                            onClick={e => e.stopPropagation()}>
                            {lead.website.replace(/^https?:\/\//, '').split('/')[0]}
                          </a>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '13px', fontFamily: 'monospace' }}>
                        {lead.phone ? `+${lead.phone}` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        {lead.industry || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        {lead.city || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#fbbf24', fontSize: '13px', whiteSpace: 'nowrap' }}>
                        {lead.reviews_average ? `⭐ ${lead.reviews_average} (${lead.reviews_count || 0})` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}
                          onClick={e => { e.stopPropagation(); setOpenDropdown(isOpen ? null : lead.id) }}>
                          <button style={{
                            background: sc.bg, color: sc.text,
                            border: 'none', borderRadius: '999px',
                            padding: '3px 11px', fontSize: '12px', fontWeight: 600,
                            cursor: 'pointer', textTransform: 'capitalize', whiteSpace: 'nowrap',
                          }}>
                            {lead.status || 'nuevo'}
                          </button>
                          {isOpen && (
                            <div style={{
                              position: 'absolute', top: '100%', left: 0, zIndex: 50,
                              background: 'var(--panel)', border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-sm)', marginTop: '4px',
                              minWidth: '140px', boxShadow: '0 8px 24px rgba(0,0,0,.35)',
                            }}>
                              {nextStatuses.map(s => (
                                <button key={s}
                                  onClick={e => { e.stopPropagation(); updateStatus(lead.id, s) }}
                                  style={{
                                    display: 'block', width: '100%', textAlign: 'left',
                                    padding: '9px 14px', background: 'transparent',
                                    color: 'var(--text)', fontSize: '13px', border: 'none',
                                    cursor: 'pointer', textTransform: 'capitalize',
                                  }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                  → {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                        {lead.created_at
                          ? new Date(lead.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' })
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '12px' }}>
              {filtered.length} lead{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
