import 'dotenv/config';
import express from 'express';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import pino from 'pino';
import { initWhatsApp } from './whatsappClient.js';
import { registerTools } from './tools.js';

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });
const PORT = parseInt(process.env.PORT ?? '3001', 10);
const API_TOKEN = process.env.API_TOKEN ?? null;

// ── WhatsApp-Verbindung aufbauen ─────────────────────────────────────────────
logger.info('Stelle WhatsApp-Verbindung her...');
logger.info('→ Falls QR-Code erscheint: mit WhatsApp scannen (Verknüpfte Geräte)');
await initWhatsApp(logger);

// ── MCP-Server erstellen ─────────────────────────────────────────────────────
const mcpServer = new McpServer({
  name: 'whatsapp',
  version: '1.0.0',
});
registerTools(mcpServer, logger);

// ── Express HTTP-Server (SSE-Transport) ──────────────────────────────────────
const app = express();
app.use(express.json());

// Einfache Token-Authentifizierung (optional, aber empfohlen)
if (API_TOKEN) {
  app.use((req, res, next) => {
    const token = req.headers['x-api-token'];
    if (token !== API_TOKEN) {
      res.status(401).json({ error: 'Unauthorized – x-api-token fehlt oder falsch' });
      return;
    }
    next();
  });
  logger.info('Token-Authentifizierung aktiv (API_TOKEN gesetzt)');
}

/** Aktive SSE-Sessions: sessionId → SSEServerTransport */
const sessions = new Map();

// MCP SSE-Endpunkt (Claude Code verbindet sich hier)
app.get('/sse', async (req, res) => {
  const transport = new SSEServerTransport('/messages', res);
  sessions.set(transport.sessionId, transport);

  res.on('close', () => {
    sessions.delete(transport.sessionId);
    logger.info({ sessionId: transport.sessionId }, 'SSE-Session geschlossen');
  });

  logger.info({ sessionId: transport.sessionId }, 'Neue MCP-Session verbunden');
  await mcpServer.connect(transport);
});

// MCP-Nachrichten-Endpunkt (POST von Claude Code)
app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = sessions.get(sessionId);

  if (!transport) {
    res.status(404).json({ error: `Session ${sessionId} nicht gefunden` });
    return;
  }

  await transport.handlePostMessage(req, res, req.body);
});

// Health-Check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', sessions: sessions.size });
});

// ── Server starten ────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  logger.info('─────────────────────────────────────────');
  logger.info(`WhatsApp MCP-Server läuft auf Port ${PORT}`);
  logger.info('');
  logger.info('Claude Code Konfiguration (.mcp.json):');
  logger.info('  {');
  logger.info('    "mcpServers": {');
  logger.info('      "whatsapp": {');
  logger.info('        "type": "sse",');
  logger.info(`        "url": "http://<Handy-IP>:${PORT}/sse"`);
  logger.info('      }');
  logger.info('    }');
  logger.info('  }');
  logger.info('');
  logger.info('Handy-IP ermitteln: ip addr | grep "inet 192"');
  logger.info('─────────────────────────────────────────');
});
