'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import MetricCard from '@/components/MetricCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'

const PRODUCT_LABELS = {
  agente_ia: 'Agente IA', bot: 'Bot WhatsApp',
  pagina_web: 'Página Web', pack_completo: 'Pack Completo',
}

export default function Dashboard() {
  const [stats, setStats] = useState({ leads: 0, contactados: 0, respondidos: 0, convertidos: 0, ingresos: 0 })
  const [byIndustry, setByIndustry] = useState([])
  const [byProduct, setByProduct] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    setLoading(true)
    const [leadsRes, convRes, recentRes] = await Promise.all([
      supabase.from('leads').select('status,industry'),
      supabase.from('conversiones').select('amount,product,converted_at'),
      supabase.from('leads').select('name,industry,status,created_at').order('created_at', { ascending: false }).limit(8),
    ])
    const leads = leadsRes.data || []
    const convs = convRes.data || []

    const byInd = {}
    leads.forEach(l => {
      if (!l.industry) return
      byInd[l.industry] = (byInd[l.industry] || 0) + 1
    })

    const byProd = {}
    convs.forEach(c => {
      if (!c.product) return
      byProd[c.product] = (byProd[c.product] || { count: 0, amount: 0 })
      byProd[c.product].count++
      byProd[c.product].amount += Number(c.amount) || 0
    })

    setStats({
      leads: leads.length,
      contactados: leads.filter(l => l.status !== 'nuevo').length,
      respondidos: leads.filter(l => ['respondido','convertido'].includes(l.status)).length,
      convertidos: leads.filter(l => l.status === 'convertido').length,
      ingresos: convs.reduce((s, c) => s + (Number(c.amount) || 0), 0),
    })
    setByIndustry(Object.entries(byInd).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([name,total])=>({ name, total })))
    setByProduct(Object.entries(byProd).map(([p, d]) => ({ name: PRODUCT_LABELS[p]||p, conversiones: d.count, ingresos: d.amount })))
    setRecent(recentRes.data || [])
    setLoading(false)
  }

  const STATUS_COLORS = { nuevo:'var(--blue)', contactado:'var(--orange)', respondido:'var(--accent)', convertido:'var(--green)', rechazado:'var(--red)' }
  const fmt = n => n >= 1000 ? (n/1000).toFixed(1)+'k' : n
  const fmtMoney = n => '€' + Number(n).toLocaleString('es-ES', { minimumFractionDigits: 0 })

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Panel de operaciones</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
          Vista general de Pepino AI — scraping, mensajes y conversiones
        </p>
      </div>

      {/* Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '16px', marginBottom: '32px' }}>
        <MetricCard label="Total leads" value={loading ? '…' : fmt(stats.leads)} color="accent" icon="🔍" />
        <MetricCard label="Contactados" value={loading ? '…' : fmt(stats.contactados)} color="orange" icon="📤" />
        <MetricCard label="Respondieron" value={loading ? '…' : fmt(stats.respondidos)} color="blue" icon="💬" />
        <MetricCard label="Convertidos" value={loading ? '…' : fmt(stats.convertidos)} color="green" icon="✅" />
        <MetricCard label="Ingresos totales" value={loading ? '…' : fmtMoney(stats.ingresos)} color="green" icon="💰" />
        <MetricCard
          label="Tasa conversión"
          value={loading || !stats.contactados ? '—' : Math.round(stats.convertidos/stats.contactados*100)+'%'}
          color="accent"
          icon="📈"
        />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        {/* By industry */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px' }}>Leads por industria</div>
          {byIndustry.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>Sin datos aún</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byIndustry} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }} cursor={{ fill: 'var(--accent-dim)' }} />
                <Bar dataKey="total" fill="var(--accent)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        {/* By product */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '20px' }}>Ingresos por producto</div>
          {byProduct.length === 0 ? (
            <div style={{ color: 'var(--text-dim)', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>Sin conversiones aún</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byProduct} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '13px' }} cursor={{ fill: 'var(--green-dim)' }} formatter={v => '€'+v} />
                <Bar dataKey="ingresos" fill="var(--green)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent leads */}
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '16px' }}>Últimos leads</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Negocio','Industria','Ciudad','Estado','Fecha'].map(h => (
                <th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'var(--text-muted)',fontSize:'12px',fontWeight:600,textTransform:'uppercase',letterSpacing:'.05em',borderBottom:'1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.length === 0 ? (
              <tr><td colSpan={5} style={{ padding:'32px 16px',textAlign:'center',color:'var(--text-dim)',fontSize:'14px' }}>Sin leads todavía — andá al Scraper</td></tr>
            ) : recent.map((l, i) => (
              <tr key={i}>
                <td style={{ padding:'14px 16px',borderBottom:'1px solid var(--border)',color:'var(--text)',fontSize:'14px',fontWeight:500 }}>{l.name}</td>
                <td style={{ padding:'14px 16px',borderBottom:'1px solid var(--border)',color:'var(--text-muted)',fontSize:'14px' }}>{l.industry || '—'}</td>
                <td style={{ padding:'14px 16px',borderBottom:'1px solid var(--border)',color:'var(--text-muted)',fontSize:'14px' }}>{l.city || '—'}</td>
                <td style={{ padding:'14px 16px',borderBottom:'1px solid var(--border)',fontSize:'14px' }}>
                  <span style={{ display:'inline-block',padding:'3px 10px',borderRadius:'100px',fontSize:'12px',fontWeight:500,background:STATUS_COLORS[l.status]?.replace('var(','var(--')?.replace(')','-dim)') || 'var(--accent-dim)',color:STATUS_COLORS[l.status] || 'var(--accent)' }}>
                    {l.status}
                  </span>
                </td>
                <td style={{ padding:'14px 16px',borderBottom:'1px solid var(--border)',color:'var(--text-dim)',fontSize:'13px' }}>
                  {new Date(l.created_at).toLocaleDateString('es-ES')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
