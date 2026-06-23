import { createServiceClient } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/evolution'

// Process overdue follow-ups
export async function POST() {
  const supabase = createServiceClient()
  const now = new Date().toISOString()

  // Get config
  const { data: config } = await supabase
    .from('agent_config').select('*').eq('key', 'default').single()

  // Find leads due for follow-up
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .lte('next_followup_at', now)
    .in('status', ['contactado'])
    .lt('contact_step', 3)
    .limit(config?.max_daily_messages || 50)

  if (!leads?.length) return Response.json({ processed: 0 })

  let processed = 0
  const results = []

  for (const lead of leads) {
    if (!lead.phone) continue
    const step = lead.contact_step || 1
    let message = ''

    if (step === 1) {
      message = (config?.follow_up_day3 || '').replace('{nombre}', lead.name)
    } else if (step === 2) {
      message = (config?.follow_up_day7 || '').replace('{nombre}', lead.name)
    }

    if (!message) continue

    const result = await sendWhatsApp(lead.phone, message)

    const nextStep = step + 1
    const nextFollowup = nextStep < 3
      ? new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
      : null

    await supabase.from('leads').update({
      contact_step: nextStep,
      last_contacted_at: now,
      next_followup_at: nextFollowup,
    }).eq('id', lead.id)

    await supabase.from('mensajes').insert({
      lead_id: lead.id,
      direction: 'saliente',
      phone: lead.phone,
      content: message,
      status: result.success ? 'enviado' : 'fallido',
      is_ai_response: false,
    })

    results.push({ name: lead.name, step, ok: result.success })
    processed++
    await new Promise(r => setTimeout(r, 600))
  }

  return Response.json({ processed, results })
}
