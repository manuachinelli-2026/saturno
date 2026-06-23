'use client'
import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

const INDUSTRIES = [
  'Peluquerías','Barberías','Restaurantes','Cafeterías','Gimnasios',
  'Clínicas dentales','Academias','Tiendas de ropa','Ferreterías','Otros',
]

export default function ScraperPage() {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('Madrid')
  const [total, setTotal] = useState(20)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, name: '' })
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(new Set())
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const esRef = useRef(null)

  async function startScrape() {
    if (!search) return
    setRunning(true)
    setResults([])
    setProgress({ current: 0, total, name: '' })
    setSaveMsg('')

    const res = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search: `${search} en ${city}`, total }),
    })
    const { job_id, error } = await res.json()
    if (error || !job_id) { setRunning(false); alert(error || 'Error al iniciar'); return }

    const es = new EventSource(`/api/stream/${job_id}`)
    esRef.current = es
    es.onmessage = (e) => {
      const d = JSON.parse(e.data)
      if (d.status === 'progress') {
        setProgress({ current: d.current || 0, total: d.total || total, name: d.current_name || '' })
      }
      if (d.status === 'complete' || d.status === 'done') {
        es.close()
        setRunning(false)
        loadResults(job_id)
      }
    }
    es.onerror = () => { es.close(); setRunning(false) }
  }

  async function loadResults(jobId) {
    const res = await fetch(`/api/stream/${jobId}?download=1`)
    const data = await res.json()
    if (data.results) setResults(data.results)
  }

  function stop() { esRef.current?.close(); setRunning(false) }

  function toggleSelect(i) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  function selectAll() {
    selected.size === results.length ? setSelected(new Set()) : setSelected(new Set(results.map((_, i) => i)))
  }

  async function saveLeads() {
    const toSave = results.filter((_, i) => selected.has(i))
    if (!toSave.length) return
    setSaving(true)
    const rows = toSave.map(r => ({
      name: r.name || r.Name || '',
      phone: r.phone_number || r.phone || '',
      address: r.address || '',
      website: r.website || '',
      industry: search,
      city,
      reviews_count: parseInt(r.reviews_count) || 0,
      reviews_average: parseFloat(r.reviews_average) || 0,
      opens_at: r.opens_at || '',
      introduction: r.introduction || '',
      status: 'nuevo',
    }))
    const { error } = await supabase.from('leads').insert(rows)
    setSaving(false)
    if (error) { setSaveMsg('Error: ' + error.message); return }
    setSaveMsg(`✓ ${rows.length} leads guardados`)
    setSelected(new Set())
  }

  const pct = progress.total > 0 ? Math.round(progress.current / progress.total * 100) : 0

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Scraper de negocios</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
          Scrapea negocios de Google Maps y guardá los leads en tu base de datos
        </p>
      </div>

      {/* Form */}
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto auto', gap: '12px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Industria / búsqueda</label>
            <input
              list="industries"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="ej. Peluquerías"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', padding: '10px 14px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
            <datalist id="industries">{INDUSTRIES.map(i => <option key={i} value={i} />)}</datalist>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Ciudad</label>
            <input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Madrid"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', padding: '10px 14px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>Cantidad</label>
            <input
              type="number" min={1} max={100} value={total}
              onChange={e => setTotal(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', padding: '10px 14px', fontSize: '14px', outline: 'none', width: '90px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {running ? (
              <button onClick={stop} style={{ background: 'var(--red)', color: '#fff', padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Detener</button>
            ) : (
              <button onClick={startScrape} disabled={!search} style={{ background: !search ? 'var(--border)' : 'var(--accent)', color: '#fff', padding: '10px 20px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: search ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '14px' }}>
                Scrapear
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        {running && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{progress.name || 'Buscando…'}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{progress.current}/{progress.total} · {pct}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--surface)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: pct+'%', background: 'var(--accent)', borderRadius: '3px', transition: 'width .3s' }} />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>
              {results.length} resultados encontrados
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              {saveMsg && <span style={{ fontSize: '13px', color: 'var(--green)' }}>{saveMsg}</span>}
              <button onClick={selectAll} style={{ background: 'transparent', color: 'var(--text-muted)', padding: '8px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: '13px' }}>
                {selected.size === results.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
              </button>
              <button onClick={saveLeads} disabled={selected.size === 0 || saving} style={{ background: selected.size > 0 ? 'var(--accent)' : 'var(--border)', color: '#fff', padding: '8px 16px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: selected.size > 0 ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '13px' }}>
                {saving ? 'Guardando…' : `Guardar ${selected.size || ''} leads`}
              </button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '40px', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}></th>
                  {['Nombre','Teléfono','Dirección','Rating','Horario'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 16px', color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} onClick={() => toggleSelect(i)} style={{ cursor: 'pointer', background: selected.has(i) ? 'var(--accent-dim)' : 'transparent' }}>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                      <input type="checkbox" checked={selected.has(i)} onChange={() => toggleSelect(i)} style={{ accentColor: 'var(--accent)' }} />
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px', fontWeight: 500 }}>{r.name || r.Name}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '14px' }}>{r.phone_number || r.phone || '—'}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '13px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.address || '—'}</td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--orange)', fontSize: '14px' }}>
                      {r.reviews_average ? `⭐ ${r.reviews_average} (${r.reviews_count||0})` : '—'}
                    </td>
                    <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', color: 'var(--text-dim)', fontSize: '13px' }}>{r.opens_at || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
