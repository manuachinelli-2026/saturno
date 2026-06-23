import { createServiceClient } from '@/lib/supabase'
import { getMessages, sendWhatsApp } from '@/lib/evolution'

export async function GET(req, { params }) {
  const { jid } = params
  const url = new URL(req.url)
  const instance = url.searchParams.get('instance') || process.env.EVOLUTION_INSTANCE || 'pepino-principal'
  const decodedJid = decodeURIComponent(jid)
  const messages = await getMessages(instance, decodedJid, 50)
  return Response.json({ messages })
}

export async function POST(req, { params }) {
  const { jid } = params
  const { text, instance } = await req.json()
  const decodedJid = decodeURIComponent(jid)
  const phone = decodedJid.replace(/@s\.whatsapp\.net$/, '')
  const result = await sendWhatsApp(phone, text, instance || process.env.EVOLUTION_INSTANCE || 'pepino-principal')

  // Save to mensajes
  const supabase = createServiceClient()
  const { data: lead } = await supabase.from('leads').select('id').eq('phone', phone).single()
  if (lead) {
    await supabase.from('mensajes').insert({
      lead_id: lead.id,
      direction: 'saliente',
      phone,
      content: text,
      status: result.success ? 'enviado' : 'fallido',
      is_ai_response: false,
    })
  }
  return Response.json(result)
}
