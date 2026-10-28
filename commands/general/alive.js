module.exports = {
  name: 'alive',
  aliases: ['status'],
  category: 'general',
  description: 'Show VFX MINI status',
  async execute({ reply }) {
    const seconds = Math.floor(process.uptime());
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const ram = Math.round(process.memoryUsage().rss / 1024 / 1024);
    await reply('╭━━〔 ⚡ VFX MINI • ALIVE 〕━━╮\n┃ 🟢 Status: Running\n┃ ⏱️ Uptime: ' + hours + 'h ' + minutes + 'm\n┃ 🧠 Memory: ' + ram + ' MB\n╰━━━━━━━━━━━━━━━━━━━━━━╯');
  }
};
