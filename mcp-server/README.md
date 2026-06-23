# Saturno MCP Server

MCP server that exposes Saturno AI Outreach Dashboard operations as tools for Claude Code.

## Install

```bash
cd /Users/manuelachinelli/Desktop/saturno/mcp-server
npm install
```

## Configure in Claude Code

Add the following to your Claude Code MCP config file (`~/.claude/claude_desktop_config.json` or the MCP settings in Claude Code):

```json
{
  "mcpServers": {
    "saturno": {
      "command": "node",
      "args": ["/Users/manuelachinelli/Desktop/saturno/mcp-server/index.js"],
      "env": {
        "SATURNO_URL": "https://saturno-5dl6e2ner-manuels-projects-2cf06be8.vercel.app"
      }
    }
  }
}
```

Replace `SATURNO_URL` with your actual Vercel deployment URL if it differs.

## Available Tools

| Tool | Description |
|------|-------------|
| `get_stats` | Dashboard stats: leads, conversions, revenue, messages sent today, pending follow-ups |
| `get_leads` | List leads, optionally filtered by status (`pendiente`, `contactado`, `respondio`, `convertido`, `no_interesado`) |
| `launch_pipeline` | Scrape businesses from Google Maps and send WhatsApp outreach |
| `get_conversations` | List active WhatsApp conversations with AI state |
| `send_message` | Send a WhatsApp message to a phone number |
| `add_conversion` | Record a sale conversion for a lead |
| `run_followups` | Manually trigger all pending follow-up messages |
| `get_lines` | List all WhatsApp lines/instances and their connection status |
| `get_pending_followups` | Get leads due for a follow-up |

## Usage Examples in Claude Code

Once configured, you can ask Claude Code things like:

- "Show me today's Saturno stats"
- "List all converted leads"
- "Launch a pipeline for peluquerias in Madrid, 20 leads"
- "Send a WhatsApp to 34612345678 saying 'Hola, seguimos en contacto'"
- "Run pending follow-ups now"
- "What WhatsApp lines do I have connected?"
