const BASE_URL = process.env.EVOLUTION_API_URL || 'https://evolution.getpepino.ai'
const API_KEY  = process.env.EVOLUTION_API_KEY  || ''
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'pepino-principal'

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
  if (!res.ok) throw new Error(data.message || `Evolution API error ${res.status}`)
  return data
}

export async function sendWhatsApp(phone, text, instance = INSTANCE) {
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

export async function getInstanceStatus(instance = INSTANCE) {
  try {
    return await evolFetch(`/instance/connectionState/${instance}`)
  } catch {
    return { state: 'desconocido' }
  }
}
