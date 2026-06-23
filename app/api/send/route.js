import { sendWhatsApp } from '@/lib/evolution'

export async function POST(req) {
  const { phone, message, instance } = await req.json()
  if (!phone || !message) {
    return Response.json({ error: 'phone and message required' }, { status: 400 })
  }
  const result = await sendWhatsApp(phone, message, instance)
  return Response.json(result)
}
