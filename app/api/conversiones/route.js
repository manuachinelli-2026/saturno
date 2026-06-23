import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('conversiones')
    .select('*, leads(name)')
    .order('converted_at', { ascending: false })
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ conversiones: data })
}

export async function POST(req) {
  const body = await req.json()
  const { lead_id, campana_id, product, amount, notes } = body
  if (!product || !amount) return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  const supabase = createServiceClient()
  const { data, error } = await supabase.from('conversiones').insert({
    lead_id: lead_id || null,
    campana_id: campana_id || null,
    product,
    amount: parseFloat(amount),
    notes: notes || null,
  }).select().single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  if (lead_id) await supabase.from('leads').update({ status: 'convertido' }).eq('id', lead_id)
  return Response.json({ conversion: data }, { status: 201 })
}
