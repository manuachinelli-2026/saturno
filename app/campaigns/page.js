'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const PRODUCTS = [
  { value: 'agente_ia', label: 'Agente IA' },
  { value: 'bot', label: 'Bot WhatsApp' },
  { value: 'pagina_web', label: 'Página Web' },
  { value: 'pack_completo', label: 'Pack Completo' },
]

const STATUS_COLORS = {
  borrador: { bg: 'var(--border)', text: 'var(--text-muted)' },
  activa:   { bg: 'var(--green-dim)', text: 'var(--green)' },
  pausada:  { bg: 'var(--orange-dim)', text: 'var(--orange)' },
  completada:{ bg: 'var(--accent-dim)', text: 'var(--accent)' },
}

const DEFAULT_FORM = {
  name: '', industry: '', city: 'Madrid',
  product_offered: 'agente_ia', price_offered: '',
  agent_prompt: 'Hola {nombre}, somos Pepino AI. Queremos ofrecerte un agente de inteligencia artificial para tu negocio que atiende clientes por WhatsApp 24/7. ¿Podemos contarte más?',
  status: 'activa',
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => { loadCampaigns() }, [])

  async function loadCampaigns() {
    setLoading(true)
    const { data } = await supabase
      .from('campanas')
      .select('*, mensajes(count), conversiones(count)')
      .order('created_at', { ascending: false })
    setCampaigns(data || [])
    setLoading(false)
  }

  async function createCampaign() {
    if (!form.name) return
    setSaving(true)
    const { error } = await supabase.from('campanas').insert({
      ...form,
      price_offered: form.price_offered ? parseFloat(form.price_offered) : null,
    })
    setSaving(false)
    if (error) { alert(error.message); return }
    setForm(DEFAULT_FORM)
    setShowForm(false)
    loadCampaigns()
  }

  const field = (label, key, el) => (
    <div>
      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</label>
      {el}
    </div>
  )
  const inp = (key, props={}) => (
    <input value={form[key]} onChange={e => setForm(f => ({...f,[key]:e.target.value}))}
      style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',color:'var(--text)',padding:'10px 14px',fontSize:'14px',outline:'none',width:'100%',boxSizing:'border-box' }}
      {...props} />
  )

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Campañas</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>Creá campañas de WhatsApp con agente IA</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ background:'var(--accent)',color:'#fff',padding:'10px 20px',borderRadius:'var(--radius-sm)',border:'none',cursor:'pointer',fontWeight:600,fontSize:'14px' }}>
          + Nueva campaña
        </button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.7)',zIndex:200,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px' }}>
          <div style={{ background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'32px',width:'100%',maxWidth:'600px',maxHeight:'90vh',overflowY:'auto' }}>
            <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px' }}>
              <div style={{ fontSize:'20px',fontWeight:700,color:'var(--text)' }}>Nueva campaña</div>
              <button onClick={() => setShowForm(false)} style={{ background:'transparent',border:'none',color:'var(--text-muted)',fontSize:'20px',cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ display:'flex',flexDirection:'column',gap:'16px' }}>
              {field('Nombre de campaña', 'name', inp('name', { placeholder:'ej. Peluquerías Madrid junio' }))}
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px' }}>
                {field('Industria', 'industry', inp('industry', { placeholder:'ej. Peluquerías' }))}
                {field('Ciudad', 'city', inp('city'))}
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px' }}>
                {field('Producto', 'product_offered', (
                  <select value={form.product_offered} onChange={e => setForm(f=>({...f,product_offered:e.target.value}))}
                    style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',color:'var(--text)',padding:'10px 14px',fontSize:'14px',outline:'none',width:'100%',boxSizing:'border-box' }}>
                    {PRODUCTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                ))}
                {field('Precio (€)', 'price_offered', inp('price_offered', { type:'number', placeholder:'497' }))}
              </div>
              {field('Prompt del agente IA', 'agent_prompt', (
                <textarea value={form.agent_prompt} onChange={e => setForm(f=>({...f,agent_prompt:e.target.value}))}
                  rows={5}
                  style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',color:'var(--text)',padding:'10px 14px',fontSize:'14px',outline:'none',width:'100%',boxSizing:'border-box',resize:'vertical' }} />
              ))}
              <div style={{ fontSize:'12px',color:'var(--text-dim)',marginTop:'-8px' }}>
                Usá {'{nombre}'} para personalizar con el nombre del negocio
              </div>
            </div>
            <div style={{ display:'flex',gap:'10px',marginTop:'24px',justifyContent:'flex-end' }}>
              <button onClick={() => setShowForm(false)} style={{ background:'transparent',color:'var(--text-muted)',padding:'10px 20px',borderRadius:'var(--radius-sm)',border:'1px solid var(--border)',cursor:'pointer',fontSize:'14px' }}>Cancelar</button>
              <button onClick={createCampaign} disabled={!form.name||saving} style={{ background:form.name?'var(--accent)':'var(--border)',color:'#fff',padding:'10px 24px',borderRadius:'var(--radius-sm)',border:'none',cursor:form.name?'pointer':'not-allowed',fontWeight:600,fontSize:'14px' }}>
                {saving ? 'Creando…' : 'Crear campaña'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Campaigns list */}
      <div style={{ display:'flex',flexDirection:'column',gap:'12px' }}>
        {loading ? (
          <div style={{ color:'var(--text-muted)',padding:'40px',textAlign:'center' }}>Cargando…</div>
        ) : campaigns.length === 0 ? (
          <div style={{ background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'48px',textAlign:'center' }}>
            <div style={{ fontSize:'32px',marginBottom:'12px' }}>📢</div>
            <div style={{ color:'var(--text-muted)',fontSize:'15px' }}>No hay campañas todavía</div>
            <div style={{ color:'var(--text-dim)',fontSize:'13px',marginTop:'6px' }}>Creá una para empezar a enviar mensajes</div>
          </div>
        ) : campaigns.map(c => {
          const sc = STATUS_COLORS[c.status] || STATUS_COLORS.borrador
          const productLabel = { agente_ia:'Agente IA', bot:'Bot WhatsApp', pagina_web:'Página Web', pack_completo:'Pack Completo' }[c.product_offered] || c.product_offered
          return (
            <Link key={c.id} href={`/campaigns/${c.id}`} style={{ textDecoration:'none' }}>
              <div style={{ background:'var(--panel)',border:'1px solid var(--border)',borderRadius:'var(--radius)',padding:'20px 24px',cursor:'pointer',transition:'border-color .15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
              >
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'flex-start' }}>
                  <div>
                    <div style={{ fontWeight:600,fontSize:'16px',color:'var(--text)',marginBottom:'4px' }}>{c.name}</div>
                    <div style={{ fontSize:'13px',color:'var(--text-muted)' }}>
                      {[c.industry,c.city,productLabel,c.price_offered ? '€'+c.price_offered : null].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <span style={{ display:'inline-block',padding:'4px 12px',borderRadius:'100px',fontSize:'12px',fontWeight:500,background:sc.bg,color:sc.text }}>
                    {c.status}
                  </span>
                </div>
                <div style={{ display:'flex',gap:'24px',marginTop:'16px' }}>
                  <div style={{ fontSize:'13px',color:'var(--text-muted)' }}>
                    <span style={{ color:'var(--text)',fontWeight:600 }}>—</span> enviados
                  </div>
                  <div style={{ fontSize:'13px',color:'var(--text-muted)' }}>
                    <span style={{ color:'var(--text)',fontWeight:600 }}>—</span> respondidos
                  </div>
                  <div style={{ fontSize:'13px',color:'var(--text-muted)' }}>
                    <span style={{ color:'var(--green)',fontWeight:600 }}>—</span> convertidos
                  </div>
                  <div style={{ marginLeft:'auto',fontSize:'12px',color:'var(--text-dim)' }}>
                    {new Date(c.created_at).toLocaleDateString('es-ES')}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
