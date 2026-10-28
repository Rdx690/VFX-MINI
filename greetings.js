const fs = require('fs');
const path = require('path');

const dataRoot = process.env.DATA_DIR || (fs.existsSync('/data') ? '/data' : path.join(__dirname, 'data'));
const dataFile = path.join(dataRoot, 'vfx-mini-greetings.json');
const cooldowns = new Map();
let schedulerStarted = false;

function readState() {
  try {
    if (!fs.existsSync(dataFile)) return { rules: [{ id: 1, trigger: 'hello', response: '👋 Hello! Welcome to VFX MINI. How can I help you?' }, { id: 2, trigger: 'hi', response: '😊 Hi there! Welcome!' }], schedules: [], nextId: 3 };
    const parsed = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    return { rules: [], schedules: [], nextId: 1, ...parsed };
  } catch (error) {
    console.error('[VFX MINI] Greeting data read error:', error.message);
    return { rules: [], schedules: [], nextId: 1 };
  }
}

function writeState(state) {
  fs.mkdirSync(dataRoot, { recursive: true });
  const tmp = dataFile + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, dataFile);
}

function startScheduler() {
  if (schedulerStarted) return;
  schedulerStarted = true;
  setInterval(async () => {
    const state = readState();
    const now = new Date();
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(now).reduce((acc, p) => (acc[p.type] = p.value, acc), {});
    const dateKey = parts.year + '-' + parts.month + '-' + parts.day;
    const timeKey = parts.hour + ':' + parts.minute;
    let changed = false;
    for (const item of state.schedules) {
      if (!item.enabled || item.time !== timeKey || item.lastSentDate === dateKey) continue;
      try {
        const { getSocket } = module.exports;
        const sock = getSocket && getSocket();
        if (!sock || !sock.user) continue;
        await sock.sendMessage(item.chat, { text: item.message });
        item.lastSentDate = dateKey;
        changed = true;
      } catch (error) {
        console.error('[VFX MINI] Scheduled greeting message failed:', error.message);
      }
    }
    if (changed) writeState(state);
  }, 20000).unref?.();
}

async function handleIncoming(sock, msg, from, text) {
  if (!text || from === 'status@broadcast' || msg.key?.fromMe) return;
  const chatIsGroup = from.endsWith('@g.us');
  const sender = msg.key?.participant || from;
  const cooldownKey = from + ':' + sender;
  const now = Date.now();
  if ((cooldowns.get(cooldownKey) || 0) > now) return;
  const normalized = text.trim().toLowerCase().replace(/[.!?,，。]+$/g, '');
  if (!normalized || normalized.startsWith('.') || normalized.startsWith('/')) return;
  const state = readState();
  const rule = state.rules.find(item => item.trigger && normalized.includes(item.trigger.toLowerCase()));
  if (!rule) return;
  cooldowns.set(cooldownKey, now + 60000);
  await sock.sendMessage(from, { text: rule.response }, { quoted: msg });
}

async function handleCommand({ sock, msg, from, args, isOwner, reply }) {
  const parts = String(args || '').trim();
  const command = (parts.split(/\s+/)[0] || '').toLowerCase();
  const payload = parts.slice(command.length).trim();
  if (!['list', 'create', 'add', 'edit', 'delete', 'remove', 'schedule', 'schedules', 'unschedule', 'help'].includes(command)) {
    await reply('╭━━〔 👋 VFX MINI GREETINGS 〕━━╮\n┃ .greet list\n┃ .greet create hello|reply message\n┃ .greet edit ID|hello|reply message\n┃ .greet delete ID\n┃ .greet schedule HH:MM|message\n┃ .greet schedules\n┃ .greet unschedule ID\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\nGreeting configuration is owner-only. Anyone can receive automatic replies.');
    return true;
  }
  if (command === 'help') {
    await reply('Use .greet list/create/edit/delete/schedule. Create format: .greet create hello|Hello there! Schedule format: .greet schedule 18:30|Good evening! (India time).');
    return true;
  }
  if (!isOwner) {
    await reply('🔒 Greeting rules and scheduled messages can only be managed by the bot owner.');
    return true;
  }
  const state = readState();
  if (command === 'list') {
    await reply('👋 *VFX MINI GREETINGS*\n' + (state.rules.length ? state.rules.map(x => '#' + x.id + ' trigger: "' + x.trigger + '" → ' + x.response).join('\n') : 'No greeting rules yet.'));
    return true;
  }
  if (command === 'create' || command === 'add') {
    const sep = payload.indexOf('|');
    if (sep < 1 || !payload.slice(sep + 1).trim()) {
      await reply('Format: .greet create hello|Hello! Welcome to VFX MINI.');
      return true;
    }
    const rule = { id: state.nextId++, trigger: payload.slice(0, sep).trim().toLowerCase(), response: payload.slice(sep + 1).trim() };
    if (!rule.trigger || rule.trigger.length > 60 || rule.response.length > 1000) {
      await reply('Trigger must be 1–60 characters; reply must be under 1000 characters.');
      return true;
    }
    state.rules.push(rule); writeState(state);
    await reply('✅ Greeting created! ID: ' + rule.id + '\nTrigger: ' + rule.trigger + '\nReply: ' + rule.response);
    return true;
  }
  if (command === 'edit') {
    const fields = payload.split('|');
    if (fields.length < 3) { await reply('Format: .greet edit ID|hello|New reply message'); return true; }
    const item = state.rules.find(x => x.id === Number(fields[0]));
    if (!item) { await reply('❌ Greeting ID not found. Use .greet list'); return true; }
    item.trigger = fields[1].trim().toLowerCase();
    item.response = fields.slice(2).join('|').trim();
    writeState(state);
    await reply('✅ Greeting #' + item.id + ' updated.');
    return true;
  }
  if (command === 'delete' || command === 'remove') {
    const id = Number(payload);
    const before = state.rules.length;
    state.rules = state.rules.filter(x => x.id !== id);
    if (before === state.rules.length) { await reply('❌ Greeting ID not found.'); return true; }
    writeState(state); await reply('🗑️ Greeting #' + id + ' deleted.'); return true;
  }
  if (command === 'schedule') {
    const sep = payload.indexOf('|');
    const time = payload.slice(0, sep).trim();
    const message = payload.slice(sep + 1).trim();
    if (sep < 0 || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !message) {
      await reply('Format: .greet schedule 18:30|Good evening! (time uses India Standard Time)');
      return true;
    }
    const item = { id: state.nextId++, chat: from, time, message, enabled: true, lastSentDate: '' };
    state.schedules.push(item); writeState(state); startScheduler();
    await reply('🗓️ Daily message scheduled! ID: ' + item.id + '\nTime: ' + time + ' IST\nTarget: this chat\nMessage: ' + message);
    return true;
  }
  if (command === 'schedules') {
    await reply('🗓️ *VFX MINI SCHEDULES*\n' + (state.schedules.length ? state.schedules.map(x => '#' + x.id + ' ' + x.time + ' IST → ' + (x.enabled ? 'ON' : 'OFF') + '\n' + x.message).join('\n') : 'No scheduled messages.'));
    return true;
  }
  if (command === 'unschedule') {
    const id = Number(payload);
    const before = state.schedules.length;
    state.schedules = state.schedules.filter(x => x.id !== id);
    if (before === state.schedules.length) { await reply('❌ Schedule ID not found.'); return true; }
    writeState(state); await reply('🗑️ Schedule #' + id + ' removed.'); return true;
  }
  return true;
}

module.exports = {
  handleIncoming,
  handleCommand,
  setSocket(sock) { module.exports.getSocket = () => sock; startScheduler(); }
};
