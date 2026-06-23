import { createServiceClient } from '@/lib/supabase'
import { getInstanceStatus, createInstance, deleteInstance } from '@/lib/evolution'

export async function GET() {
  const supabase = createServiceClient()
  const { data: lines, error } = await supabase
    .from('whatsapp_lines')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) return Response.json({ error: error.message }, { status: 500 })

  // Enrich with live status from Evolution API
  const enriched = await Promise.all(
    (lines || []).map(async (line) => {
      const status = await getInstanceStatus(line.instance_name)
      const connected = status?.instance?.state === 'open' || status?.state === 'open'
      return { ...line, live_status: connected ? 'connected' : 'disconnected' }
    })
  )
  return Response.json({ lines: enriched })
}

export async function POST(req) {
  const { instance_name, label, daily_limit } = await req.json()
  if (!instance_name || !label) {
    return Response.json({ error: 'instance_name and label required' }, { status: 400 })
  }
  const supabase = createServiceClient()

  // Create in Evolution API
  const result = await createInstance(instance_name)
  if (!result.success) {
    // Instance may already exist, continue
    console.log('Evolution create warning:', result.error)
  }

  // Save to DB
  const { data, error } = await supabase
    .from('whatsapp_lines')
    .upsert({ instance_name, label, daily_limit: daily_limit || 80 }, { onConflict: 'instance_name' })
    .select()
    .single()
  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ line: data })
}
