import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServiceClient()

  const { data: mensajes } = await supabase
    .from('mensajes')
    .select('direction, content, phone, created_at, lead_id, leads(name)')
    .order('created_at', { ascending: false })
    .limit(40)

  const items = (mensajes || []).map(m => ({
    direction: m.direction,
    content: (m.content || '').slice(0, 80),
    phone: m.phone,
    lead_name: m.leads?.name || m.phone,
    created_at: m.created_at,
  }))

  return Response.json({ items })
}
