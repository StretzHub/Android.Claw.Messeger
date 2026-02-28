import { z } from 'zod';
import {
  isConnected,
  getSocket,
  toJid,
  getBufferedMessages,
  getBufferedJids,
} from './whatsappClient.js';

/**
 * Registriert alle MCP-Tools am McpServer.
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 * @param {import('pino').Logger} logger
 */
export function registerTools(server, logger) {

  // ── whatsapp_status ────────────────────────────────────────────────────────
  server.tool(
    'whatsapp_status',
    'Prüft ob die WhatsApp-Verbindung aktiv ist',
    {},
    async () => ({
      content: [{
        type: 'text',
        text: isConnected()
          ? '✅ WhatsApp ist verbunden und bereit.'
          : '❌ WhatsApp ist NICHT verbunden. QR-Code scannen und neu starten.',
      }],
    })
  );

  // ── whatsapp_send ──────────────────────────────────────────────────────────
  server.tool(
    'whatsapp_send',
    'Sendet eine WhatsApp-Textnachricht an eine Nummer oder JID',
    {
      to: z.string().describe(
        'Telefonnummer mit Ländervorwahl (z.B. +491234567890) oder WhatsApp JID'
      ),
      message: z.string().min(1).describe('Der zu sendende Text'),
    },
    async ({ to, message }) => {
      const sock = getSocket();
      const jid = toJid(to);

      const sent = await sock.sendMessage(jid, { text: message });
      logger?.info({ jid, id: sent.key.id }, 'Nachricht gesendet');

      return {
        content: [{
          type: 'text',
          text: `Nachricht erfolgreich gesendet an ${jid}\nNachrichten-ID: ${sent.key.id}`,
        }],
      };
    }
  );

  // ── whatsapp_get_messages ──────────────────────────────────────────────────
  server.tool(
    'whatsapp_get_messages',
    'Liest die letzten Nachrichten aus einem bestimmten Chat (aus dem Live-Puffer)',
    {
      from: z.string().describe(
        'Telefonnummer mit Ländervorwahl oder WhatsApp JID des Chats'
      ),
      limit: z.number().int().min(1).max(50).default(20).describe(
        'Maximale Anzahl zurückzugebender Nachrichten (Standard: 20, max: 50)'
      ),
    },
    async ({ from, limit }) => {
      const jid = toJid(from);
      const messages = getBufferedMessages(jid, limit);

      if (messages.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `Keine Nachrichten von ${jid} im Puffer.\n` +
                  'Hinweis: Es werden nur Nachrichten gepuffert, die seit dem Start des MCP-Servers empfangen wurden.',
          }],
        };
      }

      const lines = messages.map((m) => {
        const time = new Date(m.timestamp * 1000).toLocaleString('de-DE');
        const who = m.fromMe ? 'Du' : m.jid.split('@')[0];
        const text = m.text ?? '(kein Text – Medien/Sticker)';
        return `[${time}] ${who}: ${text}`;
      });

      return {
        content: [{
          type: 'text',
          text: `Nachrichten von ${jid} (${messages.length} Nachrichten):\n\n${lines.join('\n')}`,
        }],
      };
    }
  );

  // ── whatsapp_list_chats ────────────────────────────────────────────────────
  server.tool(
    'whatsapp_list_chats',
    'Listet alle Chats auf, für die seit dem Start Nachrichten gepuffert wurden',
    {},
    async () => {
      const jids = getBufferedJids();

      if (jids.length === 0) {
        return {
          content: [{
            type: 'text',
            text: 'Noch keine Nachrichten empfangen. Der Puffer ist leer.\n' +
                  'Schicke eine Nachricht an die Bot-Nummer um den Chat zu aktivieren.',
          }],
        };
      }

      const lines = jids.map((jid) => {
        const msgs = getBufferedMessages(jid, 1);
        const last = msgs[0];
        const preview = last?.text ? `"${last.text.slice(0, 40)}${last.text.length > 40 ? '…' : ''}"` : '(Medien)';
        return `• ${jid}  →  ${preview}`;
      });

      return {
        content: [{
          type: 'text',
          text: `Aktive Chats (${jids.length}):\n\n${lines.join('\n')}`,
        }],
      };
    }
  );
}
