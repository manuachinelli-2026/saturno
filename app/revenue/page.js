'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import MetricCard from '@/components/MetricCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

const PRODUCTS = [
  { value: 'agente_ia', label: 'Agente IA', color: 'var(--accent)' },
  { value: 'bot', label: 'Bot WhatsApp', color: 'var(--blue)' },
  { value: 'pagina_web', label: 'Página Web', color: 'var(--orange)' },
  { value: 'pack_completo', label: 'Pack Completo', color: 'var(--green)' },
]

const PRODUCT_COLORS = { agente_ia:'#8b5cf6', bot:'#3b82f6', pagina_web:'#f59e0b', pack_completo:'#10b981' }

const DEFAULT_FORM = { lead_id: '', campana_id: '', product: 'agente_ia', amount: '', notes: '' }

export default function RevenuePage() {
  const [conversiones, setConversiones] = useState([])
  const [leads, setLeads] = useState([])
  const [stats, setStats] = useState({ total: 0, count: 0, avg: 0, best: '' })
  const [byProduct, setByProduct] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [convRes, leadsRes] = await Promise.all([
      supabase.from('conversiones').select('*, leads(name)').order('converted_at', { ascending: false }),
      supabase.from('leads').select('id, name').in('status', ['respondido','convertido']),
    ])
    const convs = convRes.data || []
    setConversiones(convs)
    setLeads(leadsRes.data || [])

    const total = convs.reduce((s, c) => s + (Number(c.amount) || 0), 0)
    const count = convs.length
    const avg = count > 0 ? total / count : 0

    const byP = {}
    convs.forEach(c => {
      const p = c.product || 'desconocido'
      if (!byP[p]) byP[p] = { amount: 0, count: 0 }
      byP[p].amount += Number(c.amount) || 0
      byP[p].count++
    })

    const bestEntry = Object.entries(byP).sort((a,b) => b[1].amount - a[1].amount)[0]
    setStats({ total, count, avg, best: bestEntry ? bestEntry[0] : '' })
    setByProduct(Object.entries(byP).map(([p, d]) => ({
      name: PRODUCTS.find(x=>x.value===p)?.label || p,
      value: d.amount, count: d.count,
    })))
    setLoading(false)
  }

  async function addConversion() {
    if (!form.product || !form.amount) return
    setSaving(true)
    const { error } = await supabase.from('conversiones').insert({
      lead_id: form.lead_id || null,
      campana_id: form.campana_id || null,
      product: form.product,
      amount: parseFloat(form.amount),
      notes: form.notes || null,
    })
    if (!error && form.lead_id) {
      await supabase.from('leads').update({ status: 'convertido' }).eq('id', form.lead_id)
    }
    setSaving(false)
    if (error) { alert(error.message); return }
    setForm(DEFAULT_FORM)
    setShowForm(false)
    loadAll()
  }

  const fmtMoney = n => '€' + Number(n).toLocaleString('es-ES', { minimumFractionDigits: 0 })
  const PRODUCT_LABELS = { agente_ia:'Agente IA', bot:'Bot WhatsApp', pagina_web:'Página Web', pack_completo:'Pack Completo' }

  return (
    <div style={{ padding: '32px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'32px' }}>
        <div>
          <h1 style={{ fontSize:'28px', fontWeight:700, color:'var(--text)', margin:0 }}>Ingresos</h1>
          <p style={{ fontSize:'14px', color:'var(--text-muted)', marginTop:'6px' }}>Seguimiento de conversiones y facturación de Pepino AI</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ background:'var(--green)', color:'#fff', padding:'10px 20px', borderRadius:'var(--radius-sm)', border:'none', cursor:'pointer', fontWeight:600, fontSize:'14px' }}>
          + Registrar venta
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
          <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'32px', width:'100%', maxWidth:'500px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
              <div style={{ fontSize:'20px', fontWeight:700, color:'var(--text)' }}>Registrar conversión</div>
              <button onClick={() => setShowForm(false)} style={{ background:'transparent', border:'none', color:'var(--text-muted)', fontSize:'20px', cursor:'pointer' }}>✕</button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
              <div>
                <label style={{ display:'block', fontSize:'13px', color:'var(--text-muted)', marginBottom:'6px' }}>Lead</label>
                <select value={form.lead_id} onChange={e=>setForm(f=>({...f,lead_id:e.target.value}))}
                  style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text)', padding:'10px 14px', fontSize:'14px', outline:'none', width:'100%', boxSizing:'border-box' }}>
                  <option value="">— Sin lead específico —</option>
                  {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'13px', color:'var(--text-muted)', marginBottom:'6px' }}>Producto vendido *</label>
                <select value={form.product} onChange={e=>setForm(f=>({...f,product:e.target.value}))}
                  style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text)', padding:'10px 14px', fontSize:'14px', outline:'none', width:'100%', boxSizing:'border-box' }}>
                  {PRODUCTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block', fontSize:'13px', color:'var(--text-muted)', marginBottom:'6px' }}>Monto (€) *</label>
                <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="497"
                  style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text)', padding:'10px 14px', fontSize:'14px', outline:'none', width:'100%', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:'13px', color:'var(--text-muted)', marginBottom:'6px' }}>Notas</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={3}
                  style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text)', padding:'10px 14px', fontSize:'14px', outline:'none', width:'100%', boxSizing:'border-box', resize:'vertical' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:'10px', marginTop:'24px', justifyContent:'flex-end' }}>
              <button onClick={()=>setShowForm(false)} style={{ background:'transparent', color:'var(--text-muted)', padding:'10px 20px', borderRadius:'var(--radius-sm)', border:'1px solid var(--border)', cursor:'pointer', fontSize:'14px' }}>Cancelar</button>
              <button onClick={addConversion} disabled={!form.amount||saving} style={{ background:form.amount?'var(--green)':'var(--border)', color:'#fff', padding:'10px 24px', borderRadius:'var(--radius-sm)', border:'none', cursor:form.amount?'pointer':'not-allowed', fontWeight:600, fontSize:'14px' }}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metrics */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:'16px', marginBottom:'32px' }}>
        <MetricCard label="Facturación total" value={loading?'…':fmtMoney(stats.total)} color="green" icon="💶" />
        <MetricCard label="Ventas cerradas" value={loading?'…':stats.count} color="accent" icon="✅" />
        <MetricCard label="Ticket promedio" value={loading||!stats.count?'—':fmtMoney(stats.avg)} color="blue" icon="🎯" />
        <MetricCard label="Mejor producto" value={loading?'…':PRODUCT_LABELS[stats.best]||'—'} color="orange" icon="🏆" />
      </div>

      {/* Charts */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'32px' }}>
        <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'24px' }}>
          <div style={{ fontSize:'15px', fontWeight:600, color:'var(--text)', marginBottom:'20px' }}>Ingresos por producto</div>
          {byProduct.length === 0 ? (
            <div style={{ color:'var(--text-dim)', fontSize:'14px', textAlign:'center', padding:'40px 0' }}>Sin conversiones aún</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byProduct} margin={{ left:-20, right:0, top:0, bottom:0 }}>
                <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)', fontSize:'13px' }} formatter={v=>'€'+v} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {byProduct.map((_, i) => <Cell key={i} fill={Object.values(PRODUCT_COLORS)[i % 4]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'24px' }}>
          <div style={{ fontSize:'15px', fontWeight:600, color:'var(--text)', marginBottom:'20px' }}>Distribución de ventas</div>
          {byProduct.length === 0 ? (
            <div style={{ color:'var(--text-dim)', fontSize:'14px', textAlign:'center', padding:'40px 0' }}>Sin conversiones aún</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={byProduct} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {byProduct.map((_, i) => <Cell key={i} fill={Object.values(PRODUCT_COLORS)[i % 4]} />)}
                </Pie>
                <Tooltip formatter={v=>'€'+v} contentStyle={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'8px', color:'var(--text)' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Conversions table */}
      <div style={{ background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:'24px' }}>
        <div style={{ fontSize:'15px', fontWeight:600, color:'var(--text)', marginBottom:'16px' }}>Historial de conversiones</div>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {['Cliente','Producto','Monto','Notas','Fecha'].map(h=>(
                <th key={h} style={{ textAlign:'left', padding:'10px 16px', color:'var(--text-muted)', fontSize:'12px', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {conversiones.length === 0 ? (
              <tr><td colSpan={5} style={{ padding:'32px 16px', textAlign:'center', color:'var(--text-dim)', fontSize:'14px' }}>
                Aún no hay conversiones registradas
              </td></tr>
            ) : conversiones.map(c => (
              <tr key={c.id}>
                <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', color:'var(--text)', fontSize:'14px', fontWeight:500 }}>
                  {c.leads?.name || '—'}
                </td>
                <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', fontSize:'14px' }}>
                  <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:'100px', fontSize:'12px', fontWeight:500, background:PRODUCT_COLORS[c.product]+'25', color:PRODUCT_COLORS[c.product] || 'var(--accent)' }}>
                    {PRODUCT_LABELS[c.product] || c.product}
                  </span>
                </td>
                <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', color:'var(--green)', fontSize:'15px', fontWeight:600 }}>
                  {fmtMoney(c.amount)}
                </td>
                <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', color:'var(--text-muted)', fontSize:'14px' }}>
                  {c.notes || '—'}
                </td>
                <td style={{ padding:'14px 16px', borderBottom:'1px solid var(--border)', color:'var(--text-dim)', fontSize:'13px' }}>
                  {new Date(c.converted_at).toLocaleDateString('es-ES', { day:'2-digit', month:'short', year:'numeric' })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
