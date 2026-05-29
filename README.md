# D&D Session Recorder Bot

A Discord bot that records voice channel audio during D&D sessions and transcribes them locally using Whisper. Free, private, runs entirely on your hardware. Includes a web-based control panel — no command line needed after setup.

## Features

- **One-click launch** — double-click `start.bat` and everything runs
- **Web control panel** — manage recordings, transcribe, and configure from your browser
- Record per-user audio streams (perfect speaker attribution)
- Transcribe locally with faster-whisper (free, no API keys)
- Auto-detects GPU for fast transcription, falls back to CPU
- Map Discord display names to character names (no Developer Mode needed)
- Multiple transcription presets (fast → best quality)
- Condense transcripts by removing filler words and table talk
- JSON output compatible with campaign management tools

## Quick Start

### First Time Setup

**Windows:**
```
setup.bat
```

**Mac/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

The setup script will:
1. Check that Node.js and Python are installed
2. Install all dependencies
3. Detect GPU and install acceleration libraries if available
4. Walk you through bot token configuration

### Running the Bot

**Windows (recommended):**
- Double-click `start.bat` — opens the control panel in your browser automatically
- Or double-click `start-hidden.vbs` — runs silently in the background (no terminal window)

**Mac/Linux:**
```bash
npm start
```
Then open http://localhost:3000 in your browser.

### Stopping the Bot

- If using `start.bat`: close the terminal window
- If using `start-hidden.vbs`: open Task Manager, find `node.exe`, and end the task
- Or use the terminal: `Ctrl+C`

## Prerequisites

- **Node.js** 18+ — [download](https://nodejs.org/)
- **Python** 3.10+ — [download](https://www.python.org/downloads/)
- A Discord bot token — [create one](https://discord.com/developers/applications)

## Control Panel

Once running, open **http://localhost:3000** to access:

| Tab | What it does |
|-----|-------------|
| **Recordings** | View all recorded sessions, click to transcribe |
| **Transcripts** | View, read, and condense transcripts |
| **Characters** | Map Discord names to character names |
| **Settings** | Configure bot token and command prefix |

## Discord Setup

### Creating a Bot Token

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **New Application** and give it a name
3. Go to **Bot** in the left sidebar
4. Click **Reset Token** and copy it
5. Under **Privileged Gateway Intents**, enable:
   - Server Members Intent
   - Message Content Intent

### Adding the Bot to Your Server

1. Go to **OAuth2 > URL Generator** in the left sidebar
2. Check **bot** under Scopes
3. Check permissions: **Connect**, **Speak**, **View Channels**, **Send Messages**, **Read Message History**
4. Copy the generated URL and open it in your browser
5. Select your server and authorize

## Configuration

### Character Map

Open the **Characters** tab in the control panel, or edit `config/characters.json`:

```json
{
  "characterMap": {
    "Heather": "Gilbert",
    "Mike": "John McClean",
    "Sarah": "Thornwick"
  },
  "dmUsername": "Brandon"
}
```

Use Discord display names — no need to look up user IDs.

## Discord Commands

| Command | Description |
|---------|-------------|
| `!join` | Bot joins your current voice channel |
| `!leave` | Bot leaves voice channel (stops recording) |
| `!session start "Title"` | Start recording with a session title |
| `!session stop` | Stop recording and save audio files |
| `!status` | Check current recording status |
| `!help` | Show available commands |

## Transcription

Use the **Recordings** tab in the control panel and click **Transcribe**, or from the command line:

```bash
cd transcriber
venv\Scripts\activate
python transcribe.py --preset quality
```

### Presets

| Preset | Model | Best For |
|--------|-------|----------|
| `fast` | tiny | Quick drafts, testing |
| `balanced` | small | Most hardware, good accuracy |
| `quality` | medium | Recommended default |
| `best` | large-v3 | Best accuracy (GPU recommended) |

### Condensing

Use the **Transcripts** tab and click **Condense**, or from the command line:

```bash
python condense.py transcripts/session.json --mode aggressive
```

| Mode | What it does |
|------|-------------|
| `normal` | Remove fillers, merge consecutive segments |
| `aggressive` | Also removes table talk (mic checks, breaks) |
| `game-only` | Keeps only D&D content + all DM narration |

## Output Format

```json
{
  "sessionId": "uuid",
  "title": "Confrontation at Night's Rest",
  "date": "2026-05-27",
  "duration": "2:34:12",
  "transcript": [
    {
      "start": 0.0,
      "end": 3.45,
      "speaker": "DM",
      "text": "You enter the cavern and the air grows cold..."
    }
  ],
  "notes": "[0:00:00] DM: You enter the cavern...",
  "recap": "",
  "whatsNext": "",
  "loot": ""
}
```

## Project Structure

```
├── src/
│   ├── bot.js           # Discord bot + entry point
│   ├── bot-state.js     # Shared state for UI
│   ├── ui-server.js     # Web control panel server
│   ├── recorder.js      # Audio recording logic
│   ├── opus-decoder.js  # Opus to PCM stream decoder
│   └── utils.js         # Shared utilities
├── ui/
│   ├── index.html       # Control panel page
│   ├── style.css        # Styling
│   └── app.js           # Frontend logic
├── transcriber/
│   ├── transcribe.py    # Main transcription pipeline
│   ├── condense.py      # Transcript condensing
│   └── requirements.txt # Python dependencies
├── config/
│   └── characters.example.json  # Template for character mapping
├── recordings/          # Raw audio files (gitignored)
├── transcripts/         # Output JSON/TXT files (gitignored)
├── start.bat            # Windows launcher (with terminal)
├── start-hidden.vbs     # Windows launcher (no terminal)
├── setup.bat            # Windows setup script
├── setup.sh             # Mac/Linux setup script
└── package.json
```

## Hardware Requirements

| Setup | RAM | Transcription Speed | Recommended Preset |
|-------|-----|--------------------|--------------------|
| CPU only, 8GB RAM | 8GB+ | ~15-20 min per hour of audio | balanced |
| CPU only, 16GB RAM | 16GB+ | ~10-15 min per hour of audio | quality |
| NVIDIA GPU, 6GB VRAM | 16GB+ | ~3-5 min per hour of audio | best |
| NVIDIA GPU, 8GB+ VRAM | 16GB+ | ~2-3 min per hour of audio | best |

## Troubleshooting

**Bot doesn't respond to commands:**
- Make sure Message Content Intent is enabled in the Discord Developer Portal
- Check that the bot has View Channels permission in the text channel

**Bot joins but "Failed to join voice channel":**
- Ensure the bot has Connect and Speak permissions on the voice channel
- Check that Privileged Gateway Intents are enabled

**No audio files after recording:**
- The voice connection may not have fully established
- Try `!leave` then `!join` again before starting a session

**Transcription hallucinating (wrong text):**
- Make sure you're transcribing a recording made with the current bot version
- Try a larger model (--preset quality or --preset best)

**CUDA/GPU errors:**
- Use the "balanced" or "quality" preset (they work fine on CPU)
- Or select a preset in the control panel — it auto-detects your hardware

**Control panel won't open:**
- Make sure the bot is running (`start.bat` or `npm start`)
- Try manually opening http://localhost:3000 in your browser
