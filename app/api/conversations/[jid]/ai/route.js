import { createServiceClient } from '@/lib/supabase'

export async function PATCH(req, { params }) {
  const { jid } = params
  const { ai_paused } = await req.json()
  const phone = decodeURIComponent(jid).replace(/@s\.whatsapp\.net$/, '')
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('leads')
    .update({ ai_paused })
    .eq('phone', phone)
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ lead: data })
}
