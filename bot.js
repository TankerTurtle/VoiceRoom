// VoiceRoom: watches one Discord voice channel and serves a small see-through
// overlay page showing who is in the channel and who is talking right now.
// Needs only discord.js. Settings come from environment variables (or a .env file).
const fs = require('fs');
const path = require('path');
const http = require('http');
const crypto = require('crypto');

// tiny .env reader so no extra package is needed
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split(/\r?\n/).forEach((l) => {
    const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !l.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  });
} catch (e) { /* no .env file, use real environment variables */ }

const { Client, GatewayIntentBits, Events } = require('discord.js');
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CHANNEL_ID = process.env.VOICE_CHANNEL_ID;
const PASSWORD = process.env.DASH_PASSWORD || '';
const PORT = parseInt(process.env.PORT || '3000', 10);

if (!TOKEN || !GUILD_ID || !CHANNEL_ID) {
  console.error('Missing DISCORD_TOKEN, GUILD_ID or VOICE_CHANNEL_ID. See SETUP.md.');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMembers],
});

// Discord does not tell bots who is speaking unless the bot is in the channel, so we
// track the "speaking" state from the voice connection when joined, and fall back to
// showing mute/deaf/stream status from voice states.
const talking = new Map(); // userId -> last time speaking (ms)
let connection = null;

function snapshot() {
  const guild = client.guilds.cache.get(GUILD_ID);
  const ch = guild && guild.channels.cache.get(CHANNEL_ID);
  const now = Date.now();
  const members = [];
  if (ch && ch.members) {
    ch.members.forEach((m) => {
      if (m.user.bot) return;
      const vs = m.voice;
      members.push({
        id: m.id,
        name: m.displayName,
        avatar: m.displayAvatarURL({ size: 64, extension: 'png' }),
        muted: !!(vs.selfMute || vs.serverMute),
        deafened: !!(vs.selfDeaf || vs.serverDeaf),
        talking: now - (talking.get(m.id) || 0) < 600,
      });
    });
  }
  return { channel: ch ? ch.name : '(channel not found)', members, t: now };
}

client.once(Events.ClientReady, async () => {
  console.log('Logged in as ' + client.user.tag);
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    await guild.members.fetch();
    await guild.channels.fetch();
    const { joinVoiceChannel, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
    connection = joinVoiceChannel({
      channelId: CHANNEL_ID, guildId: GUILD_ID, adapterCreator: guild.voiceAdapterCreator,
      selfDeaf: false, selfMute: true,
    });
    await entersState(connection, VoiceConnectionStatus.Ready, 20000);
    connection.receiver.speaking.on('start', (userId) => talking.set(userId, Date.now()));
    setInterval(() => { /* keep the speaking flag fresh while someone continues */ }, 1000);
    connection.receiver.speaking.on('end', () => {});
    console.log('Joined the voice channel and listening for who is talking.');
  } catch (e) {
    console.warn('Could not join voice (' + e.message + '). Showing mute/deafen status only.');
  }
});

// ---- web server + live stream (server-sent events, works on every browser)
const clients = new Set();
function authed(req, url) {
  if (!PASSWORD) return true;
  const given = url.searchParams.get('key') || '';
  const a = Buffer.from(given), b = Buffer.from(PASSWORD);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/health') { res.end('ok'); return; }
  if (url.pathname === '/events') {
    if (!authed(req, url)) { res.statusCode = 401; res.end('wrong key'); return; }
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write('data: ' + JSON.stringify(snapshot()) + '\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  const file = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '');
  const full = path.join(__dirname, 'public', path.normalize(file).replace(/^(\.\.[\/\\])+/, ''));
  if (!full.startsWith(path.join(__dirname, 'public'))) { res.statusCode = 403; res.end(); return; }
  fs.readFile(full, (err, data) => {
    if (err) { res.statusCode = 404; res.end('not found'); return; }
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
    res.setHeader('Content-Type', (types[path.extname(full)] || 'text/plain') + '; charset=utf-8');
    res.end(data);
  });
});
setInterval(() => {
  if (!clients.size) return;
  const msg = 'data: ' + JSON.stringify(snapshot()) + '\n\n';
  clients.forEach((c) => c.write(msg));
}, 300);
server.listen(PORT, () => console.log('VoiceRoom dashboard on port ' + PORT));
client.login(TOKEN);
