'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Icon } from '@/components/Icons'

const DEFAULT_FORM = { instance_name: '', label: '', daily_limit: 80 }

export default function LinesPage() {
  const [lines, setLines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // QR modal state
  const [qrModal, setQrModal] = useState(null) // { instanceName, label, qr, loading, error }
  const qrIntervalRef = useRef(null)

  // Poll lines every 15 seconds
  const pollRef = useRef(null)

  const loadLines = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/lines')
      const data = await res.json()
      setLines(data.lines || [])
    } catch {
      // network error — keep last state
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLines(false)
    pollRef.current = setInterval(() => loadLines(true), 15000)
    return () => clearInterval(pollRef.current)
  }, [loadLines])

  // QR fetching
  const fetchQR = useCallback(async (instanceName) => {
    setQrModal(prev => ({ ...prev, loading: true, error: null }))
    try {
      const res = await fetch(`/api/lines/${instanceName}?action=qr`)
      const data = await res.json()
      if (data.qr) {
        setQrModal(prev => ({ ...prev, qr: data.qr, loading: false }))
      } else {
        setQrModal(prev => ({ ...prev, qr: null, loading: false, error: data.error || 'QR no disponible aún. Esperando…' }))
      }
    } catch {
      setQrModal(prev => ({ ...prev, qr: null, loading: false, error: 'Error al obtener el QR.' }))
    }
  }, [])

  function openQRModal(line) {
    setQrModal({ instanceName: line.instance_name, label: line.label, qr: null, loading: true, error: null })
    fetchQR(line.instance_name)
    qrIntervalRef.current = setInterval(() => {
      fetchQR(line.instance_name)
    }, 30000)
  }

  function closeQRModal() {
    setQrModal(null)
    clearInterval(qrIntervalRef.current)
  }

  useEffect(() => {
    return () => clearInterval(qrIntervalRef.current)
  }, [])

  async function handleLogout(instanceName) {
    if (!confirm(`Desconectar la línea "${instanceName}"?`)) return
    await fetch(`/api/lines/${instanceName}?action=logout`)
    loadLines(true)
  }

  async function handleDelete(instanceName, label) {
    if (!confirm(`Eliminar permanentemente la línea "${label}"?`)) return
    await fetch(`/api/lines/${instanceName}`, { method: 'DELETE' })
    loadLines(true)
  }

  async function handleCreate() {
    setFormError('')
    if (!form.instance_name || !form.label) {
      setFormError('Nombre de instancia y etiqueta son obligatorios.')
      return
    }
    if (/[^a-z0-9_-]/.test(form.instance_name)) {
      setFormError('El nombre de instancia solo puede tener letras minúsculas, números, guiones y guiones bajos.')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_name: form.instance_name,
          label: form.label,
          daily_limit: parseInt(form.daily_limit, 10) || 80,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error || 'Error al crear la línea.'); return }
      setForm(DEFAULT_FORM)
      setShowForm(false)
      loadLines(true)
    } catch {
      setFormError('Error de red.')
    } finally {
      setSaving(false)
    }
  }

  // Summary stats
  const connected = lines.filter(l => l.live_status === 'connected').length
  const disconnected = lines.length - connected
  const totalSent = lines.reduce((s, l) => s + (l.daily_sent || 0), 0)

  // Input helper
  const inp = (key, props = {}) => (
    <input
      value={form[key]}
      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)', color: 'var(--text)',
        padding: '9px 13px', fontSize: '14px', outline: 'none',
        width: '100%', boxSizing: 'border-box',
      }}
      {...props}
    />
  )

  return (
    <div style={{ padding: '32px', maxWidth: '860px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text)', margin: 0, letterSpacing: '-0.4px' }}>
            Líneas
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
            Instancias de WhatsApp para envío de mensajes
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormError('') }}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: 'var(--accent)', color: '#fff',
            padding: '9px 18px', borderRadius: 'var(--radius-sm)',
            border: 'none', cursor: 'pointer', fontWeight: 600,
            fontSize: '14px', flexShrink: 0,
          }}
        >
          <Icon name="plus" size={14} color="#fff" />
          Nueva línea
        </button>
      </div>

      {/* Summary signal band — the aesthetic risk: no cards, just a tight stat rail */}
      {!loading && lines.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0',
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '0',
          marginBottom: '24px', overflow: 'hidden',
        }}>
          <StatBand
            value={connected}
            label={connected === 1 ? 'línea activa' : 'líneas activas'}
            dot="var(--green)"
          />
          <div style={{ width: '1px', alignSelf: 'stretch', background: 'var(--border)' }} />
          <StatBand
            value={disconnected}
            label={disconnected === 1 ? 'línea desconectada' : 'líneas desconectadas'}
            dot={disconnected > 0 ? 'var(--red)' : 'var(--border)'}
            muted={disconnected === 0}
          />
          <div style={{ width: '1px', alignSelf: 'stretch', background: 'var(--border)' }} />
          <StatBand
            value={totalSent}
            label="mensajes enviados hoy"
            dot="var(--accent)"
          />
        </div>
      )}

      {/* Lines list */}
      {loading ? (
        <div style={{ color: 'var(--text-muted)', padding: '60px', textAlign: 'center', fontSize: '14px' }}>
          Cargando líneas…
        </div>
      ) : lines.length === 0 ? (
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '56px 32px',
          textAlign: 'center',
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ background: 'var(--accent-dim)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="lines" size={22} color="var(--accent)" />
            </div>
          </div>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
            No hay líneas configuradas
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Creá una línea para vincular una cuenta de WhatsApp
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {lines.map(line => (
            <LineCard
              key={line.instance_name}
              line={line}
              onConnect={() => openQRModal(line)}
              onLogout={() => handleLogout(line.instance_name)}
              onDelete={() => handleDelete(line.instance_name, line.label)}
            />
          ))}
        </div>
      )}

      {/* New line form modal */}
      {showForm && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(28,25,23,.6)',
            zIndex: 300, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '20px',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowForm(false) }}
        >
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '32px',
            width: '100%', maxWidth: '480px',
            boxShadow: 'var(--shadow-md)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>Nueva línea</div>
              <button
                onClick={() => setShowForm(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}
                aria-label="Cerrar"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
                  Nombre de instancia
                </label>
                {inp('instance_name', {
                  placeholder: 'ej. ventas_madrid',
                  onInput: e => {
                    // coerce to lowercase, no spaces
                    e.target.value = e.target.value.toLowerCase().replace(/\s/g, '_')
                  }
                })}
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '5px' }}>
                  Solo minúsculas, números y guiones bajos
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
                  Etiqueta
                </label>
                {inp('label', { placeholder: 'ej. Ventas Madrid' })}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 500 }}>
                  Límite diario de mensajes
                </label>
                {inp('daily_limit', { type: 'number', min: 1, max: 1000, placeholder: '80' })}
              </div>

              {formError && (
                <div style={{
                  background: 'var(--red-dim)', border: '1px solid var(--red)',
                  borderRadius: 'var(--radius-sm)', padding: '10px 14px',
                  fontSize: '13px', color: 'var(--red)', display: 'flex',
                  alignItems: 'flex-start', gap: '8px',
                }}>
                  <Icon name="alert" size={14} color="var(--red)" style={{ marginTop: '1px', flexShrink: 0 }} />
                  {formError}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: 'transparent', color: 'var(--text-muted)',
                  padding: '9px 18px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)', cursor: 'pointer', fontSize: '14px',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                style={{
                  background: saving ? 'var(--border)' : 'var(--accent)',
                  color: '#fff', padding: '9px 22px',
                  borderRadius: 'var(--radius-sm)', border: 'none',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: '14px',
                  display: 'flex', alignItems: 'center', gap: '7px',
                }}
              >
                {saving ? (
                  <>
                    <Icon name="refresh" size={14} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                    Creando…
                  </>
                ) : (
                  <>
                    <Icon name="plus" size={14} color="#fff" />
                    Crear línea
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR modal */}
      {qrModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(28,25,23,.75)',
            zIndex: 400, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '20px',
          }}
          onClick={e => { if (e.target === e.currentTarget) closeQRModal() }}
        >
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '36px 32px',
            width: '100%', maxWidth: '420px', textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)' }}>
                  Conectar {qrModal.label}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '3px' }}>
                  {qrModal.instanceName}
                </div>
              </div>
              <button
                onClick={closeQRModal}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '4px' }}
                aria-label="Cerrar"
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {/* QR area */}
            <div style={{
              background: 'var(--surface)', borderRadius: 'var(--radius)',
              padding: '24px', marginBottom: '20px',
              minHeight: '200px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}>
              {qrModal.loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  <Icon name="refresh" size={24} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
                  Obteniendo código QR…
                </div>
              ) : qrModal.qr ? (
                <img
                  src={`data:image/png;base64,${qrModal.qr}`}
                  alt="Código QR de WhatsApp"
                  style={{ width: '220px', height: '220px', display: 'block', borderRadius: '6px' }}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', color: 'var(--text-muted)', fontSize: '14px', padding: '16px 0' }}>
                  <Icon name="alert" size={22} color="var(--orange)" />
                  {qrModal.error || 'QR no disponible. Intentá de nuevo.'}
                </div>
              )}
            </div>

            {/* Instructions */}
            <div style={{
              background: 'var(--accent-dim)', borderRadius: 'var(--radius-sm)',
              padding: '14px 16px', marginBottom: '20px',
              fontSize: '13px', color: 'var(--text)', lineHeight: '1.6',
              textAlign: 'left',
            }}>
              <div style={{ fontWeight: 600, marginBottom: '4px', color: 'var(--accent)' }}>Cómo vincular</div>
              Abrí WhatsApp en tu teléfono, tocá el menú y elegí <strong>Dispositivos vinculados</strong> → <strong>Vincular dispositivo</strong>, luego escaneá este código.
            </div>

            {/* Refresh + close */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => fetchQR(qrModal.instanceName)}
                disabled={qrModal.loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  background: 'var(--surface)', color: 'var(--text-muted)',
                  padding: '9px 18px', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)', cursor: qrModal.loading ? 'not-allowed' : 'pointer',
                  fontSize: '13px', fontWeight: 500,
                }}
              >
                <Icon name="refresh" size={13} />
                Actualizar QR
              </button>
              <button
                onClick={closeQRModal}
                style={{
                  background: 'var(--accent)', color: '#fff',
                  padding: '9px 22px', borderRadius: 'var(--radius-sm)',
                  border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '13px',
                }}
              >
                Listo
              </button>
            </div>

            <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-dim)' }}>
              El QR se actualiza automáticamente cada 30 segundos
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Summary band stat ────────────────────────────────────────────────────────
function StatBand({ value, label, dot, muted = false }) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', gap: '10px',
      padding: '14px 20px',
    }}>
      <div style={{
        width: '7px', height: '7px', borderRadius: '50%',
        background: dot, flexShrink: 0,
      }} />
      <span style={{
        fontSize: '20px', fontWeight: 700,
        color: muted ? 'var(--text-dim)' : 'var(--text)',
        letterSpacing: '-0.5px', lineHeight: 1,
      }}>
        {value}
      </span>
      <span style={{
        fontSize: '13px', color: 'var(--text-muted)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {label}
      </span>
    </div>
  )
}

