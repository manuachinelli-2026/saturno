'use client'
import { useEffect, useState } from 'react'

export default function ConfigPage() {
  const [config, setConfig] = useState(null)
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadConfig() }, [])

  async function loadConfig() {
    const res = await fetch('/api/config')
    const data = await res.json()
    setConfig(data.config)
    setForm(data.config)
    setLoading(false)
  }

  async function saveConfig() {
    if (!form) return
    setSaving(true)
    setSaved(false)
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
    setSaving(false)
    if (data.config) { setConfig(data.config); setSaved(true); setTimeout(() => setSaved(false), 3000) }
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const Field = ({ label, hint, children }) => (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>{label}</label>
      {hint && <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>{hint}</div>}
      {children}
    </div>
  )

  const inp = (key, props = {}) => (
    <input value={form?.[key] || ''} onChange={e => set(key, e.target.value)}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', padding: '10px 14px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
      {...props} />
  )

  const area = (key, rows = 4) => (
    <textarea value={form?.[key] || ''} onChange={e => set(key, e.target.value)} rows={rows}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', padding: '10px 14px', fontSize: '14px', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'vertical', lineHeight: 1.5 }} />
  )

  if (loading) return <div style={{ padding: '32px', color: 'var(--text-muted)' }}>Cargando configuración…</div>

  return (
    <div style={{ padding: '32px', maxWidth: '720px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>Configuración del agente</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
          Definí cómo se comporta el agente de IA en todas las conversaciones
        </p>
      </div>

      {/* Product */}
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: '16px', boxShadow: 'var(--shadow)' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '18px' }}>Producto y precio</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <Field label="Nombre del producto">
            {inp('product_name', { placeholder: 'Agente IA' })}
          </Field>
          <Field label="Precio (€)">
            {inp('price_offered', { type: 'number', placeholder: '497' })}
          </Field>
        </div>
      </div>

      {/* Messages */}
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: '16px', boxShadow: 'var(--shadow)' }}>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Secuencia de mensajes</div>
        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
          Usá <code style={{ background: 'var(--surface)', padding: '1px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>{'{nombre}'}</code> para personalizar con el nombre del negocio
        </div>

        <Field label="Mensaje inicial (Día 0)" hint="Se envía cuando el lead se scrapea y el pipeline se lanza">
          {area('initial_message', 3)}
        </Field>

        <Field label="Follow-up 1 (Día 3)" hint="Se envía si el lead no respondió después de 3 días">
          {area('follow_up_day3', 3)}
        </Field>

        <Field label="Follow-up 2 (Día 7 — último intento)" hint="Si no respondió a los 3 días del primer follow-up">
          {area('follow_up_day7', 3)}
        </Field>
      </div>

      {/* AI Agent */}
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px', marginBottom: '16px', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>Agente IA</div>
            <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Cuando un lead responde, el agente toma el control automáticamente
            </div>
          </div>
          <div onClick={() => set('ai_enabled', !form?.ai_enabled)}
            style={{ width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', transition: 'background .2s', background: form?.ai_enabled ? 'var(--accent)' : 'var(--border)', position: 'relative', flexShrink: 0 }}>
            <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', transition: 'left .2s', left: form?.ai_enabled ? '23px' : '3px', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
          </div>
        </div>

        <Field label="Prompt del sistema" hint="Instrucciones que definen la personalidad y objetivo del agente">
          {area('agent_prompt', 6)}
        </Field>

        <Field label="Máximo de mensajes por día" hint="Límite de seguridad para no ser bloqueado por WhatsApp">
          {inp('max_daily_messages', { type: 'number', min: 1, max: 200 })}
        </Field>
      </div>

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button onClick={saveConfig} disabled={saving}
          style={{ background: 'var(--accent)', color: '#fff', padding: '12px 28px', borderRadius: 'var(--radius-sm)', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '15px' }}>
          {saving ? 'Guardando…' : 'Guardar configuración'}
        </button>
        {saved && <span style={{ color: 'var(--green)', fontSize: '14px', fontWeight: 500 }}>✓ Guardado correctamente</span>}
      </div>
    </div>
  )
}
