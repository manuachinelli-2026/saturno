const BASE_URL = process.env.EVOLUTION_API_URL || 'https://evolution.getpepino.ai'
const API_KEY  = process.env.EVOLUTION_API_KEY  || ''
const DEFAULT_INSTANCE = process.env.EVOLUTION_INSTANCE || 'pepino-principal'

async function evolFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'apikey': API_KEY,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.message || `Evolution error ${res.status}`)
  return data
}

export async function sendWhatsApp(phone, text, instance = DEFAULT_INSTANCE) {
  const clean = phone.replace(/\D/g, '')
  try {
    const data = await evolFetch(`/message/sendText/${instance}`, {
      method: 'POST',
      body: JSON.stringify({ number: clean, text }),
    })
    return { success: true, messageId: data.key?.id || data.id }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function getInstanceStatus(instance = DEFAULT_INSTANCE) {
  try {
    const data = await evolFetch(`/instance/connectionState/${instance}`)
    return data
  } catch {
    return { state: 'close' }
  }
}

export async function getInstanceQR(instance) {
  try {
    const data = await evolFetch(`/instance/connect/${instance}`)
    return { qr: data.qrcode?.base64 || data.base64 || null, pairingCode: data.code || null }
  } catch (err) {
    return { qr: null, error: err.message }
  }
}

export async function createInstance(instanceName) {
  try {
    const data = await evolFetch('/instance/create', {
      method: 'POST',
      body: JSON.stringify({ instanceName, qrcode: true, integration: 'WHATSAPP-BAILEYS' }),
    })
    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function deleteInstance(instance) {
  try {
    await evolFetch(`/instance/delete/${instance}`, { method: 'DELETE' })
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

export async function getChats(instance = DEFAULT_INSTANCE) {
  try {
    const data = await evolFetch(`/chat/findChats/${instance}`)
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export async function getMessages(instance, jid, limit = 40) {
  try {
    const enc = encodeURIComponent(jid)
    const data = await evolFetch(`/message/findMessages/${instance}?where[key.remoteJid]=${enc}&limit=${limit}`)
    return data?.messages?.records || data?.records || []
  } catch {
    return []
  }
}

export async function logoutInstance(instance) {
  try {
    await evolFetch(`/instance/logout/${instance}`, { method: 'DELETE' })
    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
