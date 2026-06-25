const SCRAPER_URL = process.env.SCRAPER_API_URL || 'https://gmaps-scraper-web-production.up.railway.app'

export async function GET(req, { params }) {
  const { jobId } = params
  const url = new URL(req.url)
  const download = url.searchParams.get('download')

  if (download) {
    try {
      const res = await fetch(`${SCRAPER_URL}/api/download/${jobId}`)
      const text = await res.text()
      const rows = parseCsv(text)
      return Response.json({ results: rows })
    } catch (err) {
      return Response.json({ results: [], error: err.message })
    }
  }

  // Proxy SSE stream
  const upstreamRes = await fetch(`${SCRAPER_URL}/api/stream/${jobId}`, {
    headers: { Accept: 'text/event-stream' },
  })

  return new Response(upstreamRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

function parseCsv(text) {
  const lines = text.trim().split('
')
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g,'').trim())
  return lines.slice(1).map(line => {
    const vals = line.match(/(".*?"|[^,]+)/g) || []
    const obj = {}
    headers.forEach((h, i) => { obj[h] = (vals[i]||'').replace(/^"|"$/g,'').trim() })
    return obj
  })
}
