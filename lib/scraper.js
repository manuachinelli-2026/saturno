const SCRAPER_URL = process.env.SCRAPER_API_URL || process.env.NEXT_PUBLIC_SCRAPER_URL || 'https://gmaps-scraper-web-production.up.railway.app'

export async function startScrape(search, total = 20) {
  const res = await fetch(`${SCRAPER_URL}/api/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ search, total }),
  })
  if (!res.ok) throw new Error(`Scraper error ${res.status}`)
  const data = await res.json()
  // Normalize job_id / jobId so callers can use either
  if (data.job_id && !data.jobId) data.jobId = data.job_id
  return data
}

export function getScrapeStream(jobId) {
  return new EventSource(`${SCRAPER_URL}/api/stream/${jobId}`)
}

export async function downloadResults(jobId) {
  const res = await fetch(`${SCRAPER_URL}/api/download/${jobId}`)
  if (!res.ok) throw new Error('No se pudo descargar el resultado')
  const text = await res.text()
  return parseCsv(text)
}

function parseCsv(text) {
  const lines = text.trim().split(/\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  return lines.slice(1).map(line => {
    const vals = line.match(/(".*?"|[^,]+)/g) || []
    const obj = {}
    headers.forEach((h, i) => {
      obj[h] = (vals[i] || '').replace(/^"|"$/g, '').trim()
    })
    return obj
  })
}