# Android.Claw.Messeger

Zwei komplementäre WhatsApp ↔ Claude Integrationen, beide laufen auf **Android via Termux**:

| Modus | Beschreibung |
|-------|-------------|
| **Bot** (`src/`) | WhatsApp-Nachrichten werden automatisch von Claude beantwortet |
| **MCP-Plugin** (`mcp/`) | Claude Code kann aktiv WhatsApp-Nachrichten senden & lesen |

---

## Modus 1: WhatsApp-Bot (Claude antwortet automatisch)

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

## Technologie (Bot)

- **[Baileys](https://github.com/WhiskeySockets/Baileys)** – WhatsApp Web WebSocket-Bibliothek
- **[Anthropic SDK](https://github.com/anthropics/sdk-python)** – Claude KI API
- **Node.js 18+** – Runtime

---

## Modus 2: WhatsApp MCP-Plugin (Claude nutzt WhatsApp als Werkzeug)

Ein **MCP-Server** (Model Context Protocol), der auf dem Android-Gerät in Termux läuft und Claude Code erlaubt, aktiv mit WhatsApp zu interagieren.

Claude Code (auf dem PC) kann über dieses Plugin:
- 📨 WhatsApp-Nachrichten senden
- 📬 Nachrichten aus bestehenden Chats lesen
- 📋 Aktive Chats auflisten
- 🔍 Verbindungsstatus prüfen

### Architektur

```
Alles auf einem Android-Gerät (Termux):

Claude Code (Termux)
    ↕ stdio (MCP-Protokoll, lokaler Prozess)
MCP-Server (Node.js, Subprocess von Claude Code)
    ↕ Baileys WebSocket
WhatsApp Servers
```

Kein PC, kein Netzwerk, kein separater Server-Prozess nötig.

### Setup (einmalig, auf dem Android-Gerät in Termux)

#### 1. Termux & Abhängigkeiten

```bash
pkg update && pkg upgrade
pkg install nodejs git
```

#### 2. Claude Code installieren

```bash
npm install -g @anthropic-ai/claude-code
```

#### 3. Projekt & MCP-Dependencies

```bash
cd Android.Claw.Messeger/mcp
npm install
```

#### 4. WhatsApp einmalig verbinden (QR-Code scannen)

```bash
node src/setup.js
# → QR-Code erscheint
# → WhatsApp → Einstellungen → Verknüpfte Geräte → Gerät hinzufügen
# → ✅ Session gespeichert in mcp-auth/
```

Dieser Schritt ist nur beim allerersten Mal nötig. Die Session bleibt gespeichert.

#### 5. MCP-Konfiguration erstellen

Im Projektordner (eine Ebene über `mcp/`):

```bash
cp .mcp.json.example .mcp.json
```

Die Datei sieht so aus – keine Änderungen nötig:

```json
{
  "mcpServers": {
    "whatsapp": {
      "type": "stdio",
      "command": "node",
      "args": ["mcp/src/index.js"]
    }
  }
}
```

#### 6. Claude Code starten

```bash
cd Android.Claw.Messeger
claude
```

Claude Code startet den MCP-Server automatisch im Hintergrund.
WhatsApp-Tools sind sofort verfügbar.

### Verfügbare Tools

| Tool | Beschreibung |
|------|-------------|
| `whatsapp_status` | Prüft ob WhatsApp verbunden ist |
| `whatsapp_send` | Sendet eine Nachricht an eine Nummer |
| `whatsapp_get_messages` | Liest letzte Nachrichten aus einem Chat |
| `whatsapp_list_chats` | Listet Chats mit gepufferten Nachrichten |

### Beispiel-Nutzung in Claude Code

```
"Schick mir eine WhatsApp an +491234567890 mit dem Text 'Kaufe Milch!'"

"Was hat mir +491234567890 zuletzt geschrieben?"

"Schreib an alle Chats die heute aktiv waren eine kurze Zusammenfassung"
```

### Konfiguration MCP (.env)

Optional – Datei `mcp/.env` anlegen:

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `LOG_LEVEL` | `info` | Log-Verbosität: `silent`, `info`, `warn`, `error` |

### Hinweise

- **stdio-Transport**: Claude Code startet den MCP-Server als Subprocess. Kein separater Prozess, kein Port, kein Netzwerk nötig.
- **Einmaliges Setup**: Nach dem ersten QR-Scan läuft alles automatisch. Session bleibt in `mcp/mcp-auth/` gespeichert.
- **Beide Modi gleichzeitig**: Bot (`src/`) und MCP (`mcp/`) nutzen separate `auth/`-Ordner → zwei verschiedene Linked Devices. WhatsApp erlaubt bis zu 4.
- **Nachrichten-Puffer**: `whatsapp_get_messages` zeigt Nachrichten, die seit dem Start des MCP-Servers eingegangen sind.
- **Session erneuern**: `rm -rf mcp/mcp-auth/ && node mcp/src/setup.js`

### Technologie (MCP-Plugin)

- **[Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)** – MCP Server (stdio-Transport)
- **[Baileys](https://github.com/WhiskeySockets/Baileys)** – WhatsApp Verbindung
- **[Zod](https://zod.dev/)** – Tool-Parameter-Validierung
