import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServiceClient()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [
    { count: totalLeads },
    { count: leadsContactados },
    { count: leadsRespondieron },
    { data: conversiones },
    { data: mensajesHoy },
    { count: followupsPendientes },
    { data: ultimasConversiones },
    { data: leadsByStatus },
    { data: whatsappLines },
  ] = await Promise.all([
    supabase.from('leads').select('*', { count: 'exact', head: true }),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'contactado'),
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .not('status', 'eq', 'pendiente')
      .not('status', 'eq', 'contactado'),
    supabase.from('conversiones').select('amount').gte('converted_at', startOfMonth),
    supabase.from('mensajes').select('id').eq('direction', 'saliente').gte('created_at', startOfDay),
    supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .lte('next_followup_at', now.toISOString())
      .not('next_followup_at', 'is', null),
    supabase
      .from('conversiones')
      .select('*, leads(name)')
      .order('converted_at', { ascending: false })
      .limit(5),
    supabase.from('leads').select('status'),
    supabase.from('whatsapp_lines').select('*').order('created_at', { ascending: true }),
  ])

  const ingresosMes = (conversiones || []).reduce((s, c) => s + (c.amount || 0), 0)
  const statusCounts = (leadsByStatus || []).reduce((acc, l) => {
    acc[l.status] = (acc[l.status] || 0) + 1
    return acc
  }, {})

  return Response.json({
    totalLeads: totalLeads || 0,
    leadsContactados: leadsContactados || 0,
    leadsRespondieron: leadsRespondieron || 0,
    conversionesMes: (conversiones || []).length,
    ingresosMes,
    mensajesHoy: (mensajesHoy || []).length,
    followupsPendientes: followupsPendientes || 0,
    tasaRespuesta: leadsContactados
      ? Math.round(((leadsRespondieron || 0) / leadsContactados) * 100)
      : 0,
    tasaConversion:
      leadsRespondieron || 0
        ? Math.round(((conversiones || []).length / (leadsRespondieron || 1)) * 100)
        : 0,
    ultimasConversiones: ultimasConversiones || [],
    statusCounts,
    whatsappLines: whatsappLines || [],
  })
}
