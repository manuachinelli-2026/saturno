import { createServiceClient } from '@/lib/supabase'

export async function GET(req, { params }) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*, mensajes(*)')
    .eq('id', params.id)
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ lead: data })
}

export async function PATCH(req, { params }) {
  const body = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('leads')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ lead: data })
}

export async function DELETE(req, { params }) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('leads').delete().eq('id', params.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
