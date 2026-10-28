const fs = require('fs');
const path = require('path');
const commandMap = new Map();
function loadCommands(dir = __dirname) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) { loadCommands(fullPath); continue; }
    if (!entry.isFile() || !entry.name.endsWith('.js') || fullPath === __filename) continue;
    try {
      const command = require(fullPath);
      if (!command || typeof command.execute !== 'function' || !command.name) continue;
      commandMap.set(String(command.name).toLowerCase(), command);
      for (const alias of command.aliases || []) commandMap.set(String(alias).toLowerCase(), command);
    } catch (error) { console.error('[VFX MINI] Command load error:', fullPath, error.message); }
  }
}
loadCommands();
async function execute(name, context) {
  const command = commandMap.get(String(name || '').toLowerCase());
  if (!command) return false;
  if (command.ownerOnly && !context.msg?.key?.fromMe) {
    await context.reply('⛔ This command is available to the bot owner only.');
    return true;
  }
  try { await command.execute(context); }
  catch (error) {
    console.error('[VFX MINI] Command error:', name, error);
    await context.reply('❌ Command failed. Check the bot logs.');
  }
  return true;
}
module.exports = { execute };
