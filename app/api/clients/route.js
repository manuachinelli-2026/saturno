import { createServiceClient } from '@/lib/supabase'

export async function GET(req) {
  const supabase = createServiceClient()
  const url = new URL(req.url)
  const search = url.searchParams.get('q') || ''
  const status = url.searchParams.get('status') || ''

  let query = supabase
    .from('clientes')
    .select('*, leads(name, phone, industry, city)')
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,company.ilike.%${search}%`)
  }
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ clients: data || [] })
}

export async function POST(req) {
  const body = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('clientes')
    .insert(body)
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ client: data })
}
