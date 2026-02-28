/**
 * Einmaliges Setup: WhatsApp mit QR-Code verbinden und Session speichern.
 *
 * Ausführen bevor Claude Code zum ersten Mal gestartet wird:
 *   node mcp/src/setup.js
 *
 * Danach ist mcp-auth/ befüllt und der MCP-Server startet ohne QR.
 */
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';

const AUTH_FOLDER = './mcp-auth';

console.log('╔══════════════════════════════════════╗');
console.log('║   WhatsApp MCP – Einmaliges Setup    ║');
console.log('╠══════════════════════════════════════╣');
console.log('║ 1. QR-Code erscheint gleich          ║');
console.log('║ 2. WhatsApp öffnen                   ║');
console.log('║ 3. Einstellungen → Verknüpfte Geräte ║');
console.log('║ 4. "Gerät hinzufügen" → QR scannen   ║');
console.log('╚══════════════════════════════════════╝');
console.log('');

const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
const { version } = await fetchLatestBaileysVersion();

const sock = makeWASocket({
  version,
  auth: {
    creds: state.creds,
    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
  },
  printQRInTerminal: true, // hier OK – setup.js ist kein MCP-Prozess
  logger: pino({ level: 'silent' }),
});

sock.ev.on('creds.update', saveCreds);

sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
  if (connection === 'open') {
    console.log('');
    console.log('✅ WhatsApp verbunden! Session gespeichert in mcp-auth/');
    console.log('');
    console.log('Nächste Schritte:');
    console.log('  claude   ← Claude Code starten (WhatsApp-Tools sind verfügbar)');
    process.exit(0);
  }

  if (connection === 'close') {
    const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
    if (code === DisconnectReason.loggedOut) {
      console.error('❌ Verbindung abgelehnt. Bitte erneut versuchen.');
      process.exit(1);
    }
  }
});
