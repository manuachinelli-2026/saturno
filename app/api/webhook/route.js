import { createServiceClient } from '@/lib/supabase'

// Evolution API sends incoming messages to this webhook
export async function POST(req) {
  try {
    const body = await req.json()
    const { data, event } = body

    if (event !== 'messages.upsert' && event !== 'message.received') {
      return Response.json({ ok: true })
    }

    const msg = data?.message || data?.messages?.[0]
    if (!msg) return Response.json({ ok: true })

    const phone = (msg.key?.remoteJid || '').replace('@s.whatsapp.net', '').replace('@c.us', '')
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ''
    const isFromMe = msg.key?.fromMe

    if (isFromMe || !phone || !text) return Response.json({ ok: true })

    const supabase = createServiceClient()

    // Find lead by phone
    const { data: lead } = await supabase
      .from('leads')
      .select('id, status')
      .eq('phone', phone)
      .single()

    // Save incoming message
    await supabase.from('mensajes').insert({
      lead_id: lead?.id || null,
      direction: 'entrante',
      phone,
      content: text,
      status: 'recibido',
    })

    // Update lead status
    if (lead && lead.status === 'contactado') {
      await supabase.from('leads').update({ status: 'respondido' }).eq('id', lead.id)
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
