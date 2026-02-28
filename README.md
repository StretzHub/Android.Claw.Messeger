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
Claude Code (PC)
    ↕ MCP über HTTP/SSE (Heimnetz)
MCP-Server (Termux auf Android)
    ↕ Baileys WebSocket
WhatsApp Servers
    ↕
Dediziertes Handy (connected device)
```

### Setup (auf dem Android-Gerät in Termux)

```bash
cd Android.Claw.Messeger/mcp
npm install
cp .env.example .env
# .env anpassen (Port, optionaler API_TOKEN)
npm start
```

Beim ersten Start erscheint ein QR-Code → mit WhatsApp scannen (**Verknüpfte Geräte**).

Der Server gibt beim Start die nötige Claude Code-Konfiguration aus:

```
WhatsApp MCP-Server läuft auf Port 3001
Claude Code Konfiguration (.mcp.json):
  {
    "mcpServers": {
      "whatsapp": {
        "type": "sse",
        "url": "http://<Handy-IP>:3001/sse"
      }
    }
  }
Handy-IP ermitteln: ip addr | grep "inet 192"
```

### Claude Code konfigurieren (auf dem PC)

IP-Adresse des Handys ermitteln (in Termux):

```bash
ip addr | grep "inet 192"
# Beispiel: 192.168.1.42
```

Dann `.mcp.json` im Projektordner erstellen (Vorlage: `.mcp.json.example`):

```json
{
  "mcpServers": {
    "whatsapp": {
      "type": "sse",
      "url": "http://192.168.1.42:3001/sse"
    }
  }
}
```

Oder in `~/.claude.json` (global für alle Projekte) unter `mcpServers` eintragen.

Claude Code neu starten → WhatsApp-Tools sind verfügbar.

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

| Variable | Standard | Beschreibung |
|----------|----------|--------------|
| `PORT` | `3001` | HTTP-Port des MCP-Servers |
| `API_TOKEN` | leer | Optionaler Auth-Token (empfohlen!) |
| `LOG_LEVEL` | `info` | Log-Verbosität |

### Dauerhafter Betrieb (tmux)

```bash
pkg install tmux
tmux new -s mcp
cd Android.Claw.Messeger/mcp && npm start
# Strg+B, dann D zum Detach
tmux attach -t mcp  # Wieder verbinden
```

### Hinweise

- **Beide Modi gleichzeitig**: Bot (`src/`) und MCP (`mcp/`) nutzen separate `auth/`-Ordner und verbinden sich als verschiedene "Linked Devices". WhatsApp erlaubt bis zu 4 verknüpfte Geräte.
- **Nachrichten-Puffer**: `whatsapp_get_messages` zeigt nur Nachrichten, die seit dem Start des MCP-Servers eingegangen sind (kein historischer Verlauf).
- **Heimnetz**: Der MCP-Server ist ohne Token aus dem lokalen Netzwerk erreichbar. Für Fernzugriff SSH-Tunnel oder VPN verwenden.

### Technologie (MCP-Plugin)

- **[Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk)** – MCP Server (SSE-Transport)
- **[Baileys](https://github.com/WhiskeySockets/Baileys)** – WhatsApp Verbindung
- **[Express](https://expressjs.com/)** – HTTP-Server für SSE
- **[Zod](https://zod.dev/)** – Tool-Parameter-Validierung
