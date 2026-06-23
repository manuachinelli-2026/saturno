import { createServiceClient } from '@/lib/supabase'

export async function GET(req) {
  const supabase = createServiceClient()
  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const pendingFollowup = url.searchParams.get('pending_followup') === 'true'
  const search = url.searchParams.get('q') || ''

  let query = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (status) query = query.eq('status', status)
  if (pendingFollowup) {
    query = query
      .lte('next_followup_at', new Date().toISOString())
      .not('next_followup_at', 'is', null)
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,industry.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ leads: data || [], count })
}

export async function POST(req) {
  const body = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('leads')
    .insert(body)
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ lead: data })
}
