'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'

export default function ConversationsPage() {
  const [leads, setLeads] = useState([])
  const [selected, setSelected] = useState(null)
  const [messages, setMessages] = useState([])
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => { loadLeads() }, [])
  useEffect(() => { if (selected) loadMessages(selected.id) }, [selected])
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function loadLeads() {
    setLoading(true)
    const { data } = await supabase
      .from('leads')
      .select('*, mensajes(count)')
      .in('status', ['contactado','respondido','convertido'])
      .order('created_at', { ascending: false })
    setLeads(data || [])
    setLoading(false)
  }

  async function loadMessages(leadId) {
    const { data } = await supabase
      .from('mensajes')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true })
    setMessages(data || [])
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return
    setSending(true)
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: selected.phone, text: reply, lead_id: selected.id }),
    })
    const data = await res.json()
    if (data.success) {
      setReply('')
      loadMessages(selected.id)
    } else {
      alert('Error al enviar: ' + data.error)
    }
    setSending(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply()
  }

  const STATUS_COLORS = { nuevo:'var(--blue)',contactado:'var(--orange)',respondido:'var(--accent)',convertido:'var(--green)',rechazado:'var(--red)' }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden' }}>
      {/* Left: lead list */}
      <div style={{ width:'300px', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', flexShrink:0 }}>
        <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid var(--border)' }}>
          <div style={{ fontSize:'18px', fontWeight:700, color:'var(--text)' }}>Conversaciones</div>
          <div style={{ fontSize:'13px', color:'var(--text-muted)', marginTop:'4px' }}>
            {leads.length} contactos activos
          </div>
        </div>
        <div style={{ flex:1, overflowY:'auto' }}>
          {loading ? (
            <div style={{ padding:'32px', textAlign:'center', color:'var(--text-muted)', fontSize:'14px' }}>Cargando…</div>
          ) : leads.length === 0 ? (
            <div style={{ padding:'32px', textAlign:'center' }}>
              <div style={{ fontSize:'24px', marginBottom:'8px' }}>💬</div>
              <div style={{ color:'var(--text-muted)', fontSize:'14px' }}>Sin conversaciones aún</div>
              <div style={{ color:'var(--text-dim)', fontSize:'12px', marginTop:'4px' }}>Enviá mensajes desde Campañas</div>
            </div>
          ) : leads.map(l => (
            <div key={l.id}
              onClick={() => setSelected(l)}
              style={{ padding:'16px 20px', borderBottom:'1px solid var(--border)', cursor:'pointer', background: selected?.id===l.id ? 'var(--accent-dim)' : 'transparent', transition:'background .15s' }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'4px' }}>
                <div style={{ fontWeight:600, fontSize:'14px', color:'var(--text)' }}>{l.name}</div>
                <span style={{ fontSize:'11px', padding:'2px 8px', borderRadius:'100px', background:STATUS_COLORS[l.status]?.replace('var(--','var(--').replace(')','-dim)'), color:STATUS_COLORS[l.status] }}>
                  {l.status}
                </span>
              </div>
              <div style={{ fontSize:'12px', color:'var(--text-muted)' }}>{l.phone || '—'}</div>
              <div style={{ fontSize:'12px', color:'var(--text-dim)', marginTop:'2px' }}>{l.industry} · {l.city}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right: chat */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {!selected ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:'12px' }}>
            <div style={{ fontSize:'40px' }}>👈</div>
            <div style={{ color:'var(--text-muted)', fontSize:'16px' }}>Seleccioná un contacto para ver la conversación</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ padding:'16px 24px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
              <div>
                <div style={{ fontWeight:700, fontSize:'16px', color:'var(--text)' }}>{selected.name}</div>
                <div style={{ fontSize:'13px', color:'var(--text-muted)' }}>{selected.phone} · {selected.industry}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <span style={{ fontSize:'13px', color: aiEnabled ? 'var(--green)' : 'var(--text-muted)' }}>
                  {aiEnabled ? '🤖 IA activa' : 'IA desactivada'}
                </span>
                <div
                  onClick={() => setAiEnabled(a => !a)}
                  style={{
                    width:'40px', height:'22px', borderRadius:'11px', cursor:'pointer', transition:'background .2s',
                    background: aiEnabled ? 'var(--accent)' : 'var(--border)', position:'relative',
                  }}
                >
                  <div style={{
                    width:'16px', height:'16px', borderRadius:'50%', background:'#fff',
                    position:'absolute', top:'3px', transition:'left .2s',
                    left: aiEnabled ? '21px' : '3px',
                  }} />
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:'12px' }}>
              {messages.length === 0 && (
                <div style={{ textAlign:'center', color:'var(--text-dim)', fontSize:'14px', marginTop:'40px' }}>
                  No hay mensajes en esta conversación
                </div>
              )}
              {messages.map(m => {
                const isOut = m.direction === 'saliente'
                return (
                  <div key={m.id} style={{ display:'flex', justifyContent: isOut ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth:'70%', padding:'10px 14px', borderRadius: isOut ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                      background: isOut ? 'var(--accent)' : 'var(--panel)',
                      border: isOut ? 'none' : '1px solid var(--border)',
                      color: isOut ? '#fff' : 'var(--text)',
                      fontSize:'14px', lineHeight:1.5,
                    }}>
                      {m.is_ai_response && <div style={{ fontSize:'11px', color: isOut ? 'rgba(255,255,255,.7)' : 'var(--text-dim)', marginBottom:'4px' }}>🤖 Agente IA</div>}
                      {m.content}
                      <div style={{ fontSize:'11px', color: isOut ? 'rgba(255,255,255,.6)' : 'var(--text-dim)', marginTop:'4px', textAlign:'right' }}>
                        {new Date(m.created_at).toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' })}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding:'16px 24px', borderTop:'1px solid var(--border)', display:'flex', gap:'10px', flexShrink:0 }}>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Escribí un mensaje… (Cmd+Enter para enviar)`}
                rows={2}
                style={{ flex:1, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius-sm)', color:'var(--text)', padding:'10px 14px', fontSize:'14px', outline:'none', resize:'none', lineHeight:1.5 }}
              />
              <button onClick={sendReply} disabled={!reply.trim()||sending}
                style={{ background:reply.trim()?'var(--accent)':'var(--border)', color:'#fff', padding:'10px 18px', borderRadius:'var(--radius-sm)', border:'none', cursor:reply.trim()?'pointer':'not-allowed', fontWeight:600, fontSize:'14px', alignSelf:'flex-end' }}>
                {sending ? '…' : '↑'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
