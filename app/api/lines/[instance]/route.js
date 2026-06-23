import { createServiceClient } from '@/lib/supabase'
import { deleteInstance, getInstanceQR, getInstanceStatus, logoutInstance } from '@/lib/evolution'

export async function DELETE(req, { params }) {
  const { instance } = params
  const supabase = createServiceClient()
  await deleteInstance(instance)
  await supabase.from('whatsapp_lines').delete().eq('instance_name', instance)
  return Response.json({ success: true })
}

export async function GET(req, { params }) {
  const { instance } = params
  const url = new URL(req.url)
  const action = url.searchParams.get('action')

  if (action === 'qr') {
    const { qr, pairingCode, error } = await getInstanceQR(instance)
    return Response.json({ qr, pairingCode, error })
  }
  if (action === 'status') {
    const status = await getInstanceStatus(instance)
    return Response.json(status)
  }
  if (action === 'logout') {
    const result = await logoutInstance(instance)
    return Response.json(result)
  }
  return Response.json({ error: 'Unknown action' }, { status: 400 })
}

export async function PATCH(req, { params }) {
  const { instance } = params
  const body = await req.json()
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('whatsapp_lines')
    .update(body)
    .eq('instance_name', instance)
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ line: data })
}
