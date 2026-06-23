import { createServiceClient } from '@/lib/supabase'
import { getChats } from '@/lib/evolution'

export async function GET() {
  const supabase = createServiceClient()
  // Get all connected lines
  const { data: lines } = await supabase
    .from('whatsapp_lines')
    .select('*')
    .order('created_at')

  const allChats = []
  for (const line of (lines || [])) {
    const chats = await getChats(line.instance_name)
    for (const chat of chats) {
      allChats.push({
        ...chat,
        instance: line.instance_name,
        lineLabel: line.label,
      })
    }
  }

  // Sort by last message timestamp descending
  allChats.sort((a, b) => {
    const ta = a.updatedAt || a.lastMessage?.messageTimestamp || 0
    const tb = b.updatedAt || b.lastMessage?.messageTimestamp || 0
    return tb - ta
  })

  // Enrich with lead info from Supabase
  const phones = allChats.map(c => c.id?.replace(/@s\.whatsapp\.net$/, '').replace(/@g\.us$/, '')).filter(Boolean)
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, phone, status, ai_paused, assigned_line')
    .in('phone', phones)

  const leadsByPhone = (leads || []).reduce((acc, l) => {
    acc[l.phone?.replace(/\D/g, '')] = l
    return acc
  }, {})

  const enriched = allChats.map(chat => {
    const phone = chat.id?.replace(/@s\.whatsapp\.net$/, '').replace(/@g\.us$/, '')
    const lead = leadsByPhone[phone] || null
    return { ...chat, lead }
  })

  return Response.json({ chats: enriched })
}