// ─── Line card ────────────────────────────────────────────────────────────────
function LineCard({ line, onConnect, onLogout, onDelete }) {
  const isConnected = line.live_status === 'connected'
  const sent = line.daily_sent || 0
  const limit = line.daily_limit || 80
  const pct = Math.min(100, (sent / limit) * 100)

  // Progress bar color: green under 75%, orange 75–90%, red above
  const barColor = pct >= 90 ? 'var(--red)' : pct >= 75 ? 'var(--orange)' : 'var(--accent)'

  return (
    <div style={{
      background: 'var(--panel)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '20px 22px',
      boxShadow: 'var(--shadow)',
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1, marginRight: '16px' }}>
          <div style={{
            fontWeight: 600, fontSize: '15px', color: 'var(--text)',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
              background: isConnected ? 'var(--green)' : 'var(--red)',
              boxShadow: isConnected ? '0 0 0 3px var(--green-dim)' : '0 0 0 3px var(--red-dim)',
            }} />
            {line.label}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '12px', background: 'var(--surface)', padding: '2px 7px', borderRadius: '4px', color: 'var(--text-dim)' }}>
              {line.instance_name}
            </span>
            <span>·</span>
            <span style={{ color: isConnected ? 'var(--green)' : 'var(--red)', fontWeight: 500 }}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
            {line.messages_per_session && (
              <>
                <span>·</span>
                <span>{line.messages_per_session} por tanda</span>
              </>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          {!isConnected && (
            <ActionBtn
              icon="qr"
              label="Conectar"
              primary
              onClick={onConnect}
            />
          )}
          {isConnected && (
            <ActionBtn
              icon="wifi"
              label="Desconectar"
              onClick={onLogout}
            />
          )}
          <ActionBtn
            icon="x"
            label="Eliminar"
            danger
            onClick={onDelete}
          />
        </div>
      </div>

      {/* Daily usage bar */}
      <div style={{ marginTop: '18px' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '12px', color: 'var(--text-muted)', marginBottom: '7px',
          alignItems: 'baseline',
        }}>
          <span>Mensajes enviados hoy</span>
          <span style={{ fontWeight: 600, color: 'var(--text)', fontSize: '13px' }}>
            {sent} <span style={{ fontWeight: 400, color: 'var(--text-dim)' }}>/ {limit}</span>
          </span>
        </div>
        <div style={{
          height: '5px', background: 'var(--surface)',
          borderRadius: '3px', overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', borderRadius: '3px',
            background: barColor,
            width: `${pct}%`,
            transition: 'width 0.4s ease',
          }} />
        </div>
        {pct >= 90 && (
          <div style={{ fontSize: '12px', color: 'var(--red)', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Icon name="alert" size={12} color="var(--red)" />
            Cerca del límite diario
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Small action button ──────────────────────────────────────────────────────
function ActionBtn({ icon, label, onClick, primary = false, danger = false }) {
  const [hover, setHover] = useState(false)

  let bg, color, border
  if (primary) {
    bg = hover ? 'var(--accent-hover)' : 'var(--accent)'
    color = '#fff'
    border = 'transparent'
  } else if (danger) {
    bg = hover ? 'var(--red-dim)' : 'transparent'
    color = hover ? 'var(--red)' : 'var(--text-muted)'
    border = hover ? 'var(--red)' : 'var(--border)'
  } else {
    bg = hover ? 'var(--surface)' : 'transparent'
    color = 'var(--text-muted)'
    border = 'var(--border)'
  }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={label}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        background: bg, color, border: `1px solid ${border}`,
        borderRadius: 'var(--radius-sm)', padding: '7px 12px',
        cursor: 'pointer', fontSize: '13px', fontWeight: 500,
        transition: 'all .15s',
      }}
    >
      <Icon name={icon} size={13} color={color} />
      {label}
    </button>
  )
}
