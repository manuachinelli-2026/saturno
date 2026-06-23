import { createServiceClient } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/evolution'

// Verify webhook secret (optional but good practice)
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || ''

export async function POST(req) {
  try {
    const body = await req.json()
    const { event, instance, data } = body

    // Only handle incoming messages
    if (event !== 'messages.upsert') return Response.json({ ok: true })

    const key = data?.key || {}
    const fromMe = key.fromMe === true

    // Skip outgoing messages to avoid loops
    if (fromMe) return Response.json({ ok: true, skip: 'fromMe' })

    // Skip group messages (jid ends with @g.us)
    const remoteJid = key.remoteJid || ''
    if (remoteJid.endsWith('@g.us')) return Response.json({ ok: true, skip: 'group' })

    // Extract message text
    const msg = data?.message
    const text = msg?.conversation ||
      msg?.extendedTextMessage?.text ||
      msg?.imageMessage?.caption ||
      msg?.documentMessage?.caption ||
      ''

    if (!text) return Response.json({ ok: true, skip: 'no_text' })

    const phone = remoteJid.replace(/@s\.whatsapp\.net$/, '')
    const supabase = createServiceClient()

    // Find lead by phone
    const { data: lead } = await supabase
      .from('leads')
      .select('id, phone, name, ai_paused, assigned_line, status')
      .or(`phone.eq.${phone},phone.eq.+${phone}`)
      .single()

    // Save incoming message
    const msgInsert = {
      direction: 'entrante',
      phone,
      content: text,
      status: 'recibido',
      is_ai_response: false,
    }
    if (lead?.id) msgInsert.lead_id = lead.id

    await supabase.from('mensajes').insert(msgInsert)

    // If no lead found, skip AI
    if (!lead) return Response.json({ ok: true, skip: 'no_lead' })

    // Update lead status to 'respondio' if first reply
    if (lead.status === 'contactado') {
      await supabase.from('leads')
        .update({ status: 'respondio' })
        .eq('id', lead.id)
    }

    // Check if AI is enabled globally and not paused for this lead
    const { data: config } = await supabase
      .from('agent_config')
      .select('ai_enabled, max_daily_messages')
      .eq('key', 'default')
      .single()

    if (!config?.ai_enabled) return Response.json({ ok: true, skip: 'ai_disabled_globally' })
    if (lead.ai_paused) return Response.json({ ok: true, skip: 'ai_paused_for_lead' })

    // Call the AI agent
    const agentRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://saturno.vercel.app'}/api/agent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: lead.id,
        incoming_message: text,
      }),
    })

    const agentData = await agentRes.json()
    return Response.json({ ok: true, ai_responded: agentData.sent })

  } catch (err) {
    console.error('Webhook error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// Allow Evolution API to verify the webhook endpoint
export async function GET() {
  return Response.json({ status: 'ok', service: 'Saturno Webhook' })
}
