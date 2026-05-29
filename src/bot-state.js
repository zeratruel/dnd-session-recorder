/**
 * Shared state module for the bot.
 * Allows the UI server to query bot status without circular dependencies.
 */

let _botOnline = false;
let _activeSession = null;
let _connectedGuilds = [];

module.exports = {
  setBotOnline(online) { _botOnline = online; },
  isBotOnline() { return _botOnline; },

  setActiveSession(session) {
    if (session) {
      _activeSession = {
        title: session.title,
        startTime: session.startTime,
        speakers: session.getSpeakerCount(),
        duration: session.getDuration(),
      };
    } else {
      _activeSession = null;
    }
  },
  getActiveSession() { return _activeSession; },

  setConnectedGuilds(guilds) { _connectedGuilds = guilds; },
  getConnectedGuilds() { return _connectedGuilds; },
};
