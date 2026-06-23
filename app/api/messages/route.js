import { sendWhatsApp } from '@/lib/evolution'
import { createServiceClient } from '@/lib/supabase'

export async function POST(req) {
  const { phone, text, lead_id, campana_id } = await req.json()
  if (!phone || !text) return Response.json({ success: false, error: 'Faltan datos' }, { status: 400 })

  const result = await sendWhatsApp(phone, text)
  const supabase = createServiceClient()

  await supabase.from('mensajes').insert({
    lead_id: lead_id || null,
    campana_id: campana_id || null,
    direction: 'saliente',
    phone,
    content: text,
    status: result.success ? 'enviado' : 'fallido',
    is_ai_response: false,
  })

  return Response.json(result)
}
