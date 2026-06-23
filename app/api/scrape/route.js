const SCRAPER_URL = process.env.SCRAPER_API_URL || ''

export async function POST(req) {
  const body = await req.json()
  try {
    const res = await fetch(`${SCRAPER_URL}/api/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    return Response.json(data, { status: res.status })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
