import { getHistory, addMessage, clearHistory } from './conversationStore.js';
import { askClaude } from './claudeClient.js';

const WA_MSG_LIMIT = 4096;

/**
 * Verarbeitet eine eingehende WhatsApp-Nachricht und antwortet via Claude.
 * @param {object} sock  - Baileys Socket
 * @param {object} msg   - Baileys Message-Objekt
 * @param {object} logger
 */
export async function handleMessage(sock, msg, logger) {
  // Eigene Nachrichten ignorieren
  if (msg.key.fromMe) return;

  // Nur direkte Chats (keine Gruppen, keine Status-Updates)
  const jid = msg.key.remoteJid;
  if (!jid || jid === 'status@broadcast' || jid.endsWith('@g.us')) return;

  // Text extrahieren (normale Nachricht oder extended message)
  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    null;

  if (!text) return; // Medien, Sticker etc. vorerst ignorieren

  // Sonderbefehl: Gesprächsverlauf zurücksetzen
  if (text.trim().toLowerCase() === '/reset') {
    clearHistory(jid);
    await sock.sendMessage(jid, { text: 'Gesprächsverlauf wurde gelöscht.' });
    return;
  }

  logger.info({ jid, text }, 'Eingehende Nachricht');

  // Typing-Indikator senden
  await sock.sendPresenceUpdate('composing', jid);

  // Verlauf aktualisieren und Claude fragen
  addMessage(jid, 'user', text);
  const history = getHistory(jid);

  let reply;
  try {
    reply = await askClaude(history);
    addMessage(jid, 'assistant', reply);
  } catch (err) {
    logger.error({ err }, 'Fehler bei Claude API');
    reply = 'Entschuldigung, es gab einen Fehler. Bitte versuche es erneut.';
  }

  // Typing-Indikator beenden
  await sock.sendPresenceUpdate('paused', jid);

  // Lange Antworten aufteilen (WhatsApp-Limit: 4096 Zeichen)
  const chunks = splitMessage(reply, WA_MSG_LIMIT);
  for (const chunk of chunks) {
    await sock.sendMessage(jid, { text: chunk });
  }
}

function splitMessage(text, maxLen) {
  if (text.length <= maxLen) return [text];
  const chunks = [];
  let i = 0;
  while (i < text.length) {
    chunks.push(text.slice(i, i + maxLen));
    i += maxLen;
  }
  return chunks;
}
