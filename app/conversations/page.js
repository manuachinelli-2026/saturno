'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Icon } from '@/components/Icons'

// ─── helpers ────────────────────────────────────────────────────────────────

function formatTs(ts) {
  if (!ts) return ''
  // Evolution API timestamps can be Unix seconds
  const ms = ts > 1e12 ? ts : ts * 1000
  const d = new Date(ms)
  const now = new Date()
  const diffMs = now - d
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`
  if (diffMin < 1440) {
    const h = Math.floor(diffMin / 60)
    return `hace ${h} h`
  }
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })
}

function chatName(chat) {
  if (chat.lead?.name) return chat.lead.name
  if (chat.pushName) return chat.pushName
  const phone = chat.id?.replace(/@s\.whatsapp\.net$/, '').replace(/@g\.us$/, '')
  return phone || chat.id || '—'
}

function chatPreview(chat) {
  const body =
    chat.lastMessage?.message?.conversation ||
    chat.lastMessage?.message?.extendedTextMessage?.text ||
    chat.lastMessage?.message?.imageMessage?.caption ||
    ''
  return body.slice(0, 60) || 'Sin mensajes'
}

function msgText(msg) {
  return (
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    msg.message?.documentMessage?.fileName ||
    '[Archivo adjunto]'
  )
}

function isOutgoing(msg) {
  // key.fromMe === true means we sent it
  return msg.key?.fromMe === true
}

function msgTimestamp(msg) {
  return msg.messageTimestamp || msg.key?.messageTimestamp || 0
}

// ─── component ──────────────────────────────────────────────────────────────

export default function ConversationsPage() {
  const [chats, setChats] = useState([])
  const [loadingChats, setLoadingChats] = useState(true)
  const [selected, setSelected] = useState(null)   // full chat object
  const [messages, setMessages] = useState([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [aiPaused, setAiPaused] = useState(false)
  const [togglingAI, setTogglingAI] = useState(false)
  const [search, setSearch] = useState('')
  const bottomRef = useRef(null)
  const pollRef = useRef(null)

  // ── load chat list ─────────────────────────────────────────────────────────
  const loadChats = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations')
      const data = await res.json()
      setChats(data.chats || [])
    } catch (err) {
      console.error('loadChats error', err)
    } finally {
      setLoadingChats(false)
    }
  }, [])

  useEffect(() => { loadChats() }, [loadChats])

  // ── load messages for selected chat ───────────────────────────────────────
  const loadMessages = useCallback(async (chat) => {
    if (!chat) return
    setLoadingMsgs(true)
    try {
      const jid = encodeURIComponent(chat.id)
      const res = await fetch(`/api/conversations/${jid}?instance=${encodeURIComponent(chat.instance)}`)
      const data = await res.json()
      const sorted = (data.messages || []).slice().sort((a, b) => msgTimestamp(a) - msgTimestamp(b))
      setMessages(sorted)
    } catch (err) {
      console.error('loadMessages error', err)
    } finally {
      setLoadingMsgs(false)
    }
  }, [])

  // ── select a chat ──────────────────────────────────────────────────────────
  function selectChat(chat) {
    setSelected(chat)
    setMessages([])
    setReply('')
    setAiPaused(chat.lead?.ai_paused ?? false)
    loadMessages(chat)
  }

  // ── polling every 10 seconds while a chat is open ─────────────────────────
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current)
    if (!selected) return
    pollRef.current = setInterval(() => loadMessages(selected), 10000)
    return () => clearInterval(pollRef.current)
  }, [selected, loadMessages])

  // ── scroll to bottom on new messages ──────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── send reply ─────────────────────────────────────────────────────────────
  async function sendReply() {
    if (!reply.trim() || !selected || sending) return
    setSending(true)
    try {
      const jid = encodeURIComponent(selected.id)
      const res = await fetch(`/api/conversations/${jid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: reply.trim(), instance: selected.instance }),
      })
      const data = await res.json()
      if (data.success) {
        setReply('')
        await loadMessages(selected)
      }
    } catch (err) {
      console.error('sendReply error', err)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) sendReply()
  }

  // ── toggle AI ──────────────────────────────────────────────────────────────
  async function toggleAI() {
    if (!selected || togglingAI) return
    setTogglingAI(true)
    const newPaused = !aiPaused
    try {
      const jid = encodeURIComponent(selected.id)
      await fetch(`/api/conversations/${jid}/ai`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_paused: newPaused }),
      })
      setAiPaused(newPaused)
      // Update cached chat object so re-select retains state
      setChats(prev => prev.map(c =>
        c.id === selected.id
          ? { ...c, lead: c.lead ? { ...c.lead, ai_paused: newPaused } : c.lead }
          : c
      ))
      setSelected(prev => prev ? { ...prev, lead: prev.lead ? { ...prev.lead, ai_paused: newPaused } : prev.lead } : prev)
    } catch (err) {
      console.error('toggleAI error', err)
    } finally {
      setTogglingAI(false)
    }
  }

  // ── filtered chats ─────────────────────────────────────────────────────────
  const filtered = chats.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      chatName(c).toLowerCase().includes(q) ||
      (c.id || '').toLowerCase().includes(q) ||
      (c.lineLabel || '').toLowerCase().includes(q)
    )
  })

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--topnav-height))', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ── LEFT PANEL ───────────────────────────────────────────────────── */}
      <div style={{
        width: '320px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--panel)',
        borderRight: '1px solid var(--border)',
        overflow: 'hidden',
      }}>
        {/* header */}
        <div style={{ padding: '20px 20px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ fontWeight: 700, fontSize: '17px', color: 'var(--text)' }}>Conversaciones</div>
            <button
              onClick={loadChats}
              title="Actualizar"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
            >
              <Icon name="refresh" size={15} />
            </button>
          </div>
          {/* search */}
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-dim)', display: 'flex', alignItems: 'center' }}>
              <Icon name="scraper" size={14} />
            </div>
            <input
              type="text"
              placeholder="Buscar chat..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px 8px 32px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--text)',
                outline: 'none',
              }}
            />
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '8px' }}>
            {filtered.length} conversaci{filtered.length === 1 ? 'on' : 'ones'}
          </div>
        </div>

        {/* list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingChats ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px' }}>
              Cargando conversaciones...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Sin conversaciones</div>
              <div style={{ color: 'var(--text-dim)', fontSize: '12px', marginTop: '4px' }}>
                {search ? 'No hay resultados para tu busqueda' : 'No hay chats disponibles'}
              </div>
            </div>
          ) : filtered.map(chat => {
            const isSelected = selected?.id === chat.id
            const ts = chat.updatedAt || chat.lastMessage?.messageTimestamp || 0
            const unread = chat.unreadCount || 0
            const aiIsActive = !(chat.lead?.ai_paused)
            const hasLead = !!chat.lead

            return (
              <div
                key={`${chat.instance}-${chat.id}`}
                onClick={() => selectChat(chat)}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid var(--border-light)',
                  cursor: 'pointer',
                  background: isSelected ? 'var(--surface)' : 'transparent',
                  transition: 'background .12s',
                  position: 'relative',
                }}
              >
                {/* row 1: name + timestamp */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    {/* AI status dot */}
                    {hasLead && (
                      <div style={{
                        width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0,
                        background: aiIsActive ? 'var(--green)' : 'var(--orange)',
                      }} />
                    )}
                    <span style={{
                      fontWeight: 600,
                      fontSize: '13.5px',
                      color: 'var(--text)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {chatName(chat)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {unread > 0 && (
                      <span style={{
                        background: 'var(--accent)',
                        color: '#fff',
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '1px 5px',
                        borderRadius: '10px',
                        minWidth: '18px',
                        textAlign: 'center',
                      }}>
                        {unread > 99 ? '99+' : unread}
                      </span>
                    )}
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                      {formatTs(ts)}
                    </span>
                  </div>
                </div>

                {/* row 2: preview */}
                <div style={{
                  fontSize: '12.5px',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginBottom: '5px',
                }}>
                  {chatPreview(chat)}
                </div>

                {/* row 3: line badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    fontSize: '11px',
                    padding: '1px 7px',
                    borderRadius: '4px',
                    background: 'var(--accent-dim)',
                    color: 'var(--accent)',
                    fontWeight: 500,
                  }}>
                    {chat.lineLabel || chat.instance}
                  </span>
                  {hasLead && (
                    <span style={{
                      fontSize: '11px',
                      padding: '1px 7px',
                      borderRadius: '4px',
                      background: aiIsActive ? 'var(--green-dim)' : 'var(--orange-dim)',
                      color: aiIsActive ? 'var(--green)' : 'var(--orange)',
                      fontWeight: 500,
                    }}>
                      {aiIsActive ? 'IA activa' : 'IA pausada'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
        {!selected ? (
          // empty state
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', color: 'var(--text-muted)' }}>
            <Icon name="conversations" size={40} color="var(--border)" />
            <div style={{ fontSize: '15px', fontWeight: 500, color: 'var(--text-muted)' }}>
              Selecciona una conversacion
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
              Haz clic en un chat de la izquierda para ver los mensajes
            </div>
          </div>
        ) : (
          <>
            {/* ── chat header ───────────────────────────────────────────── */}
            <div style={{
              padding: '14px 24px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              background: 'var(--panel)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {/* avatar placeholder */}
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: 'var(--accent-dim)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Icon name="user" size={17} color="var(--accent)" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)' }}>
                    {chatName(selected)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <Icon name="phone" size={11} color="var(--text-dim)" />
                    <span>{selected.id?.replace(/@s\.whatsapp\.net$/, '') || '—'}</span>
                    <span style={{ color: 'var(--border)' }}>·</span>
                    <span style={{
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: 'var(--accent-dim)',
                      color: 'var(--accent)',
                      fontSize: '11px',
                      fontWeight: 500,
                    }}>
                      {selected.lineLabel || selected.instance}
                    </span>
                  </div>
                </div>
              </div>

              {/* AI toggle */}
              {selected.lead && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon name="bot" size={14} color={aiPaused ? 'var(--text-dim)' : 'var(--green)'} />
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {aiPaused ? 'IA en pausa' : 'IA activa'}
                    </span>
                  </div>
                  <div
                    onClick={toggleAI}
                    style={{
                      width: '40px', height: '22px', borderRadius: '11px',
                      background: aiPaused ? 'var(--border)' : 'var(--accent)',
                      cursor: togglingAI ? 'wait' : 'pointer',
                      position: 'relative',
                      transition: 'background .2s',
                      opacity: togglingAI ? 0.6 : 1,
                    }}
                  >
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      background: '#fff', position: 'absolute', top: '3px',
                      left: aiPaused ? '3px' : '21px', transition: 'left .2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                    }} />
                  </div>
                </div>
              )}
            </div>

            {/* ── messages ──────────────────────────────────────────────── */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              {loadingMsgs && messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px', marginTop: '60px' }}>
                  Cargando mensajes...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px', marginTop: '60px' }}>
                  No hay mensajes en esta conversacion
                </div>
              ) : messages.map((msg, i) => {
                const out = isOutgoing(msg)
                const ts = msgTimestamp(msg)
                const text = msgText(msg)
                const showDate = i === 0 || (() => {
                  const prev = messages[i - 1]
                  const prevTs = msgTimestamp(prev)
                  const curr = ts > 1e12 ? ts : ts * 1000
                  const p = prevTs > 1e12 ? prevTs : prevTs * 1000
                  return new Date(curr).toDateString() !== new Date(p).toDateString()
                })()

                return (
                  <div key={msg.key?.id || i}>
                    {showDate && ts > 0 && (
                      <div style={{ textAlign: 'center', marginBottom: '12px', marginTop: i === 0 ? 0 : '12px' }}>
                        <span style={{
                          fontSize: '11px',
                          color: 'var(--text-dim)',
                          background: 'var(--surface)',
                          padding: '3px 10px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-light)',
                        }}>
                          {new Date(ts > 1e12 ? ts : ts * 1000).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: out ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '75%',
                        padding: '8px 12px',
                        borderRadius: out ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
                        background: out ? 'var(--accent)' : 'var(--panel)',
                        border: out ? 'none' : '1px solid var(--border)',
                        color: out ? '#fff' : 'var(--text)',
                        fontSize: '14px',
                        lineHeight: 1.5,
                        wordBreak: 'break-word',
                        boxShadow: 'var(--shadow)',
                      }}>
                        <div>{text}</div>
                        {ts > 0 && (
                          <div style={{
                            fontSize: '11px',
                            color: out ? 'rgba(255,255,255,.65)' : 'var(--text-dim)',
                            marginTop: '4px',
                            textAlign: 'right',
                          }}>
                            {new Date(ts > 1e12 ? ts : ts * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* ── reply box ─────────────────────────────────────────────── */}
            <div style={{
              padding: '12px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '10px',
              flexShrink: 0,
              background: 'var(--panel)',
              alignItems: 'flex-end',
            }}>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribi un mensaje... (Cmd+Enter para enviar)"
                rows={2}
                style={{
                  flex: 1,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  color: 'var(--text)',
                  padding: '10px 14px',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'none',
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={sendReply}
                disabled={!reply.trim() || sending}
                style={{
                  background: reply.trim() && !sending ? 'var(--accent)' : 'var(--border)',
                  color: reply.trim() && !sending ? '#fff' : 'var(--text-dim)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  cursor: reply.trim() && !sending ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background .15s',
                }}
              >
                {sending ? (
                  <Icon name="refresh" size={16} color="var(--text-dim)" style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Icon name="send" size={16} color={reply.trim() ? '#fff' : 'var(--text-dim)'} />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
