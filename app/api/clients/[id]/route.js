import { createServiceClient } from '@/lib/supabase'

export async function PATCH(req, { params }) {
  const body = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('clientes')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ client: data })
}

export async function DELETE(req, { params }) {
  const supabase = createServiceClient()
  const { error } = await supabase.from('clientes').delete().eq('id', params.id)
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ success: true })
}
