import { sendWhatsApp } from '@/lib/evolution'
import { createServiceClient } from '@/lib/supabase'

const MSG_PER_LINE = 3 // anti-ban: max messages per line per batch

export async function POST(req) {
  const { leads, message } = await req.json()

  if (!leads || !Array.isArray(leads) || leads.length === 0) {
    return Response.json({ error: 'leads array required' }, { status: 400 })
  }
  if (!message) {
    return Response.json({ error: 'message required' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Fetch available lines ordered by least-used first
  const { data: lines, error: linesErr } = await supabase
    .from('whatsapp_lines')
    .select('*')
    .order('daily_sent', { ascending: true })

  if (linesErr || !lines || lines.length === 0) {
    return Response.json({ error: 'No WhatsApp lines available' }, { status: 500 })
  }

  // Reset daily counts if it's a new day
  const today = new Date().toISOString().slice(0, 10)
  for (const line of lines) {
    if (line.last_reset_at !== today) {
      await supabase
        .from('whatsapp_lines')
        .update({ daily_sent: 0, last_reset_at: today })
        .eq('id', line.id)
      line.daily_sent = 0
    }
  }

  const results = []
  let lineIndex = 0
  let lineCount = 0

  for (const lead of leads) {
    if (!lead.phone) {
      results.push({ id: lead.id, name: lead.name, ok: false, error: 'sin teléfono', line: null })
      continue
    }

    // Rotate line when per-batch limit is reached
    if (lineCount >= MSG_PER_LINE) {
      lineIndex = (lineIndex + 1) % lines.length
      lineCount = 0
    }

    // Find next line that hasn't hit daily limit (scan from current index)
    let skipped = 0
    while (
      lines[lineIndex] &&
      lines[lineIndex].daily_sent >= lines[lineIndex].daily_limit &&
      skipped < lines.length
    ) {
      lineIndex = (lineIndex + 1) % lines.length
      skipped++
    }

    const currentLine = lines[lineIndex]

    if (!currentLine || currentLine.daily_sent >= currentLine.daily_limit) {
      results.push({ id: lead.id, name: lead.name, ok: false, error: 'limite diario alcanzado', line: null })
      continue
    }

    const text = message.replace('{nombre}', lead.name || '')
    const result = await sendWhatsApp(lead.phone, text, currentLine.instance_name)

    if (result.success) {
      // Increment daily count in DB and in local cache
      await supabase
        .from('whatsapp_lines')
        .update({ daily_sent: currentLine.daily_sent + 1 })
        .eq('id', currentLine.id)
      currentLine.daily_sent++

      // Update lead with assigned line and contact tracking
      await supabase
        .from('leads')
        .update({
          assigned_line: currentLine.instance_name,
          status: 'contactado',
          contact_step: 1,
          last_contacted_at: new Date().toISOString(),
          next_followup_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', lead.id)

      // Log message in mensajes table
      await supabase.from('mensajes').insert({
        lead_id: lead.id,
        direction: 'saliente',
        phone: lead.phone,
        content: text,
        status: 'enviado',
        is_ai_response: false,
      })

      results.push({ id: lead.id, name: lead.name, ok: true, line: currentLine.instance_name, lineLabel: currentLine.label })
      lineCount++
    } else {
      results.push({ id: lead.id, name: lead.name, ok: false, error: result.error, line: currentLine.instance_name, lineLabel: currentLine.label })
    }
  }

  const sent = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok).length

  return Response.json({ results, sent, failed })
}
