module.exports = {
  name: 'categories',
  aliases: ['category', 'cmds'],
  category: 'general',
  description: 'List VFX MINI command categories',
  async execute({ reply }) {
    await reply([
      '╭━━〔 ⚡ VFX MINI • COMMAND HUB 〕━━╮',
      '┃ 🛡️ admin — group controls (being built)',
      '┃ 🧠 ai — AI integrations (being built)',
      '┃ 🎌 anime — anime tools (being built)',
      '┃ 🎉 fun — entertainment (being built)',
      '┃ 🎮 games — chat games (being built)',
      '┃ 🧰 general — .ping .uptime .alive .repo',
      '┃ 🎬 media — media tools (legacy commands available)',
      '┃ 👑 owner — .restart',
      '┃ ✍️ textmaker — text styling (being built)',
      '┃ 🔧 utility — utilities (legacy commands available)',
      '┃ 👋 greetings — .greet list/create/edit/delete/schedule',
      '╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯',
      '',
      'Use .menu for the full menu. New category modules are added and tested incrementally.'
    ].join('\n'));
  }
};
