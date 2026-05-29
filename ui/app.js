// --- Tab Navigation ---
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
  });
});

// --- Status Polling ---
async function updateStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    const badge = document.getElementById('bot-status');
    if (data.botOnline) {
      badge.textContent = 'Bot Online';
      badge.className = 'status-badge online';
    } else {
      badge.textContent = 'Bot Offline';
      badge.className = 'status-badge offline';
    }
  } catch {
    // Server not responding
  }
}

setInterval(updateStatus, 5000);
updateStatus();

// --- Recordings ---
async function loadRecordings() {
  const res = await fetch('/api/recordings');
  const recordings = await res.json();
  const list = document.getElementById('recordings-list');

  if (recordings.length === 0) {
    list.innerHTML = '<p class="empty-state">No recordings yet. Use <code>!session start "Title"</code> in Discord to begin.</p>';
    return;
  }

  list.innerHTML = recordings.map(r => `
    <div class="card">
      <div class="card-info">
        <h4>${r.title}</h4>
        <span class="meta">${r.date} · ${formatDuration(r.duration)} · ${r.speakers} speaker${r.speakers !== 1 ? 's' : ''}</span>
      </div>
      <div class="card-actions">
        <button class="btn btn-small" onclick="openTranscribeModal('${r.folder}', '${r.title}')">Transcribe</button>
      </div>
    </div>
  `).join('');
}

// --- Transcripts ---
async function loadTranscripts() {
  const res = await fetch('/api/transcripts');
  const transcripts = await res.json();
  const list = document.getElementById('transcripts-list');

  if (transcripts.length === 0) {
    list.innerHTML = '<p class="empty-state">No transcripts yet. Transcribe a recording to get started.</p>';
    return;
  }

  list.innerHTML = transcripts.map(t => `
    <div class="card">
      <div class="card-info">
        <h4>${t.title}</h4>
        <span class="meta">${t.date} · ${t.segments} segments · ${t.duration}</span>
      </div>
      <div class="card-actions">
        <button class="btn btn-small" onclick="viewTranscript('${t.file}')">View</button>
        <button class="btn btn-small" onclick="openCondenseModal('${t.file}', '${t.title}')">Condense</button>
      </div>
    </div>
  `).join('');
}

async function viewTranscript(file) {
  const res = await fetch(`/api/transcripts/${file}`);
  const data = await res.json();

  document.getElementById('viewer-title').textContent = data.title;
  document.getElementById('viewer-content').textContent = data.notes;
  document.getElementById('transcript-viewer').classList.remove('hidden');
}

document.getElementById('close-viewer').addEventListener('click', () => {
  document.getElementById('transcript-viewer').classList.add('hidden');
});

// --- Transcribe Modal ---
let transcribeFolder = '';

function openTranscribeModal(folder, title) {
  transcribeFolder = folder;
  document.getElementById('transcribe-target').textContent = `Recording: ${title}`;
  document.getElementById('transcribe-modal').classList.remove('hidden');
  document.getElementById('transcribe-progress').classList.add('hidden');
  document.getElementById('transcribe-result').classList.add('hidden');
}

document.getElementById('transcribe-cancel').addEventListener('click', () => {
  document.getElementById('transcribe-modal').classList.add('hidden');
});

document.getElementById('transcribe-start').addEventListener('click', async () => {
  const preset = document.getElementById('transcribe-preset').value;
  document.getElementById('transcribe-progress').classList.remove('hidden');
  document.getElementById('transcribe-start').disabled = true;

  try {
    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: transcribeFolder, preset }),
    });
    const data = await res.json();

    document.getElementById('transcribe-progress').classList.add('hidden');
    const result = document.getElementById('transcribe-result');
    result.classList.remove('hidden');

    if (data.success) {
      result.innerHTML = `<p class="status-msg success">✓ Transcription complete!</p><pre style="font-size:0.75rem;color:#aaa;margin-top:0.5rem;white-space:pre-wrap;">${data.output}</pre>`;
      loadTranscripts();
    } else {
      result.innerHTML = `<p class="status-msg error">✗ Transcription failed</p><pre style="font-size:0.75rem;color:#cf6f6f;margin-top:0.5rem;white-space:pre-wrap;">${data.error || data.output}</pre>`;
    }
  } catch (err) {
    document.getElementById('transcribe-progress').classList.add('hidden');
    document.getElementById('transcribe-result').innerHTML = `<p class="status-msg error">✗ Error: ${err.message}</p>`;
    document.getElementById('transcribe-result').classList.remove('hidden');
  }

  document.getElementById('transcribe-start').disabled = false;
});

// --- Condense Modal ---
let condenseFile = '';

