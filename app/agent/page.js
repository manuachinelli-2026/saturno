'use client'
import { useEffect, useState, useRef } from 'react'
import { Icon } from '@/components/Icons'

// ─── Shared field primitives ────────────────────────────────────────────────

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
        {label}
      </label>
      {hint && (
        <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.4 }}>
          {hint}
        </div>
      )}
      {children}
    </div>
  )
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
}

const areaStyle = {
  ...inputStyle,
  resize: 'vertical',
  lineHeight: 1.5,
}

// ─── Section header ─────────────────────────────────────────────────────────

function SectionHeader({ icon, title, subtitle }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '18px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: '1px',
      }}>
        <Icon name={icon} size={15} color="var(--accent)" />
      </div>
      <div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{title}</div>
        {subtitle && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{subtitle}</div>}
      </div>
    </div>
  )
}

// ─── Panel wrapper ───────────────────────────────────────────────────────────

function Panel({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '24px',
      marginBottom: '16px',
      boxShadow: 'var(--shadow)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Stat tile ───────────────────────────────────────────────────────────────

function StatTile({ label, value, icon, color = 'accent', loading }) {
  const colors = {
    accent: { bg: 'rgba(124,58,237,.10)', fg: '#7c3aed' },
    green:  { bg: 'rgba(5,150,105,.10)',  fg: '#059669' },
    orange: { bg: 'rgba(217,119,6,.10)',  fg: '#d97706' },
    blue:   { bg: 'rgba(37,99,235,.10)',  fg: '#2563eb' },
    red:    { bg: 'rgba(220,38,38,.10)',  fg: '#dc2626' },
  }
  const c = colors[color] || colors.accent

  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius)',
      padding: '16px 18px',
      boxShadow: 'var(--shadow)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500, letterSpacing: '.01em' }}>{label}</span>
        <span style={{
          width: '28px', height: '28px', borderRadius: '7px',
          background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon name={icon} size={13} color={c.fg} />
        </span>
      </div>
      {loading
        ? <div style={{ height: '28px', width: '60px', background: 'var(--surface)', borderRadius: '6px' }} className="pulse" />
        : <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text)', lineHeight: 1, letterSpacing: '-.02em' }}>
            {value ?? '—'}
          </div>
      }
    </div>
  )
}

// ─── Chat bubble ─────────────────────────────────────────────────────────────

function Bubble({ role, content, loading }) {
  const isUser = role === 'user'
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: '10px',
    }}>
      {!isUser && (
        <div style={{
          width: '26px', height: '26px', borderRadius: '50%',
          background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, marginRight: '8px', marginTop: '2px',
        }}>
          <Icon name="bot" size={13} color="var(--accent)" />
        </div>
      )}
      <div style={{
        maxWidth: '85%',
        padding: '10px 14px',
        borderRadius: isUser ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
        background: isUser ? 'var(--accent)' : 'var(--surface)',
        color: isUser ? '#fff' : 'var(--text)',
        fontSize: '13.5px',
        lineHeight: 1.5,
        boxShadow: 'var(--shadow)',
      }}>
        {loading
          ? <span style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1s infinite .0s' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1s infinite .2s' }} />
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1s infinite .4s' }} />
            </span>
          : content
        }
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AgentePage() {
  // Config state
  const [form, setForm] = useState(null)
  const [configLoading, setConfigLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [saveError, setSaveError] = useState(null)

  // Stats state
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Test chat state
  const [messages, setMessages] = useState([])
  const [testInput, setTestInput] = useState('')
  const [testing, setTesting] = useState(false)
  const [testError, setTestError] = useState(null)
  const chatEndRef = useRef(null)

  // Load config on mount
  useEffect(() => { loadConfig() }, [])

  // Load stats on mount + poll every 30s
  useEffect(() => {
    loadStats()
    const id = setInterval(loadStats, 30_000)
    return () => clearInterval(id)
  }, [])

  // Scroll chat to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function loadConfig() {
    setConfigLoading(true)
    try {
      const res = await fetch('/api/config')
      const data = await res.json()
      setForm(data.config)
    } catch {
      // silently fail — form stays null
    }
    setConfigLoading(false)
  }

  async function loadStats() {
    setStatsLoading(true)
    try {
      const res = await fetch('/api/dashboard-stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch {
      // silently fail
    }
    setStatsLoading(false)
  }

  async function saveConfig() {
    if (!form) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initial_message: form.initial_message,
          agent_prompt: form.agent_prompt,
          product_name: form.product_name,
          price_offered: parseFloat(form.price_offered) || 0,
          follow_up_day3: form.follow_up_day3,
          follow_up_day7: form.follow_up_day7,
          ai_enabled: form.ai_enabled,
          max_daily_messages: parseInt(form.max_daily_messages) || 50,
        }),
      })
      const data = await res.json()
      if (data.config) {
        setForm(data.config)
        setLastSaved(new Date())
      } else {
        setSaveError('Error al guardar')
      }
    } catch {
      setSaveError('Error de red')
    }
    setSaving(false)
  }

  async function sendTest() {
    const text = testInput.trim()
    if (!text || testing) return
    setTestInput('')
    setTestError(null)
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setTesting(true)

    try {
      const res = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lead_id: null, incoming_message: text }),
      })
      const data = await res.json()
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
      } else {
        setTestError(data.error || 'Sin respuesta del agente')
      }
    } catch {
      setTestError('Error de conexión')
    }
    setTesting(false)
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  function formatSavedTime(d) {
    if (!d) return null
    const h = d.getHours().toString().padStart(2, '0')
    const m = d.getMinutes().toString().padStart(2, '0')
    return `${h}:${m}`
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - var(--topnav-height))', background: 'var(--bg)' }}>

      {/* ── Left column: Configuration (60%) ─────────────────────────────────── */}
      <div style={{
        width: '60%',
        borderRight: '1px solid var(--border)',
        overflowY: 'auto',
        padding: '32px 32px 80px',
      }}>
        {/* Page header */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="bot" size={18} color="var(--accent)" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', letterSpacing: '-.3px' }}>
              Configuracion del agente
            </h1>
          </div>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginLeft: '46px' }}>
            Define como se comporta la IA en todas las conversaciones
          </p>
        </div>

        {configLoading ? (
          <div style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '16px 0' }}>
            Cargando configuracion...
          </div>
        ) : (

          <>
            {/* ── AI Global Toggle ─────────────────────────────────────────── */}
            <div style={{
              background: form?.ai_enabled ? 'rgba(124,58,237,.06)' : 'rgba(220,38,38,.04)',
              border: `2px solid ${form?.ai_enabled ? 'rgba(124,58,237,.25)' : 'rgba(220,38,38,.2)'}`,
              borderRadius: 'var(--radius)',
              padding: '20px 24px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              cursor: 'pointer',
              transition: 'all .2s',
            }} onClick={() => set('ai_enabled', !form?.ai_enabled)}>

              {/* Status indicator + label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {/* Pulsing dot */}
                <div style={{ position: 'relative', width: '14px', height: '14px', flexShrink: 0 }}>
                  <div style={{
                    width: '14px', height: '14px', borderRadius: '50%',
                    background: form?.ai_enabled ? '#059669' : '#dc2626',
                  }} />
                  {form?.ai_enabled && (
                    <div style={{
                      position: 'absolute', inset: '-3px', borderRadius: '50%',
                      background: 'rgba(5,150,105,.3)',
                      animation: 'pulse 2s infinite',
                    }} />
                  )}
                </div>
                <div>
                  <div style={{
                    fontSize: '17px', fontWeight: 700, letterSpacing: '.03em',
                    color: form?.ai_enabled ? '#059669' : '#dc2626',
                  }}>
                    {form?.ai_enabled ? 'IA ACTIVA' : 'IA EN PAUSA'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {form?.ai_enabled
                      ? 'El agente responde automaticamente a los leads'
                      : 'El agente no enviara mensajes automaticos'
                    }
                  </div>
                </div>
              </div>

              {/* Large toggle */}
              <div style={{
                width: '56px', height: '30px', borderRadius: '15px',
                background: form?.ai_enabled ? 'var(--accent)' : 'var(--border)',
                position: 'relative', flexShrink: 0,
                transition: 'background .2s',
              }}>
                <div style={{
                  width: '22px', height: '22px', borderRadius: '50%',
                  background: '#fff',
                  position: 'absolute', top: '4px',
                  left: form?.ai_enabled ? '30px' : '4px',
                  transition: 'left .2s',
                  boxShadow: '0 1px 4px rgba(0,0,0,.2)',
                }} />
              </div>
            </div>

            {/* ── Product & Price ───────────────────────────────────────────── */}
            <Panel>
              <SectionHeader icon="revenue" title="Producto y precio" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <Field label="Nombre del producto">
                  <input
                    value={form?.product_name || ''}
                    onChange={e => set('product_name', e.target.value)}
                    placeholder="Agente IA"
                    style={inputStyle}
                  />
                </Field>
                <Field label="Precio (EUR)">
                  <input
                    type="number"
                    value={form?.price_offered || ''}
                    onChange={e => set('price_offered', e.target.value)}
                    placeholder="497"
                    style={inputStyle}
                  />
                </Field>
              </div>
            </Panel>

            {/* ── Message sequence ──────────────────────────────────────────── */}
            <Panel>
              <SectionHeader
                icon="send"
                title="Secuencia de mensajes"
                subtitle="Usa {nombre} para personalizar con el nombre del negocio"
              />

              <Field
                label="Mensaje inicial (Dia 0)"
                hint="Se envia cuando el lead se scrapea y el pipeline se lanza"
              >
                <textarea
                  value={form?.initial_message || ''}
                  onChange={e => set('initial_message', e.target.value)}
                  rows={3}
                  style={areaStyle}
                />
              </Field>

              <Field
                label="Follow-up 1 (Dia 3)"
                hint="Se envia si el lead no respondio despues de 3 dias"
              >
                <textarea
                  value={form?.follow_up_day3 || ''}
                  onChange={e => set('follow_up_day3', e.target.value)}
                  rows={3}
                  style={areaStyle}
                />
              </Field>

              <Field
                label="Follow-up 2 (Dia 7 — ultimo intento)"
                hint="Si no respondio a los 3 dias del primer follow-up"
              >
                <textarea
                  value={form?.follow_up_day7 || ''}
                  onChange={e => set('follow_up_day7', e.target.value)}
                  rows={3}
                  style={{ ...areaStyle, marginBottom: 0 }}
                />
              </Field>
            </Panel>

            {/* ── System prompt ─────────────────────────────────────────────── */}
            <Panel>
              <SectionHeader
                icon="bot"
                title="Prompt del sistema"
                subtitle="Instrucciones que definen la personalidad y objetivo del agente"
              />
              <Field label="Instrucciones del agente">
                <textarea
                  value={form?.agent_prompt || ''}
                  onChange={e => set('agent_prompt', e.target.value)}
                  rows={8}
                  placeholder="Eres un agente de ventas de Pepino AI. Tu objetivo es..."
                  style={{ ...areaStyle, fontFamily: 'ui-monospace, monospace', fontSize: '13px' }}
                />
              </Field>
              <Field
                label="Maximo de mensajes por dia"
                hint="Limite de seguridad para no ser bloqueado por WhatsApp"
              >
                <input
                  type="number"
                  min={1}
                  max={200}
                  value={form?.max_daily_messages || ''}
                  onChange={e => set('max_daily_messages', e.target.value)}
                  style={{ ...inputStyle, width: '160px' }}
                />
              </Field>
            </Panel>

            {/* ── Save bar ──────────────────────────────────────────────────── */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '20px 0 0',
            }}>
              <button
                onClick={saveConfig}
                disabled={saving}
                style={{
                  background: saving ? 'var(--text-muted)' : 'var(--accent)',
                  color: '#fff',
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background .15s',
                  boxShadow: saving ? 'none' : '0 2px 8px rgba(124,58,237,.35)',
                }}
              >
                {saving
                  ? <><Icon name="refresh" size={15} color="#fff" style={{ animation: 'spin 1s linear infinite' }} /> Guardando...</>
                  : <><Icon name="check" size={15} color="#fff" /> Guardar configuracion</>
                }
              </button>

              {lastSaved && !saveError && (
                <span style={{ fontSize: '13px', color: 'var(--green)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Icon name="check" size={13} color="var(--green)" />
                  Guardado a las {formatSavedTime(lastSaved)}
                </span>
              )}
              {saveError && (
                <span style={{ fontSize: '13px', color: 'var(--red)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Icon name="alert" size={13} color="var(--red)" />
                  {saveError}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Right column: Stats + Test interface (40%) ────────────────────────── */}
      <div style={{
        width: '40%',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        background: 'var(--bg)',
      }}>

        {/* ── Stats section ─────────────────────────────────────────────────── */}
        <div style={{ padding: '32px 28px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Estadisticas en vivo</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Actualizacion cada 30 segundos</div>
            </div>
            <button
              onClick={loadStats}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '6px' }}
              title="Refrescar estadisticas"
            >
              <Icon name="refresh" size={15} color="var(--text-muted)" style={statsLoading ? { animation: 'spin 1s linear infinite' } : {}} />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <StatTile
              label="Respuestas IA hoy"
              value={stats?.ai_responses_today ?? null}
              icon="bot"
              color="accent"
              loading={statsLoading}
            />
            <StatTile
              label="IA activa"
              value={stats?.ai_active_conversations ?? null}
              icon="wifi"
              color="green"
              loading={statsLoading}
            />
            <StatTile
              label="IA pausada"
              value={stats?.ai_paused_conversations ?? null}
              icon="stop"
              color="orange"
              loading={statsLoading}
            />
            <StatTile
              label="Tiempo medio resp."
              value={stats?.avg_response_time != null ? `${stats.avg_response_time}m` : null}
              icon="trending"
              color="blue"
              loading={statsLoading}
            />
          </div>
        </div>

        {/* ── Test interface ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px 28px 28px', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Probar el agente</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                Simula una conversacion real con la IA
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={() => { setMessages([]); setTestError(null) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px' }}
              >
                <Icon name="x" size={12} color="var(--text-muted)" /> Limpiar
              </button>
            )}
          </div>

          {/* Chat window */}
          <div style={{
            flex: 1,
            background: 'var(--surface)',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            padding: '16px',
            overflowY: 'auto',
            minHeight: '200px',
            maxHeight: '340px',
            display: 'flex',
            flexDirection: 'column',
            marginBottom: '14px',
          }}>
            {messages.length === 0 && !testing && (
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: '10px',
                color: 'var(--text-muted)',
              }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: 'var(--panel)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="conversations" size={20} color="var(--text-dim)" />
                </div>
                <div style={{ fontSize: '13px', textAlign: 'center', lineHeight: 1.5 }}>
                  Envia un mensaje para simular<br />una conversacion con el agente
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <Bubble key={i} role={msg.role} content={msg.content} />
            ))}

            {testing && <Bubble role="assistant" loading />}

            {testError && (
              <div style={{
                fontSize: '12px', color: 'var(--red)',
                background: 'var(--red-dim)', borderRadius: '6px',
                padding: '8px 12px', marginTop: '4px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <Icon name="alert" size={12} color="var(--red)" />
                {testError}
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input row */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={testInput}
              onChange={e => setTestInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendTest()}
              placeholder="Simular mensaje entrante..."
              disabled={testing}
              style={{
                ...inputStyle,
                flex: 1,
                background: 'var(--panel)',
                opacity: testing ? .6 : 1,
              }}
            />
            <button
              onClick={sendTest}
              disabled={!testInput.trim() || testing}
              style={{
                background: !testInput.trim() || testing ? 'var(--border)' : 'var(--accent)',
                color: !testInput.trim() || testing ? 'var(--text-muted)' : '#fff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 18px',
                cursor: !testInput.trim() || testing ? 'not-allowed' : 'pointer',
                fontWeight: 600,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
                transition: 'background .15s',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon name="send" size={14} color={!testInput.trim() || testing ? 'var(--text-muted)' : '#fff'} />
              Enviar al agente
            </button>
          </div>

          <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '8px' }}>
            Pulsa Enter para enviar. Las pruebas usan lead_id nulo y el prompt actual guardado.
          </div>
        </div>
      </div>
    </div>
  )
}
