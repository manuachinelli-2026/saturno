#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'

const SATURNO_URL = process.env.SATURNO_URL || 'https://saturno-5dl6e2ner-manuels-projects-2cf06be8.vercel.app'

async function callSaturno(path, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  }
  if (body) options.body = JSON.stringify(body)
  const res = await fetch(`${SATURNO_URL}${path}`, options)
  return res.json()
}

const server = new Server(
  { name: 'saturno-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_stats',
      description: 'Get Saturno dashboard stats: total leads, conversions, revenue, messages sent today, pending follow-ups',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_leads',
      description: 'List leads. Filter by status: pendiente, contactado, respondio, convertido, no_interesado',
      inputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'Filter by status (optional)' },
          limit: { type: 'number', description: 'Max results (default 20)' },
        },
      },
    },
    {
      name: 'launch_pipeline',
      description: 'Launch a full pipeline: scrape businesses from Google Maps and send WhatsApp outreach',
      inputSchema: {
        type: 'object',
        required: ['industry', 'city', 'count'],
        properties: {
          industry: { type: 'string', description: 'Industry to scrape (e.g. "peluquerías")' },
          city: { type: 'string', description: 'City to search in (e.g. "Madrid")' },
          count: { type: 'number', description: 'Number of leads to scrape (e.g. 20)' },
        },
      },
    },
    {
      name: 'get_conversations',
      description: 'Get active WhatsApp conversations with their status and AI state',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'send_message',
      description: 'Send a WhatsApp message to a phone number',
      inputSchema: {
        type: 'object',
        required: ['phone', 'message'],
        properties: {
          phone: { type: 'string', description: 'Phone number (e.g. "34612345678")' },
          message: { type: 'string', description: 'Message text to send' },
          instance: { type: 'string', description: 'WhatsApp line instance name (optional)' },
        },
      },
    },
    {
      name: 'add_conversion',
      description: 'Record a sale conversion for a lead',
      inputSchema: {
        type: 'object',
        required: ['lead_id', 'product', 'amount'],
        properties: {
          lead_id: { type: 'string', description: 'Lead UUID' },
          product: { type: 'string', description: 'Product sold' },
          amount: { type: 'number', description: 'Amount in euros' },
          notes: { type: 'string', description: 'Optional notes' },
        },
      },
    },
    {
      name: 'run_followups',
      description: 'Manually trigger processing of all pending follow-up messages',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_lines',
      description: 'List all WhatsApp lines/instances and their connection status',
      inputSchema: { type: 'object', properties: {} },
    },
    {
      name: 'get_pending_followups',
      description: 'Get leads that are due for a follow-up message',
      inputSchema: { type: 'object', properties: { limit: { type: 'number' } } },
    },
  ],
}))

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    let result

    switch (name) {
      case 'get_stats': {
        result = await callSaturno('/api/dashboard-stats')
        break
      }
      case 'get_leads': {
        const params = new URLSearchParams()
        if (args.status) params.set('status', args.status)
        if (args.limit) params.set('limit', args.limit)
        result = await callSaturno(`/api/leads?${params}`)
        break
      }
      case 'launch_pipeline': {
        result = await callSaturno('/api/pipeline/launch', 'POST', {
          industry: args.industry,
          city: args.city,
          count: args.count,
        })
        break
      }
      case 'get_conversations': {
        result = await callSaturno('/api/conversations')
        break
      }
      case 'send_message': {
        result = await callSaturno('/api/send', 'POST', {
          phone: args.phone,
          message: args.message,
          instance: args.instance,
        })
        break
      }
      case 'add_conversion': {
        result = await callSaturno('/api/revenue', 'POST', {
          lead_id: args.lead_id,
          product: args.product,
          amount: args.amount,
          notes: args.notes || '',
        })
        break
      }
      case 'run_followups': {
        result = await callSaturno('/api/cron/followups', 'POST')
        break
      }
      case 'get_lines': {
        result = await callSaturno('/api/lines')
        break
      }
      case 'get_pending_followups': {
        result = await callSaturno(`/api/leads?pending_followup=true&limit=${args.limit || 20}`)
        break
      }
      default:
        throw new Error(`Unknown tool: ${name}`)
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2),
      }],
    }
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Error: ${err.message}` }],
      isError: true,
    }
  }
})

const transport = new StdioServerTransport()
await server.connect(transport)
console.error('Saturno MCP server running')
