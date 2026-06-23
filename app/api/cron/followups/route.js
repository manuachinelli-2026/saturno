import { createServiceClient } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/evolution'

// Vercel cron secret validation
function isAuthorized(req) {
  const authHeader = req.headers.get('authorization')
  return authHeader === `Bearer ${process.env.CRON_SECRET || ''}` ||
    req.headers.get('x-vercel-cron') === '1'
}

async function processFollowups() {
  const supabase = createServiceClient()
  const now = new Date().toISOString()

  const { data: config } = await supabase
    .from('agent_config').select('*').eq('key', 'default').single()

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .lte('next_followup_at', now)
    .in('status', ['contactado', 'respondio'])
    .lt('contact_step', 3)
    .not('next_followup_at', 'is', null)
    .limit(config?.max_daily_messages || 50)

  if (!leads?.length) return { processed: 0, results: [] }

  // Get available lines
  const { data: lines } = await supabase
    .from('whatsapp_lines')
    .select('*')
    .order('daily_sent', { ascending: true })

  const today = new Date().toISOString().slice(0, 10)
  const availableLines = (lines || []).filter(l => l.daily_sent < l.daily_limit)
  const fallbackInstance = process.env.EVOLUTION_INSTANCE || 'pepino-principal'

  const MSG_PER_LINE = 3
  let lineIndex = 0
  let lineCount = 0
  let processed = 0
  const results = []

  for (const lead of leads) {
    if (!lead.phone) continue

    const step = lead.contact_step || 1
    let message = ''
    if (step === 1) message = (config?.follow_up_day3 || '').replace('{nombre}', lead.name || '')
    else if (step === 2) message = (config?.follow_up_day7 || '').replace('{nombre}', lead.name || '')
    if (!message) continue

    // Line rotation
    if (availableLines.length > 0) {
      if (lineCount >= MSG_PER_LINE) {
        lineIndex = (lineIndex + 1) % availableLines.length
        lineCount = 0
      }
    }
    const currentLine = availableLines[lineIndex]
    const instance = currentLine?.instance_name || fallbackInstance

    const result = await sendWhatsApp(lead.phone, message, instance)

    // Update line daily count
    if (currentLine) {
      await supabase.from('whatsapp_lines')
        .update({ daily_sent: (currentLine.daily_sent || 0) + 1 })
        .eq('id', currentLine.id)
      currentLine.daily_sent = (currentLine.daily_sent || 0) + 1
    }

    const nextStep = step + 1
    const nextFollowup = nextStep < 3
      ? new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
      : null

    await supabase.from('leads').update({
      contact_step: nextStep,
      last_contacted_at: now,
      next_followup_at: nextFollowup,
      assigned_line: instance,
    }).eq('id', lead.id)

    await supabase.from('mensajes').insert({
      lead_id: lead.id,
      direction: 'saliente',
      phone: lead.phone,
      content: message,
      status: result.success ? 'enviado' : 'fallido',
      is_ai_response: false,
    })

    results.push({ name: lead.name, step, ok: result.success, line: instance })
    processed++
    lineCount++
    await new Promise(r => setTimeout(r, 500))
  }

  return { processed, results }
}

export async function GET(req) {
  if (!isAuthorized(req) && process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await processFollowups()
  return Response.json(result)
}

export async function POST(req) {
  const result = await processFollowups()
  return Response.json(result)
}
