import { createServiceClient } from '@/lib/supabase'

export async function GET() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('agent_config')
    .select('*')
    .eq('key', 'default')
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ config: data })
}

export async function POST(req) {
  const body = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('agent_config')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('key', 'default')
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ config: data })
}
