import { createServiceClient } from '@/lib/supabase'

export async function GET(req) {
  const authHeader = req.headers.get('authorization')
  const isCron = req.headers.get('x-vercel-cron') === '1'
  if (!isCron && authHeader !== `Bearer ${process.env.CRON_SECRET || ''}` && process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = createServiceClient()
  const today = new Date().toISOString().slice(0, 10)
  const { error } = await supabase
    .from('whatsapp_lines')
    .update({ daily_sent: 0, last_reset_at: today })
    .neq('last_reset_at', today)
  return Response.json({ reset: !error, error: error?.message })
}
