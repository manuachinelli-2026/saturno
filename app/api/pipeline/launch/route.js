import { createServiceClient } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/evolution'
import { startScrape } from '@/lib/scraper'

export async function POST(req) {
  const { industry, city, count } = await req.json()
  if (!industry || !city || !count) {
    return Response.json({ error: 'industry, city, count required' }, { status: 400 })
  }

  // Start scrape job
  const job = await startScrape(`${industry} en ${city}`, count)
  if (!job.jobId) {
    return Response.json({ error: 'Failed to start scrape', details: job }, { status: 500 })
  }

  return Response.json({
    success: true,
    message: `Pipeline iniciado: scraping ${count} ${industry} en ${city}`,
    jobId: job.jobId,
    note: 'El scraping continúa en segundo plano. Los mensajes se enviarán automáticamente cuando el scraping termine.'
  })
}
