import 'dotenv/config';
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import { handleMessage } from './messageHandler.js';

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });
const AUTH_FOLDER = './auth';

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version } = await fetchLatestBaileysVersion();

  logger.info({ version }, 'Baileys Version');

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
    },
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
    generateHighQualityLinkPreview: false,
    syncFullHistory: false,
  });

  // Session-Daten speichern sobald sie sich ändern
  sock.ev.on('creds.update', saveCreds);

  // Verbindungsstatus
  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      logger.info('QR-Code erscheint oben. Bitte mit WhatsApp scannen.');
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.warn({ statusCode }, 'Verbindung getrennt');

      if (shouldReconnect) {
        logger.info('Verbinde erneut in 3 Sekunden...');
        setTimeout(() => startBot(), 3000);
      } else {
        logger.error('Bot ausgeloggt. Bitte auth/-Ordner löschen und neu starten.');
        process.exit(1);
      }
    }

    if (connection === 'open') {
      logger.info('WhatsApp verbunden! Bot ist bereit.');
    }
  });

  // Eingehende Nachrichten verarbeiten
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try {
        await handleMessage(sock, msg, logger);
      } catch (err) {
        logger.error({ err }, 'Unbehandelter Fehler in handleMessage');
      }
    }
  });
}

startBot().catch((err) => {
  logger.error({ err }, 'Bot konnte nicht gestartet werden');
  process.exit(1);
});
