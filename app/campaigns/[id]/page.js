'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function CampaignDetail() {
  const { id } = useParams()
  const [campaign, setCampaign] = useState(null)
  const [leads, setLeads] = useState([])
  const [msgs, setMsgs] = useState({})
  const [selected, setSelected] = useState(new Set())
  const [sending, setSending] = useState(false)
  const [log, setLog] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [id])

  async function loadAll() {
    setLoading(true)
    const [campRes, leadsRes] = await Promise.all([
      supabase.from('campanas').select('*').eq('id', id).single(),
      supabase.from('leads').select('*').in('status', ['nuevo','contactado','respondido']).order('created_at', { ascending: false }),
    ])
    setCampaign(campRes.data)
    setLeads(leadsRes.data || [])

    // Load sent messages for this campaign
    const { data: sentMsgs } = await supabase
      .from('mensajes').select('lead_id').eq('campana_id', id).eq('direction', 'saliente')
    const sentSet = {}
    ;(sentMsgs || []).forEach(m => { sentSet[m.lead_id] = true })
    setMsgs(sentSet)
    setLoading(false)
  }

  function toggleSelect(leadId) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(leadId) ? next.delete(leadId) : next.add(leadId)
      return next
    })
  }

  async function sendMessages() {
    if (!selected.size || !campaign) return
    setSending(true)
    const toSend = leads.filter(l => selected.has(l.id) && l.phone)

    for (const lead of toSend) {
      const text = (campaign.agent_prompt || '').replace('{nombre}', lead.name)
      try {
        const res = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: lead.phone, text, lead_id: lead.id, campana_id: id }),
        })
        const data = await res.json()
        setLog(l => [...l, { name: lead.name, ok: data.success, msg: data.error || 'Enviado ✓' }])
        if (data.success) {
          setMsgs(m => ({ ...m, [lead.id]: true }))
          await supabase.from('leads').update({ status: 'contactado' }).eq('id', lead.id)
        }
      } catch (e) {
        setLog(l => [...l, { name: lead.name, ok: false, msg: e.message }])
      }
      await new Promise(r => setTimeout(r, 800))
    }

    setSending(false)
    setSelected(new Set())
    loadAll()
  }

  if (loading || !campaign) return <div style={{ padding:'32px', color:'var(--text-muted)' }}>Cargando campaña…</div>

  const PRODUCT_LABELS = { agente_ia:'Agente IA', bot:'Bot WhatsApp', pagina_web:'Página Web', pack_completo:'Pack Completo' }
  const STATUS_COLORS = { nuevo:'var(--blue)', contactado:'var(--orange)', respondido:'var(--accent)', convertido:'var(--green)', rechazado:'var(--red)' }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link href="/campaigns" style={{ fontSize:'13px',color:'var(--text-muted)',textDecoration:'none' }}>← Campañas</Link>
        <h1 style={{ fontSize:'26px',fontWeight:700,color:'var(--text)',margin:'8px 0 4px' }}>{campaign.name}</h1>
        <div style={{ fontSize:'14px',color:'var(--text-muted)' }}>
          {[campaign.industry, campaign.city, PRODUCT_LABELS[campaign.product_offered], campaign.price_offered ? '€'+campaign.price_offered : null].filter(Boolean).join(' · ')}
        </div>
      </div>

      {/* Prompt preview */}
      <div style={{ background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'20px',marginBottom:'24px' }}>
        <div style={{ fontSize:'13px',color:'var(--text-muted)',marginBottom:'8px',fontWeight:600 }}>PROMPT DEL AGENTE</div>
        <div style={{ fontSize:'14px',color:'var(--text)',whiteSpace:'pre-wrap',lineHeight:1.6 }}>{campaign.agent_prompt}</div>
      </div>

      {/* Action bar */}
      <div style={{ display:'flex',gap:'10px',alignItems:'center',marginBottom:'16px' }}>
        <div style={{ fontSize:'14px',color:'var(--text-muted)',flex:1 }}>
          {selected.size > 0 ? `${selected.size} seleccionados` : `${leads.length} leads disponibles`}
        </div>
        <button
          onClick={() => selected.size === leads.length ? setSelected(new Set()) : setSelected(new Set(leads.map(l=>l.id)))}
          style={{ background:'transparent',color:'var(--text-muted)',padding:'8px 14px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',cursor:'pointer',fontSize:'13px' }}
        >
          {selected.size === leads.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
        </button>
        <button onClick={sendMessages} disabled={selected.size === 0 || sending}
          style={{ background:selected.size>0?'var(--accent)':'var(--border)',color:'#fff',padding:'10px 20px',borderRadius:'var(--radius-sm)',border:'none',cursor:selected.size>0?'pointer':'not-allowed',fontWeight:600,fontSize:'14px' }}>
          {sending ? 'Enviando…' : `Enviar WhatsApp (${selected.size})`}
        </button>
      </div>

      {/* Send log */}
      {log.length > 0 && (
        <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'12px 16px',marginBottom:'16px',maxHeight:'120px',overflowY:'auto' }}>
          {log.map((l,i) => (
            <div key={i} style={{ fontSize:'13px',color:l.ok?'var(--green)':'var(--red)',padding:'2px 0' }}>
              {l.ok?'✓':'✗'} {l.name}: {l.msg}
            </div>
          ))}
        </div>
      )}

      {/* Leads table */}
      <div style={{ background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden' }}>
        <table style={{ width:'100%',borderCollapse:'collapse' }}>
          <thead>
            <tr>
              <th style={{ width:'40px',padding:'10px 16px',borderBottom:'1px solid var(--border)' }}></th>
              {['Negocio','Teléfono','Industria','Estado','Enviado'].map(h=>(
                <th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'var(--text-muted)',fontSize:'12px',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',borderBottom:'1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leads.map(l => (
              <tr key={l.id}>
                <td style={{ padding:'12px 16px',borderBottom:'1px solid var(--border)' }}>
                  <input type="checkbox" checked={selected.has(l.id)} onChange={()=>toggleSelect(l.id)} style={{ accentColor:'var(--accent)' }} />
                </td>
                <td style={{ padding:'12px 16px',borderBottom:'1px solid var(--border)',fontWeight:500,color:'var(--text)',fontSize:'14px' }}>{l.name}</td>
                <td style={{ padding:'12px 16px',borderBottom:'1px solid var(--border)',color:'var(--text-muted)',fontSize:'14px',fontFamily:'monospace' }}>{l.phone || '—'}</td>
                <td style={{ padding:'12px 16px',borderBottom:'1px solid var(--border)',color:'var(--text-muted)',fontSize:'14px' }}>{l.industry || '—'}</td>
                <td style={{ padding:'12px 16px',borderBottom:'1px solid var(--border)' }}>
                  <span style={{ display:'inline-block',padding:'3px 10px',borderRadius:'100px',fontSize:'12px',fontWeight:500,background:(STATUS_COLORS[l.status]||'var(--accent)').replace('var(--','var(--').replace(')','-dim)'),color:STATUS_COLORS[l.status]||'var(--accent)' }}>
                    {l.status}
                  </span>
                </td>
                <td style={{ padding:'12px 16px',borderBottom:'1px solid var(--border)',fontSize:'13px' }}>
                  {msgs[l.id] ? <span style={{color:'var(--green)'}}>✓ Enviado</span> : <span style={{color:'var(--text-dim)'}}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
