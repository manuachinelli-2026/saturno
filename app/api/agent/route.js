import { createServiceClient } from '@/lib/supabase'
import { sendWhatsApp } from '@/lib/evolution'

export async function POST(req) {
  const { lead_id, campana_id, incoming_message, override_prompt, override_product, override_price } = await req.json()
  if (!incoming_message) return Response.json({ error: 'No message' }, { status: 400 })

  const supabase = createServiceClient()

  // Load campaign and lead for context
  const [{ data: lead }, { data: campaign }] = await Promise.all([
    supabase.from('leads').select('*').eq('id', lead_id).single(),
    campana_id ? supabase.from('campanas').select('*').eq('id', campana_id).single() : Promise.resolve({ data: null }),
  ])

  // Load conversation history
  const { data: history } = await supabase
    .from('mensajes')
    .select('direction, content, is_ai_response')
    .eq('lead_id', lead_id)
    .order('created_at', { ascending: true })
    .limit(20)

  const PRODUCT_LABELS = { agente_ia:'Agente IA para WhatsApp', bot:'Bot de WhatsApp', pagina_web:'Página Web profesional', pack_completo:'Pack Completo de IA' }
  const productLabel = PRODUCT_LABELS[campaign?.product_offered] || 'nuestros servicios de IA'
  const price = campaign?.price_offered ? '€' + campaign.price_offered : 'un precio muy accesible'

  const productName = override_product || campaign?.product_offered || productLabel
  const priceStr = override_price ? `€${override_price}` : price

  const systemPrompt = override_prompt || campaign?.agent_prompt || `
Eres un agente de ventas de Pepino AI. Tu objetivo es vender ${productName} a ${lead?.name || 'este negocio'} por ${priceStr}.
Sé amigable, natural y conciso. Responde en el idioma del cliente.
No seas insistente. Si preguntan el precio, dilo claramente.
Si el cliente dice que sí, celebra y diles que los contactará el equipo pronto.
`

  const messages = (history || []).map(m => ({
    role: m.direction === 'saliente' ? 'assistant' : 'user',
    content: m.content,
  }))
  messages.push({ role: 'user', content: incoming_message })

  // Call OpenAI API
  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 300,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  })

  if (!openaiRes.ok) {
    const err = await openaiRes.json()
    return Response.json({ error: err.error?.message || 'AI error' }, { status: 500 })
  }

  const aiData = await openaiRes.json()
  const aiReply = aiData.choices?.[0]?.message?.content || ''

  if (!aiReply || !lead?.phone) return Response.json({ reply: aiReply, sent: false })

  // Send via WhatsApp
  const sendResult = await sendWhatsApp(lead.phone, aiReply, lead.assigned_line || undefined)

  // Save AI response
  await supabase.from('mensajes').insert({
    lead_id,
    campana_id: campana_id || null,
    direction: 'saliente',
    phone: lead.phone,
    content: aiReply,
    status: sendResult.success ? 'enviado' : 'fallido',
    is_ai_response: true,
  })

  return Response.json({ reply: aiReply, sent: sendResult.success })
}
