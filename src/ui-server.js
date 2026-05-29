const express = require('express');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'ui')));

// --- API Routes ---

// Get bot status
app.get('/api/status', (req, res) => {
  const botModule = require('./bot-state');
  res.json({
    botOnline: botModule.isBotOnline(),
    activeSession: botModule.getActiveSession(),
    connectedGuilds: botModule.getConnectedGuilds(),
  });
});

// Get character map
app.get('/api/characters', (req, res) => {
  const configPath = path.join(process.cwd(), 'config', 'characters.json');
  try {
    const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    res.json(data);
  } catch {
    res.json({ characterMap: {}, dmUsername: "" });
  }
});

// Save character map
app.post('/api/characters', (req, res) => {
  const configPath = path.join(process.cwd(), 'config', 'characters.json');
  const configDir = path.dirname(configPath);
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// Get list of recordings
app.get('/api/recordings', (req, res) => {
  const recordingsDir = path.join(process.cwd(), 'recordings');
  if (!fs.existsSync(recordingsDir)) return res.json([]);

  const sessions = fs.readdirSync(recordingsDir)
    .filter(f => fs.statSync(path.join(recordingsDir, f)).isDirectory())
    .map(folder => {
      const metaPath = path.join(recordingsDir, folder, 'session_meta.json');
      let meta = {};
      try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8')); } catch {}
      return {
        folder,
        title: meta.title || folder,
        date: meta.date || '',
        duration: meta.durationMs ? Math.round(meta.durationMs / 1000) : 0,
        speakers: Object.keys(meta.speakers || {}).length,
      };
    })
    .sort((a, b) => b.folder.localeCompare(a.folder));

  res.json(sessions);
});

// Get list of transcripts
app.get('/api/transcripts', (req, res) => {
  const transcriptsDir = path.join(process.cwd(), 'transcriber', 'transcripts');
  if (!fs.existsSync(transcriptsDir)) return res.json([]);

  const files = fs.readdirSync(transcriptsDir)
    .filter(f => f.endsWith('.json'))
    .map(file => {
      const filePath = path.join(transcriptsDir, file);
      let data = {};
      try { data = JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch {}
      return {
        file,
        title: data.title || file,
        date: data.date || '',
        segments: (data.transcript || []).length,
        duration: data.duration || '',
      };
    })
    .sort((a, b) => b.file.localeCompare(a.file));

  res.json(files);
});

// Get a specific transcript
app.get('/api/transcripts/:file', (req, res) => {
  const filePath = path.join(process.cwd(), 'transcriber', 'transcripts', req.params.file);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  res.json(data);
});

// Run transcription
app.post('/api/transcribe', (req, res) => {
  const { folder, preset } = req.body;
  const recordingPath = folder
    ? path.join('recordings', folder)
    : undefined;

  const venvPython = path.join(process.cwd(), 'transcriber', 'venv', 'Scripts', 'python.exe');
  const scriptPath = path.join(process.cwd(), 'transcriber', 'transcribe.py');

  const args = [scriptPath];
  if (recordingPath) args.push(recordingPath);
  args.push('--preset', preset || 'quality');

  const proc = spawn(venvPython, args, { cwd: process.cwd() });

  let output = '';
  let error = '';

  proc.stdout.on('data', (data) => { output += data.toString(); });
  proc.stderr.on('data', (data) => { error += data.toString(); });

  proc.on('close', (code) => {
    if (code === 0) {
      res.json({ success: true, output });
    } else {
      res.json({ success: false, output, error });
    }
  });
});

// Run condenser
app.post('/api/condense', (req, res) => {
  const { file, mode } = req.body;
  const transcriptPath = path.join(process.cwd(), 'transcriber', 'transcripts', file);

  const venvPython = path.join(process.cwd(), 'transcriber', 'venv', 'Scripts', 'python.exe');
  const scriptPath = path.join(process.cwd(), 'transcriber', 'condense.py');

  const args = [scriptPath, transcriptPath, '--mode', mode || 'normal'];

  const proc = spawn(venvPython, args, { cwd: path.join(process.cwd(), 'transcriber') });

  let output = '';
  let error = '';

  proc.stdout.on('data', (data) => { output += data.toString(); });
  proc.stderr.on('data', (data) => { error += data.toString(); });

  proc.on('close', (code) => {
    if (code === 0) {
      res.json({ success: true, output });
    } else {
      res.json({ success: false, output, error });
    }
  });
});

// Get .env config (token presence only, never expose the actual token)
app.get('/api/config', (req, res) => {
  const envPath = path.join(process.cwd(), '.env');
  let hasToken = false;
  let prefix = '!';
  try {
    const content = fs.readFileSync(envPath, 'utf-8');
    hasToken = content.includes('DISCORD_TOKEN=') && !content.includes('your_bot_token_here');
    const prefixMatch = content.match(/PREFIX=(.+)/);
    if (prefixMatch) prefix = prefixMatch[1].trim();
  } catch {}
  res.json({ hasToken, prefix });
});

// Save bot token
app.post('/api/config/token', (req, res) => {
  const { token, prefix } = req.body;
  const envPath = path.join(process.cwd(), '.env');
  const content = `DISCORD_TOKEN=${token}\nPREFIX=${prefix || '!'}\n`;
  fs.writeFileSync(envPath, content);
  res.json({ success: true });
});

function startUI() {
  app.listen(PORT, () => {
    console.log(`Control panel running at http://localhost:${PORT}`);
  });
}

module.exports = { startUI, app };
