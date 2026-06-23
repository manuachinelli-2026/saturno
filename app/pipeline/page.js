'use client'
import { useState, useRef, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const INDUSTRIES = [
  'Peluquerías', 'Barberías', 'Restaurantes', 'Cafeterías', 'Gimnasios',
  'Clínicas dentales', 'Academias', 'Tiendas de ropa', 'Ferreterías',
  'Estéticas', 'Fotografía', 'Inmobiliarias', 'Abogados', 'Otros',
]

const STEPS = [
  { key: 'scraping',  label: 'Scrapeando negocios',     icon: '🔍' },
  { key: 'saving',    label: 'Guardando leads en BD',   icon: '💾' },
  { key: 'messaging', label: 'Enviando WhatsApps',      icon: '📤' },
]

export default function PipelinePage() {
  const [industry, setIndustry] = useState('')
  const [city, setCity] = useState('Madrid')
  const [quantity, setQuantity] = useState(50)
  const [config, setConfig] = useState(null)

  const [phase, setPhase] = useState('idle') // idle | running | done | error
  const [step, setStep] = useState('')
  const [progress, setProgress] = useState({ scrape: 0, save: 0, msg: 0, total: 0 })
  const [log, setLog] = useState([])
  const [stats, setStats] = useState({ scraped: 0, saved: 0, sent: 0, failed: 0 })

  // Follow-up processing
  const [dueLeads, setDueLeads] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [followupLog, setFollowupLog] = useState([])

  const esRef = useRef(null)

  useEffect(() => {
    loadConfig()
    checkDueFollowups()
  }, [])

  async function loadConfig() {
    const res = await fetch('/api/config')
    const data = await res.json()
    setConfig(data.config)
  }

  async function checkDueFollowups() {
    const now = new Date().toISOString()
    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .lte('next_followup_at', now)
      .in('status', ['contactado'])
      .lt('contact_step', 3)
    setDueLeads(count || 0)
  }

  function addLog(msg, type = 'info') {
    setLog(l => [...l, { msg, type, ts: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }])
  }

  async function launch() {
    if (!industry || phase === 'running') return
    if (!config?.initial_message) {
      alert('Configurá el mensaje inicial antes de lanzar (ir a Configuración)')
      return
    }

    setPhase('running')
    setLog([])
    setStats({ scraped: 0, saved: 0, sent: 0, failed: 0 })

    // STEP 1: Scrape
    setStep('scraping')
    addLog(`Iniciando scrape: "${industry}" en ${city} — ${quantity} negocios`)

    const scrapeRes = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ search: `${industry} en ${city}`, total: quantity }),
    }).catch(e => null)

    if (!scrapeRes?.ok) {
      addLog('Error al conectar con el scraper. ¿Está configurado SCRAPER_API_URL?', 'error')
      setPhase('error')
      return
    }

    const { job_id, error: scrapeErr } = await scrapeRes.json()
    if (scrapeErr || !job_id) {
      addLog(`Error del scraper: ${scrapeErr || 'sin job_id'}`, 'error')
      setPhase('error')
      return
    }

    // Stream progress
    const scraped = await new Promise((resolve) => {
      const es = new EventSource(`/api/stream/${job_id}`)
      esRef.current = es
      es.onmessage = (e) => {
        const d = JSON.parse(e.data)
        if (d.status === 'progress') {
          setProgress(p => ({ ...p, scrape: d.current || 0, total: d.total || quantity }))
          if (d.current_name) addLog(`Encontrado: ${d.current_name}`)
        }
        if (d.status === 'complete' || d.status === 'done') {
          es.close()
          resolve(d.total || quantity)
        }
      }
      es.onerror = () => { es.close(); resolve(0) }
    })

    setStats(s => ({ ...s, scraped }))
    addLog(`✓ Scrape completado: ${scraped} negocios encontrados`, 'success')

    // STEP 2: Download + Save
    setStep('saving')
    addLog('Descargando y guardando leads en Supabase…')

    const dlRes = await fetch(`/api/stream/${job_id}?download=1`)
    const dlData = await dlRes.json()
    const items = dlData.results || []

    const rows = items
      .filter(r => r.name || r.Name)
      .map(r => ({
        name: r.name || r.Name || '',
        phone: (r.phone_number || r.phone || '').replace(/\D/g, ''),
        address: r.address || '',
        website: r.website || '',
        industry,
        city,
        reviews_count: parseInt(r.reviews_count) || 0,
        reviews_average: parseFloat(r.reviews_average) || 0,
        opens_at: r.opens_at || '',
        introduction: r.introduction || '',
        status: 'nuevo',
        contact_step: 0,
      }))

    let savedIds = []
    if (rows.length) {
      const { data: inserted, error: insErr } = await supabase
        .from('leads').insert(rows).select('id, name, phone')
      if (insErr) {
        addLog(`Error guardando leads: ${insErr.message}`, 'error')
      } else {
        savedIds = inserted || []
        setStats(s => ({ ...s, saved: savedIds.length }))
        setProgress(p => ({ ...p, save: savedIds.length }))
        addLog(`✓ ${savedIds.length} leads guardados en la base de datos`, 'success')
      }
    }

    // STEP 3: Send WhatsApp messages
    setStep('messaging')
    const toMessage = savedIds.filter(l => l.phone)
    addLog(`Enviando mensaje inicial a ${toMessage.length} leads con teléfono…`)

    let sent = 0, failed = 0
    for (let i = 0; i < toMessage.length; i++) {
      const lead = toMessage[i]
      const text = (config.initial_message || '').replace('{nombre}', lead.name)
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: lead.phone, text, lead_id: lead.id }),
      })
      const data = await res.json()
      if (data.success) {
        sent++
        // Update lead: contactado, step=1, next_followup in 3 days
        await supabase.from('leads').update({
          status: 'contactado',
          contact_step: 1,
          last_contacted_at: new Date().toISOString(),
          next_followup_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        }).eq('id', lead.id)
      } else {
        failed++
        addLog(`✗ ${lead.name}: ${data.error || 'error'}`, 'error')
      }
      setProgress(p => ({ ...p, msg: i + 1 }))
      setStats(s => ({ ...s, sent, failed }))
      await new Promise(r => setTimeout(r, 800))
    }

    addLog(`✓ Pipeline completado — ${sent} mensajes enviados, ${failed} fallidos`, 'success')
    setPhase('done')
    setStep('')
    checkDueFollowups()
  }

  async function processFollowups() {
    setProcessing(true)
    setFollowupLog([])
    const res = await fetch('/api/followups', { method: 'POST' })
    const data = await res.json()
    setFollowupLog(data.results || [])
    setProcessing(false)
    checkDueFollowups()
  }

  const currentStepIdx = STEPS.findIndex(s => s.key === step)
  const canLaunch = industry && phase !== 'running'

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Pipeline de outreach</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
          Scrapea negocios, guárdalos y envía WhatsApps en un solo paso
        </p>
      </div>

      {/* Config card */}
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: '20px', boxShadow: 'var(--shadow)' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '18px' }}>Configurar lanzamiento</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'end', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Industria</label>
            <input list="industries" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="ej. Peluquerías"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', padding: '10px 14px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
            <datalist id="industries">{INDUSTRIES.map(i => <option key={i} value={i} />)}</datalist>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Ciudad</label>
            <input value={city} onChange={e => setCity(e.target.value)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', padding: '10px 14px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>Cantidad</label>
            <input type="number" min={1} max={100} value={quantity} onChange={e => setQuantity(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', padding: '10px 14px', fontSize: '14px', outline: 'none', width: '90px', boxSizing: 'border-box' }} />
          </div>
        </div>

        {/* Initial message preview */}
        {config && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>Mensaje inicial</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              {(config.initial_message || '').replace('{nombre}', industry ? `un/a ${industry.slice(0,-1).toLowerCase()}` : 'Cliente')}
            </div>
          </div>
        )}

        <button onClick={launch} disabled={!canLaunch}
          style={{
            width: '100%', padding: '14px', borderRadius: 'var(--radius-sm)', border: 'none',
            background: canLaunch ? 'var(--accent)' : 'var(--border)',
            color: '#fff', fontWeight: 700, fontSize: '16px', cursor: canLaunch ? 'pointer' : 'not-allowed',
            letterSpacing: '.01em',
          }}>
          {phase === 'running' ? '⏳ Pipeline en ejecución…' : '▶ Lanzar pipeline'}
        </button>
      </div>

      {/* Progress */}
      {phase !== 'idle' && (
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: '20px', boxShadow: 'var(--shadow)' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>Progreso</div>

          {/* Steps */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {STEPS.map((s, i) => {
              const done = currentStepIdx > i || phase === 'done'
              const active = s.key === step
              return (
                <div key={s.key} style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{
                    padding: '10px 8px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 500,
                    background: done ? 'var(--green-dim)' : active ? 'var(--accent-dim)' : 'var(--surface)',
                    color: done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--text-dim)',
                    border: `1px solid ${done ? 'var(--green-dim)' : active ? 'var(--accent-dim)' : 'var(--border)'}`,
                  }}>
                    {done ? '✓' : s.icon} {s.label}
                    {active && step === 'scraping' && progress.total > 0 && (
                      <span style={{ marginLeft: '6px' }}>{progress.scrape}/{progress.total}</span>
                    )}
                    {active && step === 'messaging' && (
                      <span style={{ marginLeft: '6px' }}>{progress.msg}/{stats.saved}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '16px' }}>
            {[
              { label: 'Scrapeados', value: stats.scraped, color: 'var(--blue)' },
              { label: 'Guardados', value: stats.saved, color: 'var(--accent)' },
              { label: 'Mensajes enviados', value: stats.sent, color: 'var(--green)' },
              { label: 'Fallidos', value: stats.failed, color: 'var(--red)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Log */}
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', padding: '12px', maxHeight: '180px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '12px' }}>
            {log.map((l, i) => (
              <div key={i} style={{ padding: '2px 0', color: l.type === 'success' ? 'var(--green)' : l.type === 'error' ? 'var(--red)' : 'var(--text-muted)' }}>
                <span style={{ color: 'var(--text-dim)', marginRight: '8px' }}>{l.ts}</span>{l.msg}
              </div>
            ))}
            {phase === 'running' && <div style={{ color: 'var(--accent)' }} className="pulse">▊</div>}
          </div>
        </div>
      )}

      {/* Follow-ups card */}
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Follow-ups pendientes</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Leads que no respondieron y están listos para el siguiente mensaje
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {dueLeads > 0 && (
              <span style={{ background: 'var(--orange-dim)', color: 'var(--orange)', fontSize: '13px', fontWeight: 600, padding: '4px 12px', borderRadius: '100px' }}>
                {dueLeads} pendientes
              </span>
            )}
            <button onClick={processFollowups} disabled={dueLeads === 0 || processing}
              style={{ background: dueLeads > 0 ? 'var(--orange)' : 'var(--border)', color: '#fff', padding: '10px 18px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: dueLeads > 0 ? 'pointer' : 'not-allowed', fontWeight: 600, fontSize: '14px' }}>
              {processing ? 'Procesando…' : '📤 Enviar follow-ups'}
            </button>
          </div>
        </div>

        {followupLog.length > 0 && (
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '12px', marginTop: '12px', fontSize: '13px' }}>
            {followupLog.map((r, i) => (
              <div key={i} style={{ color: r.ok ? 'var(--green)' : 'var(--red)', padding: '2px 0' }}>
                {r.ok ? '✓' : '✗'} {r.name} — paso {r.step + 1}
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '16px', padding: '12px 16px', background: 'var(--blue-dim)', borderRadius: 'var(--radius-sm)', fontSize: '13px', color: 'var(--blue)', lineHeight: 1.5 }}>
          <strong>Flujo automático:</strong> Mensaje inicial → {'{'}si no responde en 3 días{'}'} Follow-up 1 → {'{'}si no responde en 7 días{'}'} Follow-up 2. Cuando el lead responde, el agente IA toma el control.
        </div>
      </div>
    </div>
  )
}
