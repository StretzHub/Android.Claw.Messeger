# Android.Claw.Messeger

WhatsApp-Bot, der alle eingehenden Nachrichten an **Claude KI** weiterleitet und automatisch antwortet.

Läuft direkt auf einem **Android-Gerät via Termux** – kein separater Server nötig.

---

## Voraussetzungen

- Android-Gerät mit WhatsApp (dedizierte SIM-Karte empfohlen)
- Termux (aus **F-Droid** installieren, nicht aus dem Play Store)
- Anthropic API Key ([console.anthropic.com](https://console.anthropic.com))

---

## Setup auf dem Android-Gerät (Termux)

### 1. Termux vorbereiten

```bash
pkg update && pkg upgrade
pkg install nodejs git
```

### 2. Projekt klonen

```bash
git clone <repo-url>
cd Android.Claw.Messeger
```

### 3. Dependencies installieren

```bash
npm install
```

### 4. Konfiguration erstellen

```bash
cp .env.example .env
# Dann .env öffnen und ANTHROPIC_API_KEY eintragen:
nano .env
```

### 5. Bot starten

```bash
npm start
```

Ein QR-Code erscheint im Terminal. Öffne auf dem Gerät WhatsApp:
**Einstellungen → Verknüpfte Geräte → Gerät hinzufügen** → QR-Code scannen.

Der Bot ist verbunden, sobald `WhatsApp verbunden! Bot ist bereit.` erscheint.

---

## Verwendung

- **Normale Nachrichten**: Einfach an die Bot-Nummer schreiben – Claude antwortet automatisch.
- **`/reset`**: Gesprächsverlauf für diesen Kontakt löschen.
- Der Bot antwortet nur auf direkte Chats (keine Gruppen, keine Status-Updates).

---

## Dauerhafter Betrieb (Hintergrund)

Damit der Bot nicht beendet wird wenn Termux im Hintergrund ist:

```bash
# tmux installieren (Session bleibt nach App-Wechsel bestehen)
pkg install tmux

# Neue tmux-Session starten
tmux new -s bot

# Bot starten
npm start

# Termux im Hintergrund lassen: Strg+B, dann D (detach)
# Später wieder verbinden:
tmux attach -t bot
```

Außerdem in den Android-Einstellungen:
- **Akku-Optimierung** für Termux deaktivieren
- Termux-Benachrichtigung als **wichtig** markieren

---

## Konfiguration (.env)

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `ANTHROPIC_API_KEY` | – | Pflichtfeld: Claude API Key |
| `SYSTEM_PROMPT` | Hilfreicher Assistent | Persönlichkeit/Verhalten von Claude |
| `MAX_HISTORY` | `20` | Maximale Nachrichten im Gesprächsverlauf |
| `LOG_LEVEL` | `info` | Log-Verbosität: `silent`, `info`, `warn`, `error` |

---

## Fehlerbehebung

**Bot antwortet nicht:**
- `ANTHROPIC_API_KEY` in `.env` prüfen
- Internetverbindung prüfen
- Logs lesen: Fehlermeldungen erscheinen direkt im Terminal

**QR-Code wird nicht erkannt:**
- `auth/`-Ordner löschen und Bot neu starten: `rm -rf auth/ && npm start`

**Verbindung bricht ständig ab:**
- Akkuoptimierung für Termux deaktivieren
- tmux verwenden (siehe oben)

---

## Technologie

- **[Baileys](https://github.com/WhiskeySockets/Baileys)** – WhatsApp Web WebSocket-Bibliothek
- **[Anthropic SDK](https://github.com/anthropic-ai/sdk-python)** – Claude KI API
- **Node.js 18+** – Runtime
