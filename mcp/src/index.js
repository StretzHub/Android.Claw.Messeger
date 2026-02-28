import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import pino from 'pino';
import { initWhatsApp } from './whatsappClient.js';
import { registerTools } from './tools.js';

// Alles auf stderr – stdout ist für das MCP-Protokoll reserviert
const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' }, process.stderr);

// WhatsApp-Verbindung asynchron starten (nutzt gespeicherte Session aus mcp-auth/)
// Beim ersten Mal zuerst `node src/setup.js` ausführen um QR zu scannen!
initWhatsApp(logger).catch((err) => {
  logger.error({ err }, 'WhatsApp-Verbindung fehlgeschlagen');
});

const server = new McpServer({ name: 'whatsapp', version: '1.0.0' });
registerTools(server, logger);

const transport = new StdioServerTransport();
await server.connect(transport);
