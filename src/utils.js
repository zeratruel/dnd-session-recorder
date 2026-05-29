const fs = require('fs');
const path = require('path');

/**
 * Load the raw character map config from config/characters.json
 * Keys can be either Discord user IDs or display names.
 */
function loadCharacterConfig() {
  const configPath = path.join(process.cwd(), 'config', 'characters.json');

  try {
    const raw = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Could not load character map:', err.message);
    return { characterMap: {}, dmUsername: "" };
  }
}

/**
 * Resolve the character map against actual guild members.
 * Supports both user IDs and display names as keys.
 * Returns a map of userId -> characterName.
 */
async function resolveCharacterMap(guild) {
  const config = loadCharacterConfig();
  const rawMap = config.characterMap || {};
  const resolved = {};

  // Fetch guild members so we can match by display name
  let members;
  try {
    members = await guild.members.fetch();
  } catch (err) {
    console.warn('Could not fetch guild members:', err.message);
    // Fall back to treating all keys as user IDs
    return rawMap;
  }

  for (const [key, characterName] of Object.entries(rawMap)) {
    // Check if the key looks like a user ID (all digits, 17-20 chars)
    if (/^\d{17,20}$/.test(key)) {
      resolved[key] = characterName;
    } else {
      // Treat as a display name — find the matching member
      const member = members.find(m =>
        m.displayName.toLowerCase() === key.toLowerCase() ||
        m.user.username.toLowerCase() === key.toLowerCase() ||
        m.user.globalName?.toLowerCase() === key.toLowerCase()
      );

      if (member) {
        resolved[member.id] = characterName;
      } else {
        console.warn(`Could not find member "${key}" in server. Skipping.`);
      }
    }
  }

  return resolved;
}

/**
 * Convert seconds to a human-readable duration string
 */
function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

module.exports = { loadCharacterConfig, resolveCharacterMap, formatDuration };