function openCondenseModal(file, title) {
  condenseFile = file;
  document.getElementById('condense-target').textContent = `Transcript: ${title}`;
  document.getElementById('condense-modal').classList.remove('hidden');
  document.getElementById('condense-progress').classList.add('hidden');
  document.getElementById('condense-result').classList.add('hidden');
}

document.getElementById('condense-cancel').addEventListener('click', () => {
  document.getElementById('condense-modal').classList.add('hidden');
});

document.getElementById('condense-start').addEventListener('click', async () => {
  const mode = document.getElementById('condense-mode').value;
  document.getElementById('condense-progress').classList.remove('hidden');
  document.getElementById('condense-start').disabled = true;

  try {
    const res = await fetch('/api/condense', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ file: condenseFile, mode }),
    });
    const data = await res.json();

    document.getElementById('condense-progress').classList.add('hidden');
    const result = document.getElementById('condense-result');
    result.classList.remove('hidden');

    if (data.success) {
      result.innerHTML = `<p class="status-msg success">✓ Condensed!</p><pre style="font-size:0.75rem;color:#aaa;margin-top:0.5rem;white-space:pre-wrap;">${data.output}</pre>`;
      loadTranscripts();
    } else {
      result.innerHTML = `<p class="status-msg error">✗ Failed</p><pre style="font-size:0.75rem;color:#cf6f6f;margin-top:0.5rem;white-space:pre-wrap;">${data.error || data.output}</pre>`;
    }
  } catch (err) {
    document.getElementById('condense-progress').classList.add('hidden');
    document.getElementById('condense-result').innerHTML = `<p class="status-msg error">✗ Error: ${err.message}</p>`;
    document.getElementById('condense-result').classList.remove('hidden');
  }

  document.getElementById('condense-start').disabled = false;
});

// --- Characters ---
async function loadCharacters() {
  const res = await fetch('/api/characters');
  const data = await res.json();
  const entries = document.getElementById('character-entries');
  const map = data.characterMap || {};

  entries.innerHTML = '';
  for (const [name, character] of Object.entries(map)) {
    addCharacterEntry(name, character);
  }

  document.getElementById('dm-username').value = data.dmUsername || '';
}

function addCharacterEntry(name = '', character = '') {
  const entries = document.getElementById('character-entries');
  const div = document.createElement('div');
  div.className = 'character-entry';
  div.innerHTML = `
    <input type="text" placeholder="Discord name" value="${name}">
    <input type="text" placeholder="Character name" value="${character}">
    <button class="remove-btn" onclick="this.parentElement.remove()">×</button>
  `;
  entries.appendChild(div);
}

document.getElementById('add-character').addEventListener('click', () => {
  addCharacterEntry();
});

document.getElementById('save-characters').addEventListener('click', async () => {
  const entries = document.querySelectorAll('.character-entry');
  const characterMap = {};

  entries.forEach(entry => {
    const inputs = entry.querySelectorAll('input');
    const name = inputs[0].value.trim();
    const character = inputs[1].value.trim();
    if (name && character) {
      characterMap[name] = character;
    }
  });

  const dmUsername = document.getElementById('dm-username').value.trim();

  const res = await fetch('/api/characters', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterMap, dmUsername }),
  });

  const status = document.getElementById('characters-status');
  if (res.ok) {
    status.textContent = '✓ Saved!';
    status.className = 'status-msg success';
  } else {
    status.textContent = '✗ Failed to save';
    status.className = 'status-msg error';
  }
  setTimeout(() => { status.textContent = ''; }, 3000);
});

// --- Settings ---
async function loadSettings() {
  const res = await fetch('/api/config');
  const data = await res.json();
  document.getElementById('cmd-prefix').value = data.prefix || '!';
  if (data.hasToken) {
    document.getElementById('bot-token').placeholder = '••••••••• (token configured)';
  }
}

document.getElementById('save-settings').addEventListener('click', async () => {
  const token = document.getElementById('bot-token').value.trim();
  const prefix = document.getElementById('cmd-prefix').value.trim() || '!';

  if (!token) {
    const status = document.getElementById('settings-status');
    status.textContent = 'Enter a token to save';
    status.className = 'status-msg error';
    return;
  }

  const res = await fetch('/api/config/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, prefix }),
  });

  const status = document.getElementById('settings-status');
  if (res.ok) {
    status.textContent = '✓ Saved! Restart the bot for changes to take effect.';
    status.className = 'status-msg success';
    document.getElementById('bot-token').value = '';
    document.getElementById('bot-token').placeholder = '••••••••• (token configured)';
  } else {
    status.textContent = '✗ Failed to save';
    status.className = 'status-msg error';
  }
});

// --- Helpers ---
function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// --- Init ---
loadRecordings();
loadTranscripts();
loadCharacters();
loadSettings();
