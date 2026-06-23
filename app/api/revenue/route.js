import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServiceClient()
  const [
    { data: allConversiones },
    { data: leads },
  ] = await Promise.all([
    supabase.from('conversiones').select('*, leads(name, phone, industry)').order('converted_at', { ascending: false }),
    supabase.from('leads').select('id, name'),
  ])

  const conv = allConversiones || []
  const totalIngresos = conv.reduce((s, c) => s + (c.amount || 0), 0)

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMes = conv.filter(c => new Date(c.converted_at) >= startOfMonth)
  const ingresosMes = thisMes.reduce((s, c) => s + (c.amount || 0), 0)

  // Last 6 months
  const monthly = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const monthConv = conv.filter(c => {
      const cd = new Date(c.converted_at)
      return cd >= d && cd < end
    })
    monthly.push({
      month: d.toLocaleString('es', { month: 'short' }),
      total: monthConv.reduce((s, c) => s + (c.amount || 0), 0),
      count: monthConv.length,
    })
  }

  return Response.json({
    conversiones: conv,
    totalIngresos,
    ingresosMes,
    conversionesMes: thisMes.length,
    ticketPromedio: conv.length ? Math.round(totalIngresos / conv.length) : 0,
    monthly,
    leads: leads || [],
  })
}

export async function POST(req) {
  const body = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('conversiones')
    .insert({ ...body, converted_at: new Date().toISOString() })
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  // Update lead status to 'convertido'
  if (body.lead_id) {
    await supabase.from('leads').update({ status: 'convertido' }).eq('id', body.lead_id)
  }
  return Response.json({ conversion: data })
}
