import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';

const AUTH_FOLDER = './mcp-auth';
const MSG_BUFFER_SIZE = 50; // Nachrichten pro Chat im Puffer

let sock = null;
let ready = false;
let logger = pino({ level: 'silent' }, process.stderr);

/** Ring-Buffer: jid → Message[] */
const messageBuffer = new Map();

export async function initWhatsApp(parentLogger) {
  if (parentLogger) logger = parentLogger;
  await connect();
}

async function connect() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    // WICHTIG: printQRInTerminal MUSS false sein im MCP-Modus.
    // stdout ist für das MCP stdio-Protokoll reserviert.
    // QR-Code einmalig via `node src/setup.js` scannen.
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      // Kein QR auf stdout! Hinweis auf setup.js schreiben.
      process.stderr.write(
        '\n[WhatsApp MCP] Keine gespeicherte Session gefunden.\n' +
        '[WhatsApp MCP] Bitte zuerst ausführen: node mcp/src/setup.js\n\n'
      );
    }

    if (connection === 'close') {
      ready = false;
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      if (code !== DisconnectReason.loggedOut) {
        logger.warn({ code }, 'Verbindung getrennt – verbinde neu...');
        setTimeout(() => connect(), 3000);
      } else {
        logger.error('Ausgeloggt. Bitte mcp-auth/ löschen und setup.js erneut ausführen.');
      }
    }

    if (connection === 'open') {
      ready = true;
      logger.info('WhatsApp MCP-Client verbunden.');
    }
  });

  // Eingehende Nachrichten in den Puffer schreiben
  sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      bufferMessage(msg);
    }
  });
}

function bufferMessage(msg) {
  const jid = msg.key.remoteJid;
  if (!jid || jid === 'status@broadcast') return;

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    null;

  if (!messageBuffer.has(jid)) messageBuffer.set(jid, []);
  const buf = messageBuffer.get(jid);

  buf.push({
    jid,
    fromMe: msg.key.fromMe ?? false,
    text,
    timestamp: Number(msg.messageTimestamp ?? 0),
    id: msg.key.id,
  });

  if (buf.length > MSG_BUFFER_SIZE) buf.shift();
}

// --- Öffentliche API ---

export function isConnected() {
  return ready;
}

export function getSocket() {
  if (!sock || !ready) throw new Error('WhatsApp nicht verbunden. Läuft setup.js noch?');
  return sock;
}

/** Telefonnummer → WhatsApp JID */
export function toJid(input) {
  if (input.includes('@')) return input;
  const digits = input.replace(/\D/g, '');
  return `${digits}@s.whatsapp.net`;
}

/** Gepufferte Nachrichten für einen Chat */
export function getBufferedMessages(jid, limit = 20) {
  return (messageBuffer.get(jid) ?? []).slice(-limit);
}

/** Alle JIDs mit gepufferten Nachrichten */
export function getBufferedJids() {
  return Array.from(messageBuffer.keys());
}
