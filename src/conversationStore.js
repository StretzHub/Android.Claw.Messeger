/**
 * Speichert den Gesprächsverlauf pro Absender im Arbeitsspeicher.
 * Format: Map<senderJid, Message[]>
 * Ältere Nachrichten werden automatisch gelöscht (MAX_HISTORY).
 */

const MAX_HISTORY = parseInt(process.env.MAX_HISTORY ?? '20', 10);

const store = new Map();

export function getHistory(senderJid) {
  return store.get(senderJid) ?? [];
}

export function addMessage(senderJid, role, content) {
  if (!store.has(senderJid)) {
    store.set(senderJid, []);
  }
  const history = store.get(senderJid);
  history.push({ role, content });

  // Verlauf auf MAX_HISTORY begrenzen (immer paarweise: user + assistant)
  while (history.length > MAX_HISTORY) {
    history.shift();
  }
}

export function clearHistory(senderJid) {
  store.delete(senderJid);
}
